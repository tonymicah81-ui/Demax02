import { db, collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "../firebase";

const VISITOR_ID_KEY = "dt_vid";

export function getOrCreateVisitorId(): string {
  let vid = localStorage.getItem(VISITOR_ID_KEY);
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, vid);
  }
  return vid;
}

export async function addToVisitorCart(product: {
  id: string;
  name: string;
  price: number;
  image: string;
}): Promise<void> {
  const visitorId = getOrCreateVisitorId();
  await addDoc(collection(db, "visitor_carts"), {
    visitorId,
    productId: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    addedAt: serverTimestamp(),
  });
}

export async function getVisitorCartItems(): Promise<any[]> {
  const visitorId = getOrCreateVisitorId();
  const q = query(collection(db, "visitor_carts"), where("visitorId", "==", visitorId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function removeFromVisitorCart(itemId: string): Promise<void> {
  await deleteDoc(doc(db, "visitor_carts", itemId));
}

export async function transferVisitorCartToUser(userId: string): Promise<void> {
  const visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) return;

  try {
    const q = query(collection(db, "visitor_carts"), where("visitorId", "==", visitorId));
    const snap = await getDocs(q);
    if (snap.empty) return;

    await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        await addDoc(collection(db, "carts"), {
          userId,
          productId: data.productId,
          name: data.name,
          price: data.price,
          image: data.image,
        });
        await deleteDoc(doc(db, "visitor_carts", d.id));
      })
    );
  } catch (err) {
    console.error("Visitor cart transfer failed:", err);
  }
}
