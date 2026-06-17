import { useState, useEffect } from "react";
import {
  Plus, Trash2, Layers, Package, CreditCard,
  Loader2, Search, ChevronRight, Tag
} from "lucide-react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { db, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "../../firebase";
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
  const [showModal, setShowModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "categories"), snap =>
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, "sub_categories"), snap =>
      setSubCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(collection(db, "products"), snap =>
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u4 = onSnapshot(collection(db, "subscription_models"), snap =>
      setSubscriptionModels(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let docRef;
      if (showModal === "cat") {
        docRef = await addDoc(collection(db, "categories"), { name: formData.name, createdAt: serverTimestamp() });
        logAudit(user as any, "CATEGORY_ADDED", `Added category: ${formData.name}`, docRef.id, "category");
      } else if (showModal === "sub") {
        docRef = await addDoc(collection(db, "sub_categories"), { categoryId: formData.categoryId, name: formData.name, createdAt: serverTimestamp() });
        logAudit(user as any, "SUB_CATEGORY_ADDED", `Added sub-category: ${formData.name}`, docRef.id, "sub_category");
      } else if (showModal === "prod") {
        const tags: string[] = formData.tags || [];
        docRef = await addDoc(collection(db, "products"), {
          ...formData,
          price: Number(formData.price),
          tags,
          images: formData.images ? formData.images.split("\n").map((s: string) => s.trim()).filter(Boolean) : ["https://picsum.photos/seed/p/400/400"],
          createdAt: serverTimestamp()
        });
        logAudit(user as any, "PRODUCT_ADDED", `Added product: ${formData.name}`, docRef.id, "product");
      } else if (showModal === "sub_model") {
        docRef = await addDoc(collection(db, "subscription_models"), {
          ...formData, price: Number(formData.price), createdAt: serverTimestamp()
        });
        logAudit(user as any, "SUBSCRIPTION_MODEL_ADDED", `Added subscription plan: ${formData.name}`, docRef.id, "subscription_model");
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
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      const item = [...categories, ...subCategories, ...products, ...subscriptionModels].find(i => i.id === id);
      await deleteDoc(doc(db, col, id));
      logAudit(user as any, `${col.toUpperCase()}_DELETED`, `Deleted ${col}: ${item?.name || id}`, id, col);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTag = (catId: string) => {
    const tags: string[] = formData.tags || [];
    setFormData({
      ...formData,
      tags: tags.includes(catId) ? tags.filter((t: string) => t !== catId) : [...tags, catId],
    });
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const inp = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const lbl = "text-[10px] font-black text-slate-500 uppercase tracking-widest";

  const TABS = [
    { id: "categories", label: "Categories", icon: Layers },
    { id: "products", label: "Products", icon: Package },
    { id: "subscriptions", label: "Plans", icon: CreditCard },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mb-1">Admin</p>
          <h1 className="text-3xl font-black text-brand-text-bold dark:text-white tracking-tight">Marketplace Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage products, categories, and subscription plans</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 text-brand-accent shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "categories" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-tight">
                Categories <span className="ml-2 text-slate-400 font-medium">({categories.length})</span>
              </CardTitle>
              <Button size="sm" onClick={() => { setShowModal("cat"); setFormData({}); }} className="gap-1.5 bg-brand-primary text-white text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Category
              </Button>
            </div>
            {categories.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm text-slate-400">No categories yet</div>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-accent" />
                      <span className="text-sm font-bold text-brand-text-bold dark:text-white">{cat.name}</span>
                    </div>
                    <button onClick={() => deleteItem("categories", cat.id)} className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-tight">
                Subcategories <span className="ml-2 text-slate-400 font-medium">({subCategories.length})</span>
              </CardTitle>
              <Button size="sm" onClick={() => { setShowModal("sub"); setFormData({}); }} className="gap-1.5 bg-brand-accent text-white text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Subcategory
              </Button>
            </div>
            {subCategories.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm text-slate-400">No subcategories yet</div>
            ) : (
              <div className="space-y-2">
                {subCategories.map(sub => {
                  const parent = categories.find(c => c.id === sub.categoryId)?.name || "Uncategorized";
                  return (
                    <div key={sub.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{parent}</p>
                        </div>
                        <p className="text-sm font-bold text-brand-text-bold dark:text-white pl-5">{sub.name}</p>
                      </div>
                      <button onClick={() => deleteItem("sub_categories", sub.id)} className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "products" && (
        <Card className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-sm font-black uppercase tracking-tight">
              Products <span className="ml-2 text-slate-400 font-medium">({products.length})</span>
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs font-medium w-48 focus:outline-none focus:border-brand-accent transition-all dark:text-white"
                />
              </div>
              <Button size="sm" onClick={() => { setShowModal("prod"); setFormData({ categoryId: categories[0]?.id || "", tags: [] }); }} className="gap-1.5 bg-brand-primary text-white text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-slate-400">
              {productSearch ? "No products match your search" : "No products yet — add your first one"}
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-3">
              {filteredProducts.map(prod => (
                <div key={prod.id} className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-brand-border dark:border-white/5 flex items-center gap-4 group hover:border-brand-accent/30 transition-all">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0">
                    <img src={prod.images?.[0]} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.src = "https://picsum.photos/seed/p/80/80")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-md">
                        {categories.find(c => c.id === prod.categoryId)?.name || "—"}
                      </span>
                      {(prod.tags || []).map((tagId: string) => {
                        const cat = categories.find(c => c.id === tagId);
                        return cat ? (
                          <span key={tagId} className="text-[9px] font-black uppercase px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded-md flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" /> {cat.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <h3 className="text-sm font-black text-brand-text-bold dark:text-white truncate">{prod.name}</h3>
                    <p className="text-base font-black text-brand-success mt-0.5">${prod.price}</p>
                  </div>
                  <button onClick={() => deleteItem("products", prod.id)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "subscriptions" && (
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-tight">
              Subscription Plans <span className="ml-2 text-slate-400 font-medium">({subscriptionModels.length})</span>
            </CardTitle>
            <Button size="sm" onClick={() => { setShowModal("sub_model"); setFormData({}); }} className="gap-1.5 bg-brand-success text-white text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Plan
            </Button>
          </div>

          {subscriptionModels.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
              <CreditCard className="w-8 h-8 opacity-30" />
              No subscription plans yet
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {subscriptionModels.map(model => (
                <div key={model.id} className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-brand-border dark:border-white/5 flex items-center justify-between group shadow-sm hover:border-brand-accent/30 transition-all">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4 className="text-sm font-black text-brand-text-bold dark:text-white tracking-tight">{model.name}</h4>
                      <span className="text-sm font-black text-brand-success">${model.price}<span className="text-[10px] text-slate-400 font-medium">/mo</span></span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-2 max-w-sm">{model.description}</p>
                  </div>
                  <button onClick={() => deleteItem("subscription_models", model.id)} className="w-9 h-9 rounded-xl bg-red-500/5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-white/10 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-7 border-b border-brand-border dark:border-white/5 flex justify-between items-center">
                <h2 className="text-lg font-black tracking-tight dark:text-white">
                  {showModal === "cat" && "New Category"}
                  {showModal === "sub" && "New Subcategory"}
                  {showModal === "prod" && "New Product"}
                  {showModal === "sub_model" && "New Subscription Plan"}
                </h2>
                <button onClick={() => setShowModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors text-sm">✕</button>
              </div>

              <form onSubmit={handleSave} className="p-7 space-y-5 text-brand-text-bold dark:text-white">
                {showModal === "cat" && (
                  <div className="space-y-2">
                    <label className={lbl}>Category Name</label>
                    <input type="text" required value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inp} placeholder="e.g. Websites, Tools, Templates" />
                  </div>
                )}

                {showModal === "sub" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={lbl}>Parent Category</label>
                      <select required value={formData.categoryId || ""} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className={inp}>
                        <option value="">— Select category —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className={lbl}>Subcategory Name</label>
                      <input type="text" required value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inp} placeholder="e.g. Landing Pages, E-Commerce" />
                    </div>
                  </div>
                )}

                {showModal === "prod" && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className={lbl}>Product Name</label>
                        <input type="text" required value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inp} placeholder="Product name" />
                      </div>
                      <div className="space-y-2">
                        <label className={lbl}>Primary Category</label>
                        <select required value={formData.categoryId || ""} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className={inp}>
                          <option value="">— Select —</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={lbl}>Price (USD)</label>
                        <input type="number" required min="0" step="0.01" value={formData.price || ""} onChange={e => setFormData({ ...formData, price: e.target.value })} className={inp} placeholder="0.00" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={lbl}>Description</label>
                      <textarea required value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inp + " min-h-[80px] resize-none"} placeholder="Brief description..." />
                    </div>

                    <div className="space-y-2">
                      <label className={lbl}>Image URLs <span className="font-normal normal-case text-slate-400">(one per line)</span></label>
                      <textarea value={formData.images || ""} onChange={e => setFormData({ ...formData, images: e.target.value })} className={inp + " min-h-[60px] resize-none font-mono text-xs"} placeholder="https://example.com/image.jpg" />
                    </div>

                    {categories.length > 1 && (
                      <div className="space-y-2">
                        <label className={lbl + " flex items-center gap-1"}><Tag className="w-3 h-3" /> Additional Tags (multi-category)</label>
                        <div className="flex flex-wrap gap-2">
                          {categories
                            .filter(c => c.id !== formData.categoryId)
                            .map(c => {
                              const selected = (formData.tags || []).includes(c.id);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => toggleTag(c.id)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                    selected
                                      ? "bg-brand-accent text-white border-brand-accent"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent hover:border-brand-accent/40"
                                  )}
                                >
                                  {selected ? "✓ " : ""}{c.name}
                                </button>
                              );
                            })}
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium">Products appear in all selected categories when filtered</p>
                      </div>
                    )}
                  </div>
                )}

                {showModal === "sub_model" && (
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className={lbl}>Name</label>
                        <input type="text" required value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inp} placeholder="Plan name" />
                      </div>
                      <div className="space-y-2">
                        <label className={lbl}>Price (USD/mo)</label>
                        <input type="number" required min="0" step="0.01" value={formData.price || ""} onChange={e => setFormData({ ...formData, price: e.target.value })} className={inp} placeholder="0.00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={lbl}>Description</label>
                      <textarea required value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inp + " min-h-[140px] resize-none"} placeholder="Plan features..." />
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full h-12 bg-brand-primary text-white gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
