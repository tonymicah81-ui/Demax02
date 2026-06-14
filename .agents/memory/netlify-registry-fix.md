---
name: Netlify Registry Fix
description: Replit injects its internal npm registry into package-lock.json, breaking Netlify deployments with ENOTFOUND errors. Must run sed fix after every npm install before committing.
---

## The Problem

Replit injects `package-firewall.replit.local` as the npm registry at the system level. This cannot be overridden by `.npmrc` or `npm_config_registry` env vars inside Replit. Every `npm install` rewrites all resolved URLs in `package-lock.json` to point to this internal Replit host.

When this lockfile is committed and Netlify clones the repo, `npm install` tries to fetch packages from `package-firewall.replit.local` — a host that only exists inside Replit's network. The result is `ENOTFOUND` DNS errors and a completely failed install. This also triggered the `npm error Exit handler never called!` bug in npm 10.8.x.

## The Fix

After any `npm install` inside Replit, before committing `package-lock.json`, always run:

```bash
sed -i 's|http://package-firewall.replit.local/npm|https://registry.npmjs.org|g' package-lock.json
```

Then verify:
```bash
grep -c "replit.local" package-lock.json
# must be 0
```

## What Was Done

- Added `.npmrc` to repo root with `registry=https://registry.npmjs.org/` as a safety net for Netlify
- Patched `package-lock.json` with the sed command above (was 128 dirty refs, now 0)
- `NODE_VERSION = "20"` in `netlify.toml` (react-router-dom v7 requires Node >=20)
- `cloudinary` moved out of root `package.json` into `netlify/functions/package.json` (was causing npm crashes)

**Why:** The project deploys to Netlify via GitHub. Lockfile URLs must point to public npm registry for Netlify to install dependencies.

**How to apply:** Every single time you run `npm install` or `npm install <package>` inside this Replit project, run the sed command above before committing `package-lock.json`. No exceptions.
