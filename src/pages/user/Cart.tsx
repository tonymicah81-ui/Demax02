import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Trash2, 
  ArrowRight, 
  Wallet,
  ShieldCheck,
  CreditCard,
  Loader2,
  PackageCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../AuthContext";
import { cn } from "../../utils/cn";
import { db, collection, query, where, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp, runTransaction } from "../../firebase";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
}

export default function Cart() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "carts"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CartItem[]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const removeItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "carts", id));
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotal = () => items.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (!user || !profile) return;
    const total = calculateTotal();

    if (profile.balance < total) {
      alert("Insufficient funds in fiscal terminal. Please add funds to proceed.");
      window.location.href = "/wallet";
      return;
    }

    setCheckingOut(true);
    try {
      // Use Firestore transaction for balance update and checkout
      await runTransaction(db, async (tx) => {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await tx.get(userRef);
        if (!userDoc.exists()) throw "User not found";
        
        const currentBalance = userDoc.data().balance || 0;
        if (currentBalance < total) throw "Insufficient funds";

        // Deduct balance
        tx.update(userRef, { balance: currentBalance - total });

        // Add transaction record
        const txRef = doc(collection(db, "transactions"));
        tx.set(txRef, {
          userId: user.uid,
          type: "payment",
          amount: -total,
          status: "completed",
          description: `Marketplace Checkout: ${items.length} items`,
          createdAt: serverTimestamp(),
        });

        // Add to User Notifications
        const notifRef = doc(collection(db, "user_notifications"));
        tx.set(notifRef, {
          userId: user.uid,
          title: "Assets Acquired",
          message: `Your payment of $${total.toFixed(2)} for marketplace assets was successful.`,
          read: false,
          createdAt: serverTimestamp(),
        });

        // Clear cart
        items.forEach(item => {
           const cartItemRef = doc(db, "carts", item.id);
           tx.delete(cartItemRef);
        });
      });

      alert("Deployment successful. Your assets are being provisioned.");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert("Transaction failed: " + err);
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
     return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
           <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Cart Data...</p>
        </div>
     );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Checkout Terminal</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Ready for Deployment // Protocol Verification
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-32 text-center space-y-6 opacity-30">
           <ShoppingCart className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-700" />
           <p className="text-xl font-black uppercase tracking-widest">Cart Buffer Empty</p>
           <Button variant="outline" onClick={() => window.location.href = '/marketplace'}>Return to Marketplace</Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="flex items-center gap-6 p-4 border shadow-sm group">
                       <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 border border-brand-border dark:border-white/5">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                          <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">{item.name}</h3>
                          <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase">Asset_ID: {item.productId.slice(0,8)}</p>
                          <div className="mt-4 flex items-center gap-4">
                             <span className="text-brand-success font-black italic text-lg">${item.price}</span>
                             <button 
                               onClick={() => removeItem(item.id)}
                               className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 hover:underline transition-all"
                             >
                               <Trash2 className="w-3 h-3" /> Remove_Asset
                             </button>
                          </div>
                       </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>

           <div className="space-y-8">
              <Card className="bg-white dark:bg-slate-900 border-none shadow-2xl relative overflow-hidden">
                 <CardTitle className="uppercase italic tracking-tighter text-sm mb-8">Summary Protocol</CardTitle>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold uppercase">
                       <span className="text-slate-400">Total Items</span>
                       <span className="text-brand-text-bold dark:text-white">{items.length} Units</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase">
                       <span className="text-slate-400">Current Balance</span>
                       <span className={cn(
                          "font-black italic",
                          (profile?.balance || 0) < calculateTotal() ? "text-red-500" : "text-brand-success"
                       )}>${profile?.balance?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="pt-6 border-t border-brand-border dark:border-white/5 flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Valuation</span>
                       <span className="text-4xl font-black text-brand-text-bold dark:text-white italic tracking-tighter">${calculateTotal().toFixed(2)}</span>
                    </div>
                 </div>

                 <Button 
                    disabled={checkingOut}
                    onClick={handleCheckout}
                    className="w-full h-16 bg-brand-success hover:bg-green-600 text-white shadow-xl shadow-green-500/20 mt-10 rounded-2xl gap-3"
                 >
                    {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PackageCheck className="w-5 h-5" /> INITIALIZE DEPLOYMENT</>}
                 </Button>

                 <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-brand-border dark:border-white/5 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-brand-success shrink-0" />
                    <p className="text-[9px] text-slate-500 uppercase font-bold leading-relaxed">
                       Transaction secured by Durex DT-Protocol. Funds will be deducted from your fiscal balance upon authorization.
                    </p>
                 </div>
              </Card>

              <Card className="border border-brand-accent/20 bg-brand-accent/5">
                 <div className="flex items-center gap-4 text-brand-accent mb-4">
                    <Wallet className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Assets?</span>
                 </div>
                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase mb-6 italic">
                    Need more capital for this deployment? Access the fiscal terminal to add funds.
                 </p>
                 <Button variant="outline" size="sm" className="w-full text-[10px] border-brand-accent/20 text-brand-accent hover:bg-brand-accent/10" onClick={() => window.location.href = '/wallet'}>ACCESS_WALLET</Button>
              </Card>
           </div>
        </div>
      )}
    </div>
  );
}
