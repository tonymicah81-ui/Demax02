import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Package, 
  Tag, 
  Loader2,
  ChevronRight,
  Search,
  Image as ImageIcon,
  CreditCard
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { db, collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc, serverTimestamp } from "../../firebase";
import { useAuth } from "../../AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils/cn";
import { logAudit } from "../../lib/audit";

export default function ManageMarketplace() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [subscriptionModels, setSubscriptionModels] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<"categories" | "products" | "subscriptions">("categories");
  const [showModal, setShowModal] = useState<string | null>(null); // 'cat', 'sub', 'prod', 'sub_model'
  
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    onSnapshot(collection(db, "sub_categories"), (snap) => {
      setSubCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    onSnapshot(collection(db, "subscription_models"), (snap) => {
      setSubscriptionModels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let docRef;
      if (showModal === 'cat') {
        docRef = await addDoc(collection(db, "categories"), { name: formData.name, createdAt: serverTimestamp() });
        logAudit(user as any, "CATEGORY_ADDED", `Added category: ${formData.name}`, docRef.id, "category");
      } else if (showModal === 'sub') {
        docRef = await addDoc(collection(db, "sub_categories"), { categoryId: formData.categoryId, name: formData.name, createdAt: serverTimestamp() });
        logAudit(user as any, "SUB_CATEGORY_ADDED", `Added sub-category: ${formData.name}`, docRef.id, "sub_category");
      } else if (showModal === 'prod') {
        const prodData = {
          ...formData,
          price: Number(formData.price),
          images: formData.images || ["https://picsum.photos/seed/p/400/400"],
          createdAt: serverTimestamp()
        };
        docRef = await addDoc(collection(db, "products"), prodData);
        logAudit(user as any, "PRODUCT_ADDED", `Added product: ${formData.name}`, docRef.id, "product");
      } else if (showModal === 'sub_model') {
        const modelData = {
          ...formData,
          price: Number(formData.price),
          createdAt: serverTimestamp()
        };
        docRef = await addDoc(collection(db, "subscription_models"), modelData);
        logAudit(user as any, "SUBSCRIPTION_MODEL_ADDED", `Added subscription model: ${formData.name}`, docRef.id, "subscription_model");
      }
      setShowModal(null);
      setFormData({});
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (col: string, id: string) => {
    if (!confirm("Are you sure? This protocol is irreversible.")) return;
    try {
      const item = [...categories, ...subCategories, ...products, ...subscriptionModels].find(i => i.id === id);
      await deleteDoc(doc(db, col, id));
      logAudit(user as any, `${col.toUpperCase()}_DELETED`, `Deleted ${col} item: ${item?.name || id}`, id, col);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic leading-none">Market_Control</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Asset Inventory Management // Durex Protocol v2.1
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab("categories")}
             className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest", activeTab === "categories" ? "bg-white dark:bg-slate-800 text-brand-accent shadow-sm" : "text-slate-400")}
           >
             Taxonomy
           </button>
           <button 
             onClick={() => setActiveTab("products")}
             className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest", activeTab === "products" ? "bg-white dark:bg-slate-800 text-brand-accent shadow-sm" : "text-slate-400")}
           >
             Catalog
           </button>
           <button 
             onClick={() => setActiveTab("subscriptions")}
             className={cn("px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest", activeTab === "subscriptions" ? "bg-white dark:bg-slate-800 text-brand-accent shadow-sm" : "text-slate-400")}
           >
             Subscriptions
           </button>
        </div>
      </div>

      <div className="grid gap-8">
        {activeTab === "categories" ? (
          <div className="grid lg:grid-cols-2 gap-8">
             <Card className="space-y-6">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-sm italic uppercase tracking-tighter">Primary Categories</CardTitle>
                   <Button size="sm" onClick={() => { setShowModal('cat'); setFormData({}); }} className="h-8"><Plus className="w-3 h-3 h-8" /> ADD_CAT</Button>
                </div>
                <div className="space-y-3">
                   {categories.map(cat => (
                     <div key={cat.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 flex items-center justify-between group">
                        <span className="text-xs font-bold text-brand-text-bold dark:text-white uppercase">{cat.name}</span>
                        <div className="flex items-center gap-2">
                           <button onClick={() => deleteItem("categories", cat.id)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                   ))}
                </div>
             </Card>

             <Card className="space-y-6">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-sm italic uppercase tracking-tighter">Sub-Taxonomy</CardTitle>
                   <Button size="sm" onClick={() => { setShowModal('sub'); setFormData({}); }} className="h-8"><Plus className="w-3 h-3" /> ADD_SUB</Button>
                </div>
                <div className="space-y-3">
                   {subCategories.map(sub => {
                     const parent = categories.find(c => c.id === sub.categoryId)?.name || "UNKNOWN_PROTO";
                     return (
                       <div key={sub.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 flex items-center justify-between group">
                          <div>
                            <p className="text-[9px] font-mono text-slate-500 uppercase">{parent}</p>
                            <p className="text-xs font-bold text-brand-text-bold dark:text-white uppercase">{sub.name}</p>
                          </div>
                          <button onClick={() => deleteItem("sub_categories", sub.id)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                       </div>
                     );
                   })}
                </div>
             </Card>
          </div>
        ) : activeTab === "products" ? (
          <Card className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <CardTitle className="text-sm italic uppercase tracking-tighter">Product Registry</CardTitle>
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="ID_TRACER..." className="bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs font-mono w-48" />
                   </div>
                   <Button size="sm" onClick={() => { setShowModal('prod'); setFormData({ categoryId: categories[0]?.id || "" }); }}><Plus className="w-4 h-4" /> ADD_PRODUCT</Button>
                </div>
             </div>

             <div className="grid xl:grid-cols-2 gap-4">
                {products.map(prod => (
                  <div key={prod.id} className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-brand-border dark:border-white/5 flex items-center gap-6 group hover:border-brand-accent/30 transition-all">
                     <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0">
                        <img src={prod.images?.[0]} alt="" className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded">{categories.find(c => c.id === prod.categoryId)?.name}</span>
                           <span className="text-[9px] font-mono text-slate-500 uppercase">{prod.id.slice(0,8)}</span>
                        </div>
                        <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic truncate">{prod.name}</h3>
                        <p className="text-lg font-black text-brand-success italic tracking-tighter mt-1">${prod.price}</p>
                     </div>
                     <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => deleteItem("products", prod.id)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
                ))}
             </div>
          </Card>
        ) : (
          <Card className="space-y-8">
             <div className="flex items-center justify-between">
                <CardTitle className="text-sm italic uppercase tracking-tighter">Subscription Models</CardTitle>
                <Button size="sm" className="gap-2" onClick={() => { setShowModal('sub_model'); setFormData({}); }}><CreditCard className="w-4 h-4" /> CREATE_MODEL</Button>
             </div>
             <div className="grid md:grid-cols-2 gap-4">
                {subscriptionModels.map(model => (
                  <div key={model.id} className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-brand-border dark:border-white/5 flex items-center justify-between group shadow-sm">
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h4 className="text-sm font-black text-brand-text-bold dark:text-white uppercase italic tracking-tighter">{model.name}</h4>
                           <span className="text-xs font-black text-brand-success italic">${model.price}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase line-clamp-2 max-w-sm">{model.description}</p>
                     </div>
                     <button onClick={() => deleteItem("subscription_models", model.id)} className="w-10 h-10 rounded-xl bg-red-500/5 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
             </div>
          </Card>
        )}
      </div>

      <AnimatePresence>
         {showModal && (
           <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/10 shadow-2xl max-w-lg w-full overflow-hidden">
                 <div className="p-8 border-b border-brand-border dark:border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase italic tracking-tighter">
                       {showModal === 'cat' && 'Assemble_Category'}
                       {showModal === 'sub' && 'Assemble_SubCategory'}
                       {showModal === 'prod' && 'Construct_Product'}
                       {showModal === 'sub_model' && 'Initialize_Subscription_Model'}
                    </h2>
                    <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-white">✕</button>
                 </div>

                 <form onSubmit={handleSave} className="p-8 space-y-6 text-brand-text-bold dark:text-white">
                    {showModal === 'cat' && (
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Category Name</label>
                          <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold uppercase transition-all" />
                       </div>
                    )}
                    {showModal === 'sub' && (
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Parent Category</label>
                          <select required value={formData.categoryId || ""} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold uppercase">
                             <option value="">-- SELECT --</option>
                             {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <input type="text" required placeholder="SUB_CAT_NAME" value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold uppercase" />
                       </div>
                    )}
                    {(showModal === 'prod' || showModal === 'sub_model') && (
                       <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Name</label>
                                <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold" />
                             </div>
                             {showModal === 'prod' && (
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Category</label>
                                  <select required value={formData.categoryId || ""} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold">
                                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                               </div>
                             )}
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Price ($)</label>
                                <input type="number" required value={formData.price || ""} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Description</label>
                             <textarea required value={formData.description || ""} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full h-full min-h-[140px] bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl p-4 text-xs font-bold appearance-none outline-none resize-none" />
                          </div>
                       </div>
                    )}

                    <Button type="submit" disabled={submitting} className="w-full h-14">
                       {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "DEPLOY_ASSET_MODULE"}
                    </Button>
                 </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
