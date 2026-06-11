---
name: Vault Architecture
description: How the vault PIN gate works — Firestore collection, fields, tracking logic, and why no hashing.
---

## Rule
The vault uses collection `vault`, document `config`. PIN is stored as plain text. All attempt tracking lives in Firestore (not localStorage) so it survives browser clears.

**Why:** Platform is hosted on Netlify — no backend. SHA-256 hashing was removed because Firestore rules can't hash client-supplied values server-side, so a hash stored in Firestore can be replicated and brute-forced offline. Plain text with rate-limiting (5 tries, 15-min lockout tracked in Firestore) is equivalent security with no backend.

## Firestore doc: `vault/config`
| Field | Type | Notes |
|---|---|---|
| `status` | `'active' \| 'inactive' \| ''` | Super admin controls via Platform Settings |
| `pin` | `string` | Plain text; only super admin can write |
| `lastTimeVisit` | ISO string \| `''` | Updated by gate on every visit |
| `countTryNumber` | `number` | Incremented on each wrong PIN attempt |
| `lastLockTime` | ISO string \| `''` | Set after 5 wrong attempts; cleared after 15 min or correct PIN |

## Firestore rules (vault collection)
- `read`: public (gate must read status + PIN before auth)
- `create/delete`: super admin only
- `update`: super admin OR (unauthenticated, but ONLY affecting `lastTimeVisit`, `countTryNumber`, `lastLockTime`)

## VaultGate logic
1. Load `vault/config` — if status != 'active' or no PIN, pass through
2. Check `sessionStorage` — if already unlocked, pass through
3. If `lastLockTime` set: check if 15 min elapsed → if yes, reset fields; if no, show countdown
4. Update `lastTimeVisit` to now
5. Show PIN entry screen
6. Correct PIN → reset `countTryNumber`+`lastLockTime` to '' → sessionStorage unlock
7. Wrong PIN → increment `countTryNumber`; on 5th → set `lastLockTime`

## How to apply
Any change to vault gate logic must update both `VaultGate.tsx` and the `vault` collection Firestore rules in `firestore.rules`.
