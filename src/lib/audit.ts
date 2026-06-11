import { db, collection, addDoc, serverTimestamp } from "../firebase";

export async function logAudit(admin: { uid: string; email: string | null }, action: string, details: string, entityId?: string, entityType?: string) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      adminId: admin.uid,
      adminEmail: admin.email,
      action,
      details,
      entityId: entityId || "N/A",
      entityType: entityType || "N/A",
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
