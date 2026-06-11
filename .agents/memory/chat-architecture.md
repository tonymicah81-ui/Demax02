---
name: Chat Architecture
description: Key decisions in the chat system — what's self-contained vs delegated, spec rules about user visibility, and file upload design.
---

## Rule 1 — MessageBubble handles its own editing
`editMessage()` from `chatService.ts` is imported directly inside `MessageBubble.tsx`. No `onEdit` callback is passed from parent pages. When admin clicks Edit, the bubble transforms into an inline textarea with Save/Cancel.

**Why:** Keeps the edit state co-located with the UI that shows it. Parent pages (Chats.tsx, Support.tsx) don't need to know which message is being edited.

**How to apply:** `ChatContainer` and page files must NOT pass an `onEdit` prop to `ChatContainer` or `MessageBubble`. Only `onReply` and `onDelete` are passed from parent.

## Rule 2 — Deleted admin messages are invisible to users
In `MessageBubble.tsx`, if `!isAdminView && message.deleted && message.senderRole === "admin"` → return null. The user sees nothing.

In admin view, deleted messages show "Message deleted" (italic, dimmed). The "REDACTED_BY_SUPPORT" label is removed.

**Why:** Original spec says "user will not see if message is edited or deleted from admin or support team." This is a strict spec requirement.

**How to apply:** The `edited` timestamp label below the bubble is also gated on `isAdminView` — users never see "edited" either.

## Rule 3 — File upload uses per-file AbortController + localStorage cache
`ChatInput.tsx` tracks each file as a `FileEntry` with its own `AbortController`. Each file shows an individual progress bar (0–100%). Cancel button per file.

`cloudinary.ts` exports `checkFileCache(file)` which returns a cached result from localStorage keyed by `name_size_lastModified`. If cached, upload skips immediately. After upload, result is saved to localStorage.

**Why:** Avoids re-uploading the same file multiple times (cost reduction per original spec).

## Rule 4 — FileViewer is a portal-based lightbox
`src/components/chat/FileViewer.tsx` uses `createPortal(…, document.body)`. Images support zoom in/out. Videos autoplay. Documents show an "Open Document" link (device viewer). ESC or click outside closes it.

**How to apply:** Click on any file/image in a MessageBubble opens this viewer. It's triggered by `viewingFile` state inside MessageBubble.

## Typing indicator
- Typing state stored in `conversations/{id}/typing.admin` and `typing.user` (boolean fields)
- ChatInput calls `typingRef(text.length > 0)` on every keystroke — parent updates Firestore
- ChatContainer shows animated 3-dot indicator + "typing..." label (AnimatePresence)
- Label is "typing..." (not "Transmitting Activity...")

## Date separators
- "Today" / "Yesterday" / "MMMM d, yyyy" format — no jargon labels
