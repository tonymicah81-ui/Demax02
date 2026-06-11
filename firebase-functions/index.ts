import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * PHASE 3: PROJECT GUARDIAN (Scheduled Expiry Check)
 * Runs every day to check for expiring projects.
 */
export const checkProjectExpiry = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  const expiringSoonThreshold = admin.firestore.Timestamp.fromDate(threeDaysFromNow);

  // 1. Alert users for projects expiring in 3 days
  const soonSnap = await db.collection("projects")
    .where("expiryDate", "<=", expiringSoonThreshold)
    .where("expiryDate", ">", now)
    .where("expiryNotificationSent", "==", false)
    .get();

  const alertPromises = soonSnap.docs.map(async (doc) => {
    const project = doc.data();
    await db.collection("user_notifications").add({
      userId: project.userId,
      title: "PROJ_EXPIRY_WARNING",
      message: `Operational alert: Project '${project.name}' expires in less than 72 hours. Protocol renewal required.`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return doc.ref.update({ expiryNotificationSent: true });
  });

  // 2. Suspend expired projects
  const expiredSnap = await db.collection("projects")
    .where("expiryDate", "<=", now)
    .where("status", "!=", "suspended")
    .get();

  const suspendPromises = expiredSnap.docs.map(async (doc) => {
    const project = doc.data();
    await db.collection("user_notifications").add({
      userId: project.userId,
      title: "PROJ_SUSPENDED",
      message: `Critical alert: Project '${project.name}' has expired. Infrastructure suspended.`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return doc.ref.update({ status: "suspended" });
  });

  await Promise.all([...alertPromises, ...suspendPromises]);
  console.log(`Processed ${alertPromises.length} alerts and ${suspendPromises.length} suspensions.`);
});

/**
 * PHASE 3: WALLET GUARD (Atomic Transaction Approval)
 * Triggered when an admin updates a transaction status to 'approved'.
 */
export const onTransactionUpdate = functions.firestore
  .document('transactions/{transactionId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only proceed if transition is to 'approved' or 'completed'
    if (newData.status === 'approved' && oldData.status !== 'approved' && newData.type === 'deposit') {
      const userId = newData.userId;
      const amount = newData.amount;

      const userRef = db.collection('users').doc(userId);

      return db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("Target user node not found.");

        const currentBalance = userDoc.data()?.balance || 0;
        const newBalance = currentBalance + amount;

        transaction.update(userRef, { balance: newBalance });
        transaction.update(change.after.ref, { 
          status: 'completed',
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Add success notification
        transaction.set(db.collection('user_notifications').doc(), {
          userId: userId,
          title: "DEPOSIT_SUCCESS",
          message: `Fiscal relay complete: Your balance has been credited with $${amount}. New balance: $${newBalance}.`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    }
  });
