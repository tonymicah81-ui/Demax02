import { useState, useEffect } from "react";
import {
  ShoppingCart, Search, Filter, Loader2, Plus, CheckCircle2,
  ChevronRight, X, Trash2, ArrowRight, LogIn, ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../AuthContext";
import { cn } from "../../utils/cn";
import { db, collection, query, where, onSnapshot, getDocs, addDoc } from "../../firebase";
import {
  getOrCreateVisitorId,
  addToVisitorCart,
  removeFromVisitorCart,
} from "../../lib/visitorCart";

interface Category { id: string; name: string; }
interface SubCategory { id: string; categoryId: string; name: string; }
interface Product {
  id: string; categoryId: string; subCategoryId?: string;
  name: string; price: number; description: string; images: string[];
}
interface CartItem {
  id: string; productId: string; name: string; price: number; image: string;
}

export default function Store() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Category[]);
    });
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
      setLoading(false);
    });
    return () => { unsubCats(); unsubProducts(); };
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      getDocs(query(collection(db, "sub_categories"), where("categoryId", "==", selectedCategory)))
        .then(snap => setSubCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })) as SubCategory[]));
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "carts"), where("userId", "==", user.uid));
      const unsub = onSnapshot(q, (snap) => {
        setCartItems(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CartItem[]);
      });
      return () => unsub();
    } else {
      const visitorId = getOrCreateVisitorId();
      const q = query(collection(db, "visitor_carts"), where("visitorId", "==", visitorId));
      const unsub = onSnapshot(q, (snap) => {
        setCartItems(snap.docs.map(d => ({ id: d.id, ...d.data() })) as CartItem[]);
      });
      return () => unsub();
    }
  }, [user]);

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id);
    try {
      if (user) {
        await addDoc(collection(db, "carts"), {
          userId: user.uid,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || "",
        });
      } else {
        await addToVisitorCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || "",
        });
      }
      setAddedFeedback(product.id);
      setTimeout(() => setAddedFeedback(null), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingToCart(null);
    }
  };

  const handleRemoveFromCart = async (item: CartItem) => {
    try {
      if (user) {
        const { deleteDoc, doc } = await import("../../firebase");
        await deleteDoc(doc(db, "carts", item.id));
      } else {
        await removeFromVisitorCart(item.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = () => {
    if (user) {
      navigate("/cart");
    } else {
      navigate("/login?redirect=/store");
    }
  };

  const cartTotal = cartItems.reduce((s, i) => s + i.price, 0);

  const filteredProducts = products.filter(p => {
    const matchCat = !selectedCategory || p.categoryId === selectedCategory;
    const matchSub = !selectedSubCategory || p.subCategoryId === selectedSubCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSub && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.4em] mb-2">Durex Team Engine</p>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">
            Asset Store
          </h1>
          <p className="text-slate-500 font-bold mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            {filteredProducts.length} Products Available — No Account Required to Browse
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="SEARCH_ASSETS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-mono focus:outline-none focus:border-brand-accent transition-all uppercase w-64"
            />
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 bg-brand-success hover:bg-green-600 text-white px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-green-500/20"
          >
            <ShoppingCart className="w-4 h-4" />
            CART
            {cartItems.length > 0 && (
              <span className="ml-1 bg-white text-brand-success text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {!user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <LogIn className="w-4 h-4 text-brand-accent shrink-0" />
            <p className="text-xs font-bold text-brand-text-bold dark:text-white">
              <span className="text-brand-accent">Sign in to purchase.</span>{" "}
              Browse freely — your cart is saved and transferred on login.
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/login?redirect=/store")} className="shrink-0 text-[10px]">
            Login <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-56 space-y-6 shrink-0">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Categories</label>
            <button
              onClick={() => { setSelectedCategory(null); setSelectedSubCategory(null); }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                !selectedCategory ? "bg-brand-primary text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              All Assets
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedSubCategory(null); }}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between",
                  selectedCategory === cat.id ? "bg-brand-primary text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {cat.name}
                <ChevronRight className="w-3 h-3 opacity-40" />
              </button>
            ))}
          </div>

          {selectedCategory && subCategories.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Subcategories</label>
              {subCategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubCategory(sub.id === selectedSubCategory ? null : sub.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    selectedSubCategory === sub.id ? "bg-brand-accent text-white" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {sub.name}
                </button>
              ))}
            </motion.div>
          )}
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading_Storefront</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4 opacity-30">
              <Filter className="w-16 h-16 text-slate-400" />
              <p className="text-sm font-black uppercase tracking-widest">No Products Found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((p, i) => {
                const isInCart = cartItems.some(c => c.productId === p.id);
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="p-0 border-none overflow-hidden group shadow-lg bg-white dark:bg-slate-900">
                      <div className="aspect-square bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                        <img
                          src={p.images?.[0] || "https://picsum.photos/seed/" + p.id + "/400/400"}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <Button
                            onClick={() => handleAddToCart(p)}
                            disabled={addingToCart === p.id || isInCart}
                            className={cn("gap-2", isInCart && "bg-brand-success hover:bg-brand-success")}
                          >
                            {addingToCart === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isInCart || addedFeedback === p.id ? (
                              <><CheckCircle2 className="w-4 h-4" /> IN_CART</>
                            ) : (
                              <><Plus className="w-4 h-4" /> ADD_TO_CART</>
                            )}
                          </Button>
                        </div>
                        <div className="absolute top-4 right-4 px-3 py-1 bg-brand-primary/80 backdrop-blur-md rounded-lg border border-white/10">
                          <span className="text-xs font-black text-white italic">${p.price}</span>
                        </div>
                        {isInCart && (
                          <div className="absolute top-4 left-4 w-7 h-7 bg-brand-success rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic mb-1">{p.name}</h3>
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-2 italic leading-relaxed">{p.description}</p>
                        <div className="mt-4 pt-4 border-t border-brand-border dark:border-white/5 flex items-center justify-between">
                          <span className="text-lg font-black text-brand-success italic">${p.price}</span>
                          <button
                            onClick={() => handleAddToCart(p)}
                            disabled={addingToCart === p.id || isInCart}
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                              isInCart
                                ? "bg-brand-success/10 text-brand-success cursor-default"
                                : "bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white"
                            )}
                          >
                            {isInCart ? "✓ Added" : "+ Cart"}
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-brand-border dark:border-white/5 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-brand-border dark:border-white/5">
                <div>
                  <h2 className="text-lg font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Cart</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cartItems.length} item(s)</p>
                </div>
                <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-brand-text-bold dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center space-y-3 opacity-30">
                    <ShoppingBag className="w-12 h-12 text-slate-400" />
                    <p className="text-xs font-black uppercase tracking-widest">Cart is Empty</p>
                  </div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tight truncate italic">{item.name}</p>
                        <p className="text-sm font-black text-brand-success italic mt-1">${item.price}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item)}
                        className="text-red-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-6 border-t border-brand-border dark:border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-black text-brand-text-bold dark:text-white italic">${cartTotal.toFixed(2)}</span>
                  </div>
                  <Button onClick={handleCheckout} className="w-full h-14 bg-brand-success hover:bg-green-600 text-white shadow-xl shadow-green-500/20 rounded-2xl gap-2">
                    {user ? (
                      <><ShoppingCart className="w-5 h-5" /> PROCEED TO CHECKOUT</>
                    ) : (
                      <><LogIn className="w-5 h-5" /> LOGIN TO CHECKOUT</>
                    )}
                  </Button>
                  {!user && (
                    <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
                      Your cart will be saved after login
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
