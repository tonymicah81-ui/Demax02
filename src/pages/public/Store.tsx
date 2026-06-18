import { useState, useEffect } from "react";
import {
  ShoppingCart, Search, Loader2, Plus, CheckCircle2,
  X, Trash2, ArrowRight, LogIn, ShoppingBag, SlidersHorizontal,
  SplitSquareVertical, Clock
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
import { SupportWidget } from "../../components/widget/SupportWidget";
import { trackVisitor } from "../../lib/visitorIntelligence";
import { PromoAnnouncements } from "../../components/marketplace/PromoAnnouncements";
import { AdSlot } from "../../components/marketplace/AdSlot";

interface Category { id: string; name: string; }
interface SubCategory { id: string; categoryId: string; name: string; }
interface Product {
  id: string; categoryId: string; subCategoryId?: string;
  name: string; price: number; description: string; images: string[];
  tags?: string[];
  discountPrice?: number;
  discountEndsAt?: string;
  halfPaymentEnabled?: boolean;
}

function useCountdown(endsAt?: string) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  useEffect(() => {
    if (!endsAt) return;
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? h + "h " : ""}${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return timeLeft;
}

function ProductCard({
  p, i, isInCart, hasDiscount, discountPct, displayPrice,
  addingToCart, addedFeedback, onAddToCart
}: {
  p: Product; i: number; isInCart: boolean; hasDiscount: boolean;
  discountPct: number; displayPrice: number;
  addingToCart: string | null; addedFeedback: string | null;
  onAddToCart: (p: Product) => void;
}) {
  const countdown = useCountdown(hasDiscount ? p.discountEndsAt : undefined);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25, delay: i * 0.03 }}
    >
      <Card className="p-0 border-none overflow-hidden group shadow-md hover:shadow-xl transition-shadow bg-white dark:bg-slate-900">
        <div className="aspect-square bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
          <img
            src={p.images?.[0] || "https://picsum.photos/seed/" + p.id + "/400/400"}
            alt={p.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <Button
              onClick={() => onAddToCart(p)}
              disabled={addingToCart === p.id || isInCart}
              className={cn("gap-2 text-xs", isInCart && "bg-brand-success hover:bg-brand-success")}
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

          {/* Price badge */}
          <div className="absolute top-3 right-3">
            {hasDiscount ? (
              <div className="flex flex-col items-end gap-1">
                <span className="px-2.5 py-1 bg-red-500/90 backdrop-blur-md rounded-lg border border-white/10 text-xs font-black text-white italic">
                  ${displayPrice}
                </span>
                <span className="px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-md text-[9px] font-black text-red-300 line-through">
                  ${p.price}
                </span>
              </div>
            ) : (
              <div className="px-2.5 py-1 bg-brand-primary/80 backdrop-blur-md rounded-lg border border-white/10">
                <span className="text-xs font-black text-white italic">${p.price}</span>
              </div>
            )}
          </div>

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-500 rounded-lg shadow-lg">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">-{discountPct}%</span>
            </div>
          )}

          {/* In-cart checkmark */}
          {isInCart && !hasDiscount && (
            <div className="absolute top-3 left-3 w-7 h-7 bg-brand-success rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic mb-1 truncate">{p.name}</h3>
          <p className="text-[10px] text-slate-500 font-medium line-clamp-2 italic leading-relaxed">{p.description}</p>

          {/* Countdown timer */}
          {hasDiscount && countdown && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest">
              <Clock className="w-3 h-3 animate-pulse" />
              Sale ends in {countdown}
            </div>
          )}

          {/* Half-payment badge */}
          {p.halfPaymentEnabled && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-black text-brand-accent uppercase tracking-widest">
              <SplitSquareVertical className="w-3 h-3" />
              50% now, 50% on delivery
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-brand-border dark:border-white/5 flex items-center justify-between">
            <div>
              {hasDiscount ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-red-500 italic">${displayPrice}</span>
                  <span className="text-xs font-bold text-slate-400 line-through">${p.price}</span>
                </div>
              ) : (
                <span className="text-lg font-black text-brand-success italic">${p.price}</span>
              )}
            </div>
            <button
              onClick={() => onAddToCart(p)}
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
    trackVisitor("store").catch(() => {});
  }, []);

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
    if (user) navigate("/cart");
    else navigate("/login?redirect=/store");
  };

  const cartTotal = cartItems.reduce((s, i) => s + i.price, 0);

  const filteredProducts = products.filter(p => {
    const matchCat = !selectedCategory || p.categoryId === selectedCategory || (p.tags || []).includes(selectedCategory);
    const matchSub = !selectedSubCategory || p.subCategoryId === selectedSubCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSub && matchSearch;
  });

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSearchQuery("");
  };

  const hasActiveFilters = !!(selectedCategory || selectedSubCategory || searchQuery);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col gap-4 pb-6 border-b border-brand-border dark:border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.4em] mb-1.5">Durex Team Engine</p>
            <h1 className="text-3xl sm:text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">
              Asset Store
            </h1>
            <p className="text-slate-500 font-bold mt-1.5 uppercase tracking-[0.2em] text-[10px] italic">
              {filteredProducts.length} Products Available — No Account Required to Browse
            </p>
          </div>

          {/* Cart button — always visible */}
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 bg-brand-success hover:bg-green-600 text-white px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-green-500/20 shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">CART</span>
            {cartItems.length > 0 && (
              <span className="bg-white text-brand-success text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Search bar — full width on mobile */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="SEARCH_ASSETS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-10 py-3.5 text-xs font-mono focus:outline-none focus:border-brand-accent transition-all uppercase"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── PROMO ANNOUNCEMENTS ─── */}
      <PromoAnnouncements />

      {/* ─── GUEST BANNER ─── */}
      {!user && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl">
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

      {/* ─── MOBILE CATEGORY PILLS ─── */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => clearFilters()}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
              !selectedCategory ? "bg-brand-primary text-white border-brand-primary shadow-sm" : "bg-white dark:bg-slate-900 text-slate-500 border-brand-border dark:border-white/10 hover:border-brand-accent"
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id === selectedCategory ? null : cat.id); setSelectedSubCategory(null); }}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                selectedCategory === cat.id ? "bg-brand-primary text-white border-brand-primary shadow-sm" : "bg-white dark:bg-slate-900 text-slate-500 border-brand-border dark:border-white/10 hover:border-brand-accent"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategory pills row */}
        <AnimatePresence>
          {selectedCategory && subCategories.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide pl-2">
              {subCategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubCategory(sub.id === selectedSubCategory ? null : sub.id)}
                  className={cn(
                    "shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                    selectedSubCategory === sub.id ? "bg-brand-accent text-white border-brand-accent shadow-sm" : "bg-white dark:bg-slate-900 text-slate-400 border-brand-border dark:border-white/10"
                  )}
                >
                  {sub.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 space-y-6 shrink-0">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Categories</label>
            <button
              onClick={clearFilters}
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
                onClick={() => { setSelectedCategory(cat.id === selectedCategory ? null : cat.id); setSelectedSubCategory(null); }}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between",
                  selectedCategory === cat.id ? "bg-brand-primary text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {cat.name}
                <span className="opacity-50">›</span>
              </button>
            ))}
          </div>

          {selectedCategory && subCategories.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-1.5">
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

          {hasActiveFilters && (
            <button onClick={clearFilters} className="w-full text-center text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors px-4 py-2">
              Clear Filters ×
            </button>
          )}
        </aside>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand-accent" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading_Storefront</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="h-80 flex flex-col items-center justify-center space-y-5 rounded-3xl border-2 border-dashed border-brand-border dark:border-white/5">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <SlidersHorizontal className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-widest text-brand-text-bold dark:text-white mb-1">No Products Found</p>
                <p className="text-xs text-slate-400 font-medium">Try adjusting your search or filters</p>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-brand-accent text-white hover:bg-blue-600 transition-all">
                  Clear All Filters
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p, i) => {
                  const isInCart = cartItems.some(c => c.productId === p.id);
                  const hasDiscount = typeof p.discountPrice === "number" && p.discountPrice < p.price;
                  const discountPct = hasDiscount ? Math.round((1 - p.discountPrice! / p.price) * 100) : 0;
                  const displayPrice = hasDiscount ? p.discountPrice! : p.price;
                  return (
                    <>
                      {i > 0 && i % 6 === 0 && (
                        <div key={`ad-${i}`} className="col-span-full">
                          <AdSlot />
                        </div>
                      )}
                      <ProductCard
                        key={p.id}
                        p={p}
                        i={i}
                        isInCart={isInCart}
                        hasDiscount={hasDiscount}
                        discountPct={discountPct}
                        displayPrice={displayPrice}
                        addingToCart={addingToCart}
                        addedFeedback={addedFeedback}
                        onAddToCart={handleAddToCart}
                      />
                    </>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ─── CART SLIDE-IN ─── */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowCart(false)} />
            <motion.div
              initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }}
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
                  <AnimatePresence>
                    {cartItems.map(item => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-brand-border dark:border-white/5">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0">
                          {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-brand-text-bold dark:text-white uppercase tracking-tight truncate italic">{item.name}</p>
                          <p className="text-sm font-black text-brand-success italic mt-1">${item.price}</p>
                        </div>
                        <button onClick={() => handleRemoveFromCart(item)} className="text-red-400 hover:text-red-500 transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
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
      <SupportWidget source="store" />
    </div>
  );
}
