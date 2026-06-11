# Security Specification: Durex Team Operations

## 1. Data Invariants
- **User Integrity**: A user cannot modify their own `balance`, `role`, or `status`. These are "System-Locked" fields.
- **Financial Atomicity**: Transactions must match the user's `balance` update. (Enforced via Cloud Functions later, but blocked in Rules).
- **Relational Ownership**: A `Project` or `Fix` cannot exist without a `userId` that matches the authenticated user's UID.
- **Audit Immutability**: `audit_logs` are write-only for admins and read-only for Super Admins. No updates or deletes allowed.
- **Chat Privacy**: Messages can only be read/written by participants (User or Staff).

## 2. The "Dirty Dozen" Payloads (Deny List)

1.  **Balance Injection**: `db.collection('users').doc(myUid).update({ balance: 999999 })`
2.  **Privilege Escalation**: `db.collection('users').doc(myUid).update({ role: 'super_admin' })`
3.  **Cross-User Data Leak**: `db.collection('projects').where('userId', '==', 'target_victim_uid').get()`
4.  **Audit Log Erasure**: `db.collection('audit_logs').doc(logId).delete()`
5.  **Shadow Project Creation**: `db.collection('projects').add({ name: 'Stealth', userId: 'another_user_uid' })`
6.  **Unverified Subscription Modification**: `db.collection('subscription_models').doc(id).update({ price: 0.1 })`
7.  **Unauthenticated Broadcast**: `db.collection('user_notifications').add({ userId: 'all', message: 'Hacked' })`
8.  **Orphaned Fix Request**: `db.collection('fixes').add({ projectId: 'non_existent', description: '...' })`
9.  **Unauthorized Message Peek**: `db.collection('chats').doc(victimChatId).get()`
10. **System Config Tampering**: `db.collection('system_config').doc('main').update({ paymentDetails: 'scammer_address' })`
11. **Status Spoofing**: `db.collection('projects').doc(myId).update({ status: 'delivered' })` (Users should not be able to mark their own projects as delivered).
12. **Spam Message Burst**: `db.collection('chats').doc(id).collection('messages').add({ ..., text: 'A'.repeat(1000000) })`

## 3. The Test Runner Plan
We will implement `firestore.rules` that explicitly block these payloads using helper functions for `isAdmin`, `isOwner`, and `isValid[Entity]`.
