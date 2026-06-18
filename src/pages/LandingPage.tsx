import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Moon, Sun, Server, Cloud, ArrowUpRight,
  ShoppingCart, Loader2, Menu, X, Bot, Mail, Repeat,
  Check, Database, Globe, Zap, Monitor, Shield,
  Send, MessageSquare
} from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { useTheme } from "../ThemeContext";
import { usePlatformSetting } from "../lib/platformSettings";
import { db, collection, onSnapshot } from "../firebase";
import { SupportWidget } from "../components/widget/SupportWidget";
import { trackVisitor } from "../lib/visitorIntelligence";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  featured?: boolean;
}

const TAGLINES = ["Serverless Websites", "Telegram Bots", "Email Infrastructure", "Full-Stack Systems"];

const BOT_MESSAGES = [
  { from: "user", text: "Hi, what are your prices?" },
  { from: "bot", text: "👋 Welcome! Our websites start at just $60. What type of project are you building?" },
  { from: "user", text: "I need an e-commerce store" },
  { from: "bot", text: "🛒 E-commerce plans start at $200. Type /plans to see the full breakdown!" },
];

const PLANS = [
  {
    name: "Email Basic",
    price: 15,
    period: "/mo",
    borderColor: "border-brand-accent",
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    icon: Mail,
    iconColor: "text-brand-accent",
    features: ["1 email address", "Email templates", "Mail dashboard", "Sent log", "Schedule sends"],
    cta: "Get Started",
    popular: false,
    ctaClass: "bg-brand-primary dark:bg-slate-800 text-white hover:opacity-90",
  },
  {
    name: "Email Pro",
    price: 30,
    period: "/mo",
    borderColor: "border-brand-success",
    iconBg: "bg-green-50 dark:bg-green-900/20",
    icon: Repeat,
    iconColor: "text-brand-success",
    features: ["Multiple addresses", "Bulk email sends", "Contact list manager", "All Basic features", "Priority support"],
    cta: "Get Pro",
    popular: true,
    ctaClass: "bg-brand-success text-white hover:bg-green-600 shadow-lg shadow-green-500/20",
  },
  {
    name: "Telegram Bot",
    price: 20,
    period: "/mo",
    borderColor: "border-purple-400",
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    icon: Bot,
    iconColor: "text-purple-500 dark:text-purple-400",
    features: ["Auto-reply triggers", "Welcome messages", "Webhook support", "Bot dashboard", "Admin notifications"],
    cta: "Get a Bot",
    popular: false,
    ctaClass: "bg-brand-primary dark:bg-slate-800 text-white hover:opacity-90",
  },
];

const PRICING_ROWS = [
  { service: "Business Landing Page", standard: "$500 – $2,000", us: "From $60" },
  { service: "E-Commerce Store", standard: "$2,000 – $8,000", us: "From $200" },
  { service: "Custom Web App", standard: "$5,000 – $20,000+", us: "Custom Quote" },
  { service: "Monthly Hosting", standard: "$50 – $300/mo", us: "Included*" },
  { service: "Email Infrastructure", standard: "$30 – $100/mo", us: "From $15/mo" },
  { service: "Telegram Bot", standard: "$300 – $1,000 setup", us: "From $20/mo" },
];

const MARQUEE_ITEMS = [
  "⚡ Serverless Architecture",
  "🔒 Firebase Security",
  "🤖 Telegram Bots",
  "📧 Email Infrastructure",
  "🛒 Marketplace Assets",
  "💻 Full-Stack Systems",
  "🚀 Rapid Deployment",
  "📊 Real-Time Analytics",
  "✅ No Monthly Server",
  "🌍 Global CDN",
];

function useCountUp(target: number, duration = 2000, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, active]);
  return count;
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { data: generalSettings } = usePlatformSetting("general");
  const { data: brandingSettings } = usePlatformSetting("branding");
  const supportEmail = (generalSettings as any).supportEmail || "support@durax.com";
  const heroImageUrl = (brandingSettings as any).heroImageUrl || "/WA_1776458039433.jpeg";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [taglineIdx, setTaglineIdx] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [visibleBotMessages, setVisibleBotMessages] = useState(0);
  const [botVisible, setBotVisible] = useState(false);
  const [statsActive, setStatsActive] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackVisitor("landing").catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTaglineIdx(i => (i + 1) % TAGLINES.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
      const featured = all.filter(p => p.featured);
      setFeaturedProducts(featured.length >= 3 ? featured.slice(0, 6) : all.slice(0, 6));
      setLoadingProducts(false);
    });
    return () => unsub();
  }, []);

  const [liveModels, setLiveModels] = useState<any[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "subscription_models"), (snap) => {
      setLiveModels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const activePlans = liveModels.length >= 3
    ? liveModels.slice(0, 3).map((m, i) => ({
        ...PLANS[i],
        name: m.name,
        price: m.price,
      }))
    : PLANS;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsActive(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setBotVisible(true); },
      { threshold: 0.2 }
    );
    if (botRef.current) observer.observe(botRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!botVisible) return;
    if (visibleBotMessages >= BOT_MESSAGES.length) return;
    const t = setTimeout(() => setVisibleBotMessages(v => v + 1), 1100);
    return () => clearTimeout(t);
  }, [visibleBotMessages, botVisible]);

  const c500 = useCountUp(500, 2000, statsActive);
  const c60 = useCountUp(60, 1500, statsActive);
  const c3 = useCountUp(3, 1000, statsActive);
  const c100 = useCountUp(100, 2500, statsActive);

  const fadeUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" } as const,
    transition: { duration: 0.7, ease: "easeOut" },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-brand-border dark:border-white/5 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="bg-brand-primary dark:bg-white text-white dark:text-brand-primary text-[10px] px-1.5 py-0.5 rounded uppercase tracking-normal font-bold">PRO</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#services" className="text-brand-text dark:text-slate-400 hover:text-brand-accent transition-colors">Services</a>
            <a href="#pricing" className="text-brand-text dark:text-slate-400 hover:text-brand-accent transition-colors">Pricing</a>
            <a href="#products" className="text-brand-text dark:text-slate-400 hover:text-brand-accent transition-colors">Marketplace</a>
            <Link to="/terms" className="text-brand-accent hover:opacity-80 transition-opacity">Legal</Link>
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-brand-border dark:border-white/10">
              <Link to="/login" className="text-brand-text-bold dark:text-white hover:text-brand-accent transition-colors text-xs font-bold uppercase tracking-widest">Login</Link>
              <Link to="/signup" className="bg-brand-primary dark:bg-brand-accent text-white px-5 py-2 rounded-lg hover:opacity-90 transition-all text-xs font-bold uppercase tracking-widest shadow-sm">Sign Up</Link>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── MOBILE DRAWER ─── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl md:hidden border-l border-brand-border dark:border-white/5"
            >
              <div className="flex items-center justify-between p-5 border-b border-brand-border dark:border-white/5">
                <Logo size="sm" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                  { label: "Services", href: "#services" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Marketplace", href: "#products" },
                  { label: "Browse Store", href: "/store" },
                  { label: "Terms / Legal", href: "/terms" },
                ].map(item => (
                  <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-brand-text dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="p-5 border-t border-brand-border dark:border-white/5 space-y-3">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 rounded-xl text-sm font-black uppercase tracking-widest border-2 border-brand-border dark:border-white/10 text-brand-text-bold dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Login
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-brand-primary dark:bg-brand-accent text-white hover:opacity-90 transition-all shadow-sm">
                  Sign Up Free
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── HERO ─── */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-brand-border dark:border-white/5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-brand-accent text-xs font-semibold mb-6 overflow-hidden max-w-full">
              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span key={taglineIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                  {TAGLINES[taglineIdx]}
                </motion.span>
              </AnimatePresence>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-black text-brand-text-bold dark:text-white leading-[0.95] mb-6 tracking-tight">
              Scale Your <br />
              <span className="text-brand-success">Business</span> with <br />
              Premium Assets.
            </h1>

            <p className="text-base sm:text-lg text-brand-text dark:text-slate-400 mb-8 max-w-lg leading-relaxed font-medium">
              Serverless sites, full-stack systems, email tools, and Telegram bots — all starting at{" "}
              <span className="font-bold text-brand-text-bold dark:text-white underline decoration-brand-accent/40">$60.00</span>.
              One platform, every digital need.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link to="/store" className="bg-brand-primary dark:bg-brand-accent text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg font-bold hover:opacity-90 transition-all shadow-[0_10px_20px_-5px_rgba(59,130,246,0.3)] flex items-center gap-2 text-sm">
                Browse Store <ChevronRight className="w-4 h-4" />
              </Link>
              <a href="#services" className="bg-white dark:bg-slate-800 text-brand-text-bold dark:text-white border border-brand-border dark:border-white/10 px-6 sm:px-8 py-3.5 sm:py-4 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm">
                View Services
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 }} className="hidden lg:block relative">
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] border border-brand-border dark:border-white/5">
              <img src={heroImageUrl} alt="Durex Team Premium Web Assets" className="w-full aspect-[16/10] object-cover object-center" onError={e => { (e.currentTarget as HTMLImageElement).src = "/WA_1776458039433.jpeg"; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/10 to-transparent" />
            </div>
            <div className="absolute -inset-10 bg-brand-accent/10 dark:bg-brand-accent/5 rounded-[3rem] -z-10 blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <section className="py-10 px-4 sm:px-6 bg-brand-primary dark:bg-slate-900 border-b border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: "500+", label: "Sites Delivered", sub: "and counting" },
            { value: "$60", label: "Starting Price", sub: "no hidden fees" },
            { value: "3+", label: "Service Types", sub: "sites, bots, email" },
            { value: "Firebase", label: "Powered By", sub: "Google Cloud Platform" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="text-center">
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-1">{stat.label}</div>
              <div className="text-[10px] text-white/40 mt-0.5 hidden sm:block">{stat.sub}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SERVICES SHOWCASE ─── */}
      <section id="services" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-3">What We Offer</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-text-bold dark:text-white tracking-tight mb-4">One Platform. Every Digital Need.</h2>
            <p className="text-brand-text dark:text-slate-400 max-w-xl mx-auto font-medium text-base sm:text-lg">
              From serverless landing pages to full enterprise systems — all at a fraction of standard agency prices.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Cloud, badge: "Most Popular", badgeColor: "bg-brand-accent/10 text-brand-accent",
                borderColor: "border-brand-accent", title: "Serverless Websites",
                tagline: "Speed without the server cost", price: "From $60", priceNote: "one-time",
                desc: "Firebase-powered sites that perform like full servers but cost a fraction of the price. Perfect for small businesses, portfolios, schools, churches, and startups.",
                features: ["No monthly server bill", "Firebase Auth + Firestore", "Real-time data sync", "SEO optimized", "Mobile responsive"],
                cta: "Browse Websites", ctaLink: "/store",
                why: "No server to maintain = 70% less infrastructure cost passed directly to you.",
                iconBg: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-brand-accent",
              },
              {
                icon: Server, badge: "Enterprise", badgeColor: "bg-green-100 dark:bg-green-900/20 text-brand-success",
                borderColor: "border-brand-success", title: "Full-Stack Systems",
                tagline: "Complete backend for serious business", price: "Custom Quote", priceNote: "project-based",
                desc: "Node.js, Express, PostgreSQL — full backend systems for e-commerce platforms, booking systems, SaaS dashboards, and enterprise tools.",
                features: ["Dedicated backend", "PostgreSQL database", "Admin dashboard", "Multi-role RBAC", "Custom API"],
                cta: "Request a Quote", ctaLink: "/signup",
                why: "We build modular — reusing tested components lowers your quote without cutting corners.",
                iconBg: "bg-green-50 dark:bg-green-900/20", iconColor: "text-brand-success",
              },
              {
                icon: Repeat, badge: "Subscription", badgeColor: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
                borderColor: "border-purple-400", title: "Platform Services",
                tagline: "Pay monthly, cancel anytime", price: "From $15/mo", priceNote: "monthly",
                desc: "Add email infrastructure or a Telegram bot to your business without hiring a developer. Fully managed from your dashboard.",
                features: ["Email service (SMTP)", "Telegram bot builder", "Contact list manager", "Scheduled sends", "Dashboard analytics"],
                cta: "See Plans", ctaLink: "#plans",
                why: "Why pay $500 setup fee for a bot when you can subscribe for $20/mo and manage it yourself?",
                iconBg: "bg-purple-50 dark:bg-purple-900/20", iconColor: "text-purple-500 dark:text-purple-400",
              },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${s.borderColor} p-6 sm:p-8 flex flex-col shadow-sm hover:shadow-lg transition-shadow`}>
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                    <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${s.badgeColor}`}>{s.badge}</span>
                </div>
                <h3 className="text-xl font-black text-brand-text-bold dark:text-white mb-1">{s.title}</h3>
                <p className="text-xs text-brand-accent font-bold uppercase tracking-widest mb-4">{s.tagline}</p>
                <p className="text-sm text-brand-text dark:text-slate-400 leading-relaxed mb-5">{s.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {s.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-xs text-brand-text dark:text-slate-400 font-medium">
                      <Check className="w-3.5 h-3.5 text-brand-success shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-brand-border dark:border-white/5 mt-auto">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <div className="text-2xl font-black text-brand-text-bold dark:text-white">{s.price}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{s.priceNote}</div>
                    </div>
                  </div>
                  <Link to={s.ctaLink} className="block w-full text-center py-3 rounded-xl text-sm font-black uppercase tracking-widest bg-brand-primary dark:bg-slate-800 text-white hover:opacity-90 transition-all">
                    {s.cta} →
                  </Link>
                  <p className="text-[10px] text-slate-400 mt-3 leading-relaxed italic">{s.why}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TELEGRAM BOT SECTION ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-white dark:bg-slate-900" ref={botRef}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div {...fadeUp}>
            <p className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-3">Bot Services</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-text-bold dark:text-white tracking-tight mb-6">
              Your Business,<br /><span className="text-brand-success">Automated</span> on Telegram.
            </h2>
            <p className="text-brand-text dark:text-slate-400 text-base leading-relaxed mb-8">
              Get a professional Telegram bot without writing a single line of code. Two ways to get started:
            </p>
            <div className="space-y-4 mb-8">
              {[
                { num: "01", title: "We Build It For You", desc: "Describe what your bot should do — greetings, auto-reply, order alerts — and we configure and deploy it for you." },
                { num: "02", title: "Self-Service Subscription", desc: "Subscribe to our Bot plan, access your dashboard, enter your bot token, and configure it yourself. No technical knowledge needed." },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="flex gap-4 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-brand-border dark:border-white/5">
                  <div className="text-2xl font-black text-brand-accent/25 dark:text-white/20 shrink-0 leading-none mt-1">{item.num}</div>
                  <div>
                    <h4 className="font-black text-brand-text-bold dark:text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-brand-text dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-8">
              {["Auto-reply & keyword triggers", "Customer greeting on join", "Webhook & API integration", "Connected to your platform", "Admin notification relay", "Custom command builder"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-brand-text dark:text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-success shrink-0" />{f}
                </div>
              ))}
            </div>
            <Link to="/signup" className="inline-flex items-center gap-2 bg-brand-primary dark:bg-brand-accent text-white px-7 py-3.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm">
              <Bot className="w-4 h-4" /> Get a Telegram Bot — From $20/mo
            </Link>
          </motion.div>

          {/* Mock Telegram UI */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="flex justify-center">
            <div className="bg-[#17212b] rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm border border-white/5">
              <div className="bg-[#1c2733] px-4 py-3 flex items-center gap-3 border-b border-white/5">
                <div className="w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold">DurexBot</p>
                  <p className="text-green-400 text-xs">● online</p>
                </div>
                <Send className="w-4 h-4 text-slate-500" />
              </div>

              <div className="p-4 space-y-3 min-h-72 flex flex-col justify-end">
                <AnimatePresence>
                  {BOT_MESSAGES.slice(0, visibleBotMessages).map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.28 }}
                      className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.from === "bot" && (
                        <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center shrink-0 mr-2 mt-1">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === "bot" ? "bg-[#1c2733] text-white rounded-tl-none" : "bg-[#2b5278] text-white rounded-tr-none"}`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {botVisible && visibleBotMessages < BOT_MESSAGES.length && (
                  <div className="flex gap-1 px-3 pl-10">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#1c2733] px-4 py-3 flex items-center gap-3 border-t border-white/5">
                <div className="flex-1 bg-[#17212b] rounded-full px-4 py-2 text-xs text-slate-500">Message DurexBot...</div>
                <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
                  <Send className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── PRICING COMPARISON ─── */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-3">Transparent Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-text-bold dark:text-white tracking-tight mb-4">
              Why Are Our Prices <span className="text-brand-success italic">Lower?</span>
            </h2>
            <p className="text-brand-text dark:text-slate-400 max-w-xl mx-auto font-medium">
              Not a gimmick. There are real technical reasons we charge significantly less than a standard agency.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="mb-14 overflow-x-auto rounded-2xl border border-brand-border dark:border-white/5 shadow-sm">
            <table className="w-full min-w-[560px]">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest rounded-tl-2xl">Service</th>
                  <th className="text-center py-4 px-6 text-xs font-black text-red-400 uppercase tracking-widest">Standard Agency</th>
                  <th className="text-center py-4 px-6 text-xs font-black text-brand-success uppercase tracking-widest rounded-tr-2xl">Durex Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border dark:divide-white/5">
                {PRICING_ROWS.map((row, i) => (
                  <motion.tr key={i} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.4 }}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-bold text-brand-text-bold dark:text-white">{row.service}</td>
                    <td className="py-4 px-6 text-center text-sm text-slate-400 line-through">{row.standard}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-brand-success font-black text-sm bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">{row.us}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-b-2xl border-t border-brand-border dark:border-white/5">
              <p className="text-[11px] text-slate-400">* Included for serverless sites. Full-stack deployments may require a hosting plan.</p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Cloud, title: "No Server Overhead", desc: "Serverless architecture means no dedicated machine to rent or maintain. We pass that 70% infrastructure saving directly to you.", color: "bg-blue-50 dark:bg-blue-900/20 text-brand-accent" },
              { icon: Database, title: "Modular Builds", desc: "We reuse battle-tested components instead of building from scratch every time. Faster development means lower cost for you.", color: "bg-green-50 dark:bg-green-900/20 text-brand-success" },
              { icon: Shield, title: "Firebase as Backend", desc: "Firebase provides enterprise-grade infrastructure at near-zero cost. Auth, database, real-time sync — all included in the project price.", color: "bg-purple-50 dark:bg-purple-900/20 text-purple-500" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-brand-border dark:border-white/5 flex gap-4 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-brand-text-bold dark:text-white text-sm mb-2">{item.title}</h4>
                  <p className="text-xs text-brand-text dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SUBSCRIPTIONS PREVIEW ─── */}
      <section id="plans" className="py-20 sm:py-28 px-4 sm:px-6 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-3">Recurring Services</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-text-bold dark:text-white tracking-tight mb-4">Pay Monthly. Cancel Anytime.</h2>
            <p className="text-brand-text dark:text-slate-400 max-w-lg mx-auto font-medium">
              Add email infrastructure or a Telegram bot to your business. No setup fee. Managed from your dashboard.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {activePlans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 ${plan.borderColor} p-6 sm:p-8 flex flex-col shadow-sm ${plan.popular ? "shadow-lg" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-success text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow">
                    Most Popular
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl ${plan.iconBg} flex items-center justify-center mb-5`}>
                  <plan.icon className={`w-6 h-6 ${plan.iconColor}`} />
                </div>
                <h3 className="text-lg font-black text-brand-text-bold dark:text-white mb-1">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-black text-brand-text-bold dark:text-white">${plan.price}</span>
                  <span className="text-slate-400 text-sm font-bold pb-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5 text-sm text-brand-text dark:text-slate-400">
                      <Check className="w-4 h-4 text-brand-success shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`block text-center py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${plan.ctaClass}`}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p {...fadeUp} className="text-center text-xs text-slate-400 mt-8 font-medium">
            All plans activated from your dashboard after signing up. Your account manager helps configure everything.
          </motion.p>
        </div>
      </section>

      {/* ─── TRUST MARQUEE ─── */}
      <section className="py-6 bg-slate-50 dark:bg-slate-950 border-y border-brand-border dark:border-white/5 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap select-none">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mx-8 shrink-0">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ─── STATS COUNTERS ─── */}
      <div ref={statsRef}>
        <section className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeUp} className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-black text-brand-text-bold dark:text-white tracking-tight">Built for Growth. Proven by Results.</h2>
            </motion.div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { count: c500, suffix: "+", label: "Sites Delivered", sub: "across all industries" },
                { count: c60, prefix: "$", label: "Starting Price", sub: "serverless website" },
                { count: c3, suffix: "+", label: "Service Types", sub: "sites, email, bots" },
                { count: c100, suffix: "%", label: "Firebase Powered", sub: "Google Cloud Platform" },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-brand-border dark:border-white/5 shadow-sm">
                  <div className="text-4xl sm:text-5xl font-black text-brand-text-bold dark:text-white mb-2">
                    {stat.prefix}{stat.count}{stat.suffix}
                  </div>
                  <div className="text-sm font-black text-brand-text-bold dark:text-white mb-1">{stat.label}</div>
                  <div className="text-xs text-slate-400 font-medium">{stat.sub}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section id="products" className="py-20 sm:py-28 px-4 sm:px-6 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 pb-8 border-b border-brand-border dark:border-white/5">
            <motion.div {...fadeUp}>
              <p className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-2">Marketplace</p>
              <h2 className="text-3xl font-black text-brand-text-bold dark:text-white tracking-tight">Ready-Made Assets</h2>
              <p className="text-brand-text dark:text-slate-400 mt-2 font-medium text-sm">Professional web products — buy once, deploy instantly.</p>
            </motion.div>
            <Link to="/store" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent hover:opacity-80 transition-opacity shrink-0 self-start sm:self-auto">
              <ShoppingCart className="w-4 h-4" /> View All in Store <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-accent" /></div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-brand-border dark:border-white/5 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => window.location.href = "/store"}>
                  <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700"><Monitor className="w-10 h-10" /></div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-black text-brand-text-bold dark:text-white text-sm tracking-tight">{product.name}</h3>
                      <span className="text-brand-success font-black text-lg ml-2 shrink-0">${product.price}</span>
                    </div>
                    <p className="text-xs text-brand-text dark:text-slate-500 leading-relaxed line-clamp-2">{product.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-brand-accent text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                      View in Store <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Monitor, title: "Business Websites", desc: "Serverless landing pages and business sites from $60.", badge: "From $60" },
                { icon: Globe, title: "E-Commerce Stores", desc: "Full store with cart, payments, and inventory from $200.", badge: "From $200" },
                { icon: Database, title: "School & Corporate", desc: "Multi-role management systems for institutions.", badge: "Custom" },
                { icon: Bot, title: "Telegram Bots", desc: "Automated bots for customer service and notifications.", badge: "From $20/mo" },
                { icon: Mail, title: "Email Infrastructure", desc: "Professional email service for your business domain.", badge: "From $15/mo" },
                { icon: Zap, title: "Rapid Deployments", desc: "From blueprint to production in record time.", badge: "Custom" },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-brand-border dark:border-white/5 hover:shadow-lg hover:border-brand-accent dark:hover:border-brand-accent transition-all cursor-pointer"
                  onClick={() => window.location.href = "/store"}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all text-brand-text-bold dark:text-white">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black bg-green-50 dark:bg-green-900/20 text-brand-success px-2.5 py-1 rounded-full">{f.badge}</span>
                  </div>
                  <h3 className="font-black text-brand-text-bold dark:text-white text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-brand-text dark:text-slate-500 leading-relaxed">{f.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-brand-accent text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    View in Store <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div {...fadeUp} className="mt-12 text-center">
            <Link to="/store" className="inline-flex items-center gap-2 bg-brand-primary dark:bg-brand-accent text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl shadow-brand-accent/20 text-sm">
              <ShoppingCart className="w-5 h-5" /> Browse Full Store — No Account Required
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-16 px-4 sm:px-6 bg-slate-900 dark:bg-[#0a0f1a] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded bg-brand-accent" />
                  <div className="w-5 h-5 rounded bg-brand-success" />
                </div>
                <span className="font-extrabold text-sm tracking-tighter text-white uppercase ml-2">Durex Team <span className="text-brand-accent">PRO</span></span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 mb-4">
                High-performance web solutions — serverless sites, full-stack systems, email infrastructure, and Telegram bots.
              </p>
              <a href={`mailto:${supportEmail}`} className="text-xs text-brand-success hover:opacity-80 transition-opacity font-bold">{supportEmail}</a>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-4">Services</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Serverless Websites", href: "#services" },
                  { label: "Full-Stack Systems", href: "#services" },
                  { label: "Email Service", href: "#plans" },
                  { label: "Telegram Bots", href: "#plans" },
                  { label: "Marketplace", href: "/store" },
                ].map(l => (
                  <li key={l.label}><a href={l.href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">{l.label}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-4">Platform</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Browse Store", href: "/store" },
                  { label: "Login", href: "/login" },
                  { label: "Sign Up", href: "/signup" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Vault Entrance", href: "/company/vault", dim: true },
                ].map(l => (
                  <li key={l.label}>
                    <Link to={l.href} className={`text-xs font-medium transition-colors hover:text-slate-300 ${l.dim ? "text-slate-700" : "text-slate-500"}`}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-4">Company</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Pricing", href: "#pricing" },
                  { label: "Services Overview", href: "#services" },
                  { label: "Security Policy", href: "/terms" },
                  { label: "Support", href: "/login" },
                ].map(l => (
                  <li key={l.label}><a href={l.href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">{l.label}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">© 2026 Durex Team Pro. All Rights Reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-700 font-mono">DUREX-TEAM-ENGINE-v1.2</span>
              <span className="text-xs text-brand-accent font-black">SECURED BY FIREBASE GCP</span>
              <button onClick={toggleTheme} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
                {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </footer>
      <SupportWidget source="landing" />
    </div>
  );
}
