import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Receipt, Package, Loader2, X, Printer, CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../AuthContext";
import { cn } from "../../utils/cn";
import { db, collection, query, where, onSnapshot, orderBy } from "../../firebase";

interface OrderItem { name: string; price: number; }
interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  receiptNumber: string;
  transactionId: string;
  createdAt: any;
}

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-brand-success/10 text-brand-success",
  processing: "bg-brand-accent/10 text-brand-accent",
  cancelled: "bg-red-500/10 text-red-500",
  pending: "bg-amber-500/10 text-amber-500",
};

export default function Orders() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Order History</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Deployment Ledger // {orders.length} Transaction(s)
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Total Spent: <span className="text-brand-success font-black">${orders.reduce((s, o) => s + o.total, 0).toFixed(2)}</span>
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="py-32 text-center space-y-6 opacity-30">
          <Package className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-xl font-black uppercase tracking-widest">No Orders Yet</p>
          <p className="text-sm text-slate-400">Visit the Marketplace to purchase assets</p>
          <Button onClick={() => window.location.href = "/marketplace"} variant="outline">Browse Marketplace</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-none bg-white dark:bg-slate-900 shadow-md hover:shadow-lg transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-brand-border dark:border-white/5 shrink-0">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic">
                          {order.items?.length || 0} Item(s) — ${order.total?.toFixed(2)}
                        </h3>
                        <span className={cn("text-[8px] font-black uppercase py-0.5 px-2 rounded-full", STATUS_STYLE[order.status] || "bg-slate-100 text-slate-500")}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase">
                        Receipt: {order.receiptNumber} · {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "—"}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {order.items?.slice(0, 3).map((item, j) => (
                          <span key={j} className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md uppercase">
                            {item.name}
                          </span>
                        ))}
                        {(order.items?.length || 0) > 3 && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => window.open(`/verify/${order.receiptNumber}`, "_blank")}
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-accent transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Verify
                    </button>
                    <Button size="sm" onClick={() => setSelectedOrder(order)} className="gap-2 text-[10px]">
                      <Receipt className="w-4 h-4" /> Receipt
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/10 shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:border-0"
              id="receipt-print-area"
            >
              <div className="p-8 border-b border-brand-border dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30 flex justify-between items-center print:hidden">
                <div className="flex items-center gap-3">
                  <Receipt className="text-brand-accent w-5 h-5" />
                  <h2 className="text-xl font-black text-brand-text-bold dark:text-white italic uppercase tracking-tighter">Receipt</h2>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="text-center border-b border-brand-border dark:border-white/5 pb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded bg-brand-accent" />
                    <div className="w-5 h-5 rounded bg-brand-success" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-text-bold dark:text-white">Durex Team Platform</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">Official Purchase Receipt</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt #</span>
                    <span className="text-[10px] font-mono font-black text-brand-accent">{selectedOrder.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</span>
                    <span className="text-[10px] font-bold text-brand-text-bold dark:text-white">{profile?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate().toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full", STATUS_STYLE[selectedOrder.status] || "")}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                <div className="border-t border-brand-border dark:border-white/5 pt-4 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Items Purchased</p>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <span className="text-xs font-bold text-brand-text-bold dark:text-white uppercase tracking-tight">{item.name}</span>
                      <span className="text-xs font-black text-brand-success italic">${item.price?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
                  <span className="text-3xl font-black text-brand-text-bold dark:text-white italic">${selectedOrder.total?.toFixed(2)}</span>
                </div>

                <div className="flex gap-3 print:hidden">
                  <Button onClick={handlePrintReceipt} variant="outline" className="flex-1 gap-2 text-[10px]">
                    <Printer className="w-4 h-4" /> Print
                  </Button>
                  <Button
                    onClick={() => window.open(`/verify/${selectedOrder.receiptNumber}`, "_blank")}
                    className="flex-1 gap-2 text-[10px]"
                  >
                    <ExternalLink className="w-4 h-4" /> Verify Online
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
