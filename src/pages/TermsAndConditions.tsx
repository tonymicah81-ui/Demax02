import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X, ChevronDown, Scale, Shield, CreditCard, Users, Lock, FileText, Printer, Home } from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { useTheme } from "../ThemeContext";

const SECTIONS = [
  {
    id: "intro",
    label: "01. Introduction",
    icon: FileText,
    title: "Introduction & Agreement Parties",
    content: [
      {
        heading: "Who We Are",
        body: "Durex Team Pro is a web development and digital services platform operated by Durex Team. We provide serverless websites, full-stack systems, email infrastructure, Telegram bots, and marketplace assets to businesses, individuals, and organizations worldwide.",
      },
      {
        heading: "The Agreement",
        body: "By accessing or using any service provided by Durex Team Pro — including but not limited to browsing the public store, subscribing to a plan, commissioning a website, or activating an email or bot subscription — you (\"the Client\") agree to be bound by these Terms of Service.",
      },
      {
        heading: "Effective Date",
        body: "These Terms are effective as of January 1, 2026 and supersede all prior agreements. Durex Team reserves the right to amend these terms with a 30-day notice to active subscribers. Continued use of the platform after such notice constitutes acceptance.",
      },
      {
        heading: "Scope",
        body: "These terms apply to all service types: one-time website projects, recurring subscription plans (email, bot), marketplace asset purchases, and platform administration roles (Admin, Super Admin, Client).",
      },
    ],
  },
  {
    id: "sla",
    label: "02. Service Level Agreement",
    icon: Scale,
    title: "Service Level Agreement",
    content: [
      {
        heading: "Platform Uptime",
        body: "Durex Team targets a platform availability of 99.5% on a monthly basis, excluding scheduled maintenance windows. Planned downtime will be communicated via the platform dashboard with a minimum of 24 hours notice.",
      },
      {
        heading: "Support Response Times",
        body: "Standard support tickets are acknowledged within 2 business days. Issues affecting live production environments are acknowledged within 4 business hours. Critical security incidents are escalated immediately.",
      },
      {
        heading: "Project Delivery",
        body: "Serverless website projects are considered \"delivered\" when the client receives a live hosted URL, admin credentials, and a handoff summary document. Full-stack projects follow a milestone-based delivery schedule agreed upon at project initiation.",
      },
      {
        heading: "Subscription Services",
        body: "Email and Bot subscription services are activated within 24 hours of successful payment. The platform dashboard becomes available upon activation. If activation is delayed beyond 48 hours due to platform error, the client is entitled to a prorated credit for the delayed period.",
      },
    ],
  },
  {
    id: "liability",
    label: "03. Liability & Responsibility",
    icon: Shield,
    title: "Liability & Responsibility",
    content: [
      {
        heading: "Client Responsibility Framework",
        body: "By engaging with Durex Team services, the Client acknowledges that the platform is provided for the purpose of legitimate business operations, including but not limited to e-commerce, school management, and corporate portals.",
      },
      {
        heading: "Section 3.4 — Limitation of Liability",
        body: "Any action made, data uploaded, or interactions performed by clients using the Durex Team infrastructure are the sole responsibility of the account holder. Durex Team, its developers, and stakeholders shall be held harmless and maintain zero liability for any legal, financial, or reputational repercussions arising from client misuse of the platform.",
        highlight: true,
      },
      {
        heading: "Multi-Tenant Governance",
        body: "The system supports multi-tenant architecture. While we provide Firestore security rules and role-based access control, the ultimate governance of end-user data within each platform instance resides with the Admin and Super Admin users assigned to that instance.",
      },
      {
        heading: "Prohibited Conduct",
        list: [
          "Unauthorized penetration testing or stress testing of our infrastructure.",
          "Usage of the platform for phishing, malware distribution, or illegal data harvesting.",
          "Reselling sub-tenant access without an authorized Enterprise license.",
          "Attempting to access other clients' data or administrative controls.",
          "Using the platform to send spam or unsolicited communications.",
        ],
      },
    ],
  },
  {
    id: "payments",
    label: "04. Payments & Rates",
    icon: CreditCard,
    title: "Payments & Rates",
    content: [
      {
        heading: "Pricing",
        body: "Entry-level rates begin at $60.00 USD for serverless website projects. Subscription services start at $15.00/month for Email Basic and $20.00/month for Telegram Bot plans. Full-stack and enterprise projects are quoted individually based on scope.",
      },
      {
        heading: "Billing Cycle",
        body: "Subscription fees are billed monthly on the same date as the initial activation. Annual billing options may be offered at a discounted rate at the discretion of the platform administrators.",
      },
      {
        heading: "Refund Policy",
        body: "Subscription fees are non-refundable after the 7-day initial setup period. One-time project fees follow the milestone payment structure agreed at project initiation — completed milestones are non-refundable. If a project is cancelled before commencement, a full refund is issued within 5 business days.",
      },
      {
        heading: "Rate Changes",
        body: "Durex Team reserves the right to adjust subscription rates with a 30-day written notice period sent to the registered account email. Rate changes do not apply to active annual plans until the renewal date.",
      },
    ],
  },
  {
    id: "multitenant",
    label: "05. Multi-Tenant Usage",
    icon: Users,
    title: "Multi-Tenant Usage",
    content: [
      {
        heading: "What Multi-Tenant Means",
        body: "Durex Team operates a shared infrastructure model where multiple client organizations (\"tenants\") run on the same Firebase project with logical data isolation via Firestore security rules and role-based authentication. Each tenant's data is scoped to their organization and inaccessible to other tenants.",
      },
      {
        heading: "Data Isolation Guarantee",
        body: "Firestore security rules enforce strict tenant isolation. No client-level user can read, write, or modify data belonging to another organization. Super Admins at the platform level have read access across organizations for support purposes only.",
      },
      {
        heading: "Reseller & White-Label Policy",
        body: "Reselling access to Durex Team infrastructure under your own brand requires an Enterprise license agreement. Unauthorized white-labeling or reselling of sub-tenant access is a material breach of these terms and may result in immediate account suspension.",
      },
      {
        heading: "Admin Obligations",
        body: "Each Admin user assigned to a tenant organization is responsible for the actions of all users within that organization. Admins must enforce usage policies, manage access appropriately, and report security incidents promptly to Durex Team support.",
      },
    ],
  },
  {
    id: "privacy",
    label: "06. Privacy Policy",
    icon: Lock,
    title: "Privacy Policy",
    content: [
      {
        heading: "Data We Collect",
        body: "We collect account registration data (name, email, role), usage logs for audit and security purposes, and transactional data related to marketplace purchases and subscription billing. We do not collect payment card information directly — payment processing is handled by third-party processors.",
      },
      {
        heading: "Data Sub-Processors",
        body: "Durex Team uses the following enterprise-grade sub-processors: Firebase (Google LLC) for authentication, real-time database, and Firestore storage; Cloudinary for media asset storage and delivery. All sub-processors are bound by their own data processing agreements compliant with applicable data protection regulations.",
      },
      {
        heading: "Data Usage",
        body: "We use collected data strictly to operate and improve the platform. We do not sell, rent, or trade personal data to third parties. Aggregated, anonymized usage statistics may be used for platform analytics.",
      },
      {
        heading: "Your Rights",
        body: "You may request a copy of your stored data, correction of inaccurate data, or deletion of your account and associated data by contacting Durex Team support. Data deletion requests are processed within 14 business days. Note that audit logs required for legal compliance may be retained for up to 90 days after account deletion.",
      },
    ],
  },
];

export default function TermsAndConditions() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(SECTIONS[2].id);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(SECTIONS[2].id);

  const currentSection = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">

      {/* ─── HEADER ─── */}
      <nav className="sticky top-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-brand-border dark:border-white/5 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="bg-brand-primary dark:bg-white text-white dark:text-brand-primary text-[10px] px-1.5 py-0.5 rounded uppercase tracking-normal font-bold">PRO</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 text-xs font-semibold">
            <Link to="/store" className="text-slate-500 dark:text-slate-400 hover:text-brand-accent transition-colors uppercase tracking-widest font-bold">Marketplace</Link>
            <Link to="/#services" className="text-slate-500 dark:text-slate-400 hover:text-brand-accent transition-colors uppercase tracking-widest font-bold">Services</Link>
            <Link to="/login" className="text-slate-500 dark:text-slate-400 hover:text-brand-accent transition-colors uppercase tracking-widest font-bold">Login</Link>
            <span className="text-brand-accent uppercase tracking-widest font-black">Legal</span>
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
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

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-64 bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl border-l border-brand-border dark:border-white/5">
              <div className="flex items-center justify-between p-5 border-b border-brand-border dark:border-white/5">
                <span className="text-sm font-black text-brand-text-bold dark:text-white uppercase tracking-wider">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 p-4 space-y-1">
                {[{ label: "Home", href: "/" }, { label: "Marketplace", href: "/store" }, { label: "Services", href: "/#services" }, { label: "Login", href: "/login" }].map(l => (
                  <Link key={l.label} to={l.href} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-brand-text dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── PAGE INTRO ─── */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-brand-border dark:border-white/5 px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.4em] mb-3">Legal Documents</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-brand-text-bold dark:text-white tracking-tight mb-3">Terms of Service</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
            Rev. 2026.01.01 · Platform Standard · Compliance ID:{" "}
            <span className="text-brand-accent font-bold">DT-LEG-2026</span>
          </p>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 w-full flex-1">

        {/* ── DESKTOP LAYOUT: sidebar + content ── */}
        <div className="hidden lg:flex gap-10 items-start">

          {/* Sidebar */}
          <aside className="w-64 shrink-0 sticky top-24 space-y-1">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeSection === s.id
                    ? "bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-text-bold dark:hover:text-white border border-transparent"
                }`}
              >
                <s.icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            ))}
            <div className="pt-4 border-t border-brand-border dark:border-white/5 mt-4">
              <Link to="/" className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-brand-accent transition-colors">
                <Home className="w-3.5 h-3.5" /> Back to Home
              </Link>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-brand-accent transition-colors w-full text-left">
                <Printer className="w-3.5 h-3.5" /> Print Page
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="max-w-3xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                    <currentSection.icon className="w-5 h-5 text-brand-accent" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-brand-text-bold dark:text-white tracking-tight">{currentSection.title}</h2>
                </div>

                <div className="space-y-8">
                  {currentSection.content.map((block, i) => (
                    <div key={i} className={block.highlight ? "p-5 sm:p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30" : ""}>
                      <h3 className={`text-base font-black mb-3 ${block.highlight ? "text-amber-700 dark:text-amber-400" : "text-brand-text-bold dark:text-white"}`}>
                        {block.heading}
                      </h3>
                      {block.body && (
                        <p className={`leading-relaxed text-sm ${block.highlight ? "text-amber-700/80 dark:text-amber-500/80" : "text-brand-text dark:text-slate-400"}`}>
                          {block.body}
                        </p>
                      )}
                      {block.list && (
                        <ul className="space-y-2 mt-1">
                          {block.list.map((item, li) => (
                            <li key={li} className="flex items-start gap-2 text-sm text-brand-text dark:text-slate-400">
                              <span className="text-brand-accent mt-0.5 shrink-0">›</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-brand-border dark:border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                    Compliance ID: DT-LEG-2026
                  </span>
                  <div className="flex gap-3">
                    <Link to="/" className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-border dark:border-white/10 text-xs font-black uppercase tracking-widest text-brand-text-bold dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Home className="w-3.5 h-3.5" /> Home
                    </Link>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary dark:bg-brand-accent text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all">
                      <Printer className="w-3.5 h-3.5" /> Print Page
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* ── MOBILE LAYOUT: accordion ── */}
        <div className="lg:hidden space-y-3">
          {SECTIONS.map(s => (
            <div key={s.id} className="border border-brand-border dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <button
                onClick={() => setExpandedMobile(expandedMobile === s.id ? null : s.id)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${expandedMobile === s.id ? "bg-brand-accent/10" : "bg-slate-100 dark:bg-slate-800"}`}>
                    <s.icon className={`w-4 h-4 ${expandedMobile === s.id ? "text-brand-accent" : "text-slate-500 dark:text-slate-400"}`} />
                  </div>
                  <span className={`text-sm font-black ${expandedMobile === s.id ? "text-brand-accent" : "text-brand-text-bold dark:text-white"}`}>
                    {s.label}
                  </span>
                </div>
                <motion.div animate={{ rotate: expandedMobile === s.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedMobile === s.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-brand-border dark:border-white/5 pt-4 space-y-6">
                      {s.content.map((block, i) => (
                        <div key={i} className={block.highlight ? "p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30" : ""}>
                          <h3 className={`text-sm font-black mb-2 ${block.highlight ? "text-amber-700 dark:text-amber-400" : "text-brand-text-bold dark:text-white"}`}>
                            {block.heading}
                          </h3>
                          {block.body && (
                            <p className={`text-xs leading-relaxed ${block.highlight ? "text-amber-700/80 dark:text-amber-500/80" : "text-brand-text dark:text-slate-400"}`}>
              {block.body}
                            </p>
                          )}
                          {block.list && (
                            <ul className="space-y-1.5 mt-1">
                              {block.list.map((item, li) => (
                                <li key={li} className="flex items-start gap-2 text-xs text-brand-text dark:text-slate-400">
                                  <span className="text-brand-accent mt-0.5 shrink-0">›</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <div className="flex flex-wrap gap-3 pt-4">
            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              Compliance ID: DT-LEG-2026
            </span>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-border dark:border-white/10 text-xs font-black uppercase tracking-widest text-brand-text-bold dark:text-white">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-primary dark:bg-brand-accent text-white text-xs font-black uppercase tracking-widest">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
