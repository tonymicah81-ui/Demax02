import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle2, 
  Loader2,
  Monitor,
  Globe,
  ShoppingCart as ShopIcon,
  Shield,
  Zap,
  Layers,
  ChevronRight,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
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

  useEffect(() => {
    // Fetch Categories
    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
    });

    // Fetch Products
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
      alert(`${product.name} added to cart.`);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-brand-border dark:border-white/5">
        <div>
          <h1 className="text-4xl font-black text-brand-text-bold dark:text-white uppercase tracking-tighter italic">Marketplace_X</h1>
          <p className="text-brand-accent font-black mt-2 uppercase tracking-[0.2em] text-[10px] italic">
            Durex Engine Marketplace // Asset Catalog v2.0
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="SEARCH_PRODUCTS..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs font-mono focus:outline-none focus:border-brand-accent transition-all uppercase w-72" 
              />
           </div>
           <Button onClick={() => window.location.href = '/cart'} className="gap-2 bg-brand-success hover:bg-green-600 shadow-xl shadow-green-500/20">
              <ShoppingCart className="w-4 h-4" /> CART_CHECKOUT
           </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="w-full lg:w-64 space-y-8 shrink-0">
           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Categories</label>
              <div className="space-y-1">
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
           </div>

           {selectedCategory && subCategories.length > 0 && (
             <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sub-Categories</label>
                <div className="grid grid-cols-1 gap-1">
                   {subCategories.map(sub => (
                     <button 
                       key={sub.id}
                       onClick={() => setSelectedSubCategory(sub.id)}
                       className={cn(
                         "w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                         selectedSubCategory === sub.id ? "bg-brand-accent text-white" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                       )}
                     >
                       {sub.name}
                     </button>
                   ))}
                </div>
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
               {filteredProducts.map((p, i) => (
                 <motion.div
                   key={p.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                 >
                   <Card className="p-0 border-none overflow-hidden group shadow-lg bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5">
                      <div className="aspect-square bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                         <img 
                           src={p.images?.[0] || "https://picsum.photos/seed/product/400/400"} 
                           alt={p.name} 
                           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                         />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <Button onClick={() => handleAddToCart(p)} disabled={addingToCart === p.id} className="gap-2">
                               {addingToCart === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> ADD_TO_CART</>}
                            </Button>
                         </div>
                         <div className="absolute top-4 right-4 px-3 py-1 bg-brand-primary/80 backdrop-blur-md rounded-lg border border-white/10">
                            <span className="text-xs font-black text-white italic">${p.price}</span>
                         </div>
                      </div>
                      <div className="p-6">
                         <h3 className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-tight italic mb-2">{p.name}</h3>
                         <p className="text-[10px] text-slate-500 font-medium line-clamp-2 italic leading-relaxed">
                            {p.description}
                         </p>
                         <div className="mt-4 pt-4 border-t border-brand-border dark:border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-mono text-slate-400 uppercase">UID: {p.id.slice(0,8)}</span>
                            <div className="w-5 h-5 rounded bg-brand-success/10 flex items-center justify-center text-brand-success">
                               <CheckCircle2 className="w-3 h-3" />
                            </div>
                         </div>
                      </div>
                   </Card>
                 </motion.div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
