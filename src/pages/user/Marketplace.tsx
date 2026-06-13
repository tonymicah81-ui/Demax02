import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Plus,
  X,
  ShoppingBag,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../AuthContext";
import { cn } from "../../utils/cn";
import { db, collection, addDoc, query, onSnapshot, where, getDocs } from "../../firebase";

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
}

interface Product {
  id: string;
  categoryId: string;
  subCategoryId?: string;
  name: string;
  price: number;
  description: string;
  images: string[];
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function Marketplace() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
    });

    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubProducts();
    };
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const q = query(collection(db, "sub_categories"), where("categoryId", "==", selectedCategory));
      getDocs(q).then(snap => {
        setSubCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubCategory[]);
      });
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

  const handleAddToCart = async (product: Product) => {
    if (!user) return;
    setAddingToCart(product.id);
    try {
      await addDoc(collection(db, "carts"), {
        userId: user.uid,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || "",
      });
      showToast(`"${product.name}" added to cart`, "success");
    } catch {
      showToast("Failed to add item. Please try again.", "error");
    } finally {
      setAddingToCart(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSubCategory = !selectedSubCategory || p.subCategoryId === selectedSubCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubCategory && matchesSearch;
  });

  const categoryName = (id: string) => categories.find(c => c.id === id)?.name ?? "";

  return (
    <div className="space-y-8">
      {/* ─── Toast Stack ─── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold text-white pointer-events-auto",
                t.type === "success" ? "bg-brand-success" : "bg-red-500"
              )}
            >
              {t.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mb-1">Durex Team</p>
          <h1 className="text-3xl font-black text-brand-text-bold dark:text-white tracking-tight">Asset Marketplace</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Browse and purchase ready-made digital assets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand-accent transition-all w-64"
            />
          </div>
          <Button
            onClick={() => window.location.href = '/cart'}
            className="gap-2 bg-brand-primary hover:bg-brand-primary/90 shadow-lg"
          >
            <ShoppingCart className="w-4 h-4" />
            View Cart
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ─── Sidebar ─── */}
        <aside className="w-full lg:w-56 space-y-6 shrink-0">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Categories</p>
            <div className="space-y-1">
              <button
                onClick={() => { setSelectedCategory(null); setSelectedSubCategory(null); }}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  !selectedCategory
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                All Products
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setSelectedSubCategory(null); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-between",
                    selectedCategory === cat.id
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {cat.name}
                  <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {selectedCategory && subCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subcategories</p>
                <div className="space-y-1">
                  {subCategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubCategory(sub.id === selectedSubCategory ? null : sub.id)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                        selectedSubCategory === sub.id
                          ? "bg-brand-accent text-white shadow-sm"
                          : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <Tag className="w-3 h-3" />
                      {sub.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* ─── Product Grid ─── */}
        <div className="flex-1">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Filter className="w-7 h-7 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-black text-brand-text-bold dark:text-white">No products found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or category filter</p>
              </div>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory(null); setSelectedSubCategory(null); }}
                  className="text-xs font-bold text-brand-accent hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="p-0 overflow-hidden group hover:shadow-xl hover:shadow-brand-accent/5 transition-all duration-300 border border-brand-border dark:border-white/5">
                      {/* Image */}
                      <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                        <img
                          src={p.images?.[0] || "https://picsum.photos/seed/product/400/300"}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide shadow-sm">
                            {categoryName(p.categoryId) || "Asset"}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 px-3 py-1 bg-brand-primary/90 backdrop-blur-sm rounded-lg">
                          <span className="text-xs font-black text-white">${p.price}</span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="text-sm font-black text-brand-text-bold dark:text-white tracking-tight leading-snug">{p.name}</h3>
                          <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{p.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-brand-border dark:border-white/5">
                          <span className="text-base font-black text-brand-success">${p.price}</span>
                          <Button
                            onClick={() => handleAddToCart(p)}
                            disabled={addingToCart === p.id || !user}
                            size="sm"
                            className="gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs"
                          >
                            {addingToCart === p.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Plus className="w-3.5 h-3.5" />
                            }
                            {addingToCart === p.id ? "Adding..." : "Add to Cart"}
                          </Button>
                        </div>
                        {!user && (
                          <p className="text-[10px] text-slate-400 text-center">
                            <a href="/login" className="text-brand-accent hover:underline font-bold">Sign in</a> to purchase
                          </p>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
