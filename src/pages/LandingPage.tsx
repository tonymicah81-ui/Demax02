/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import { 
  Monitor, 
  Rocket, 
  Layout, 
  Shield, 
  ChevronRight, 
  Globe, 
  Layers, 
  MessageSquare,
  Zap,
  CheckCircle2,
  Moon,
  Sun,
  Server,
  Cloud,
  Cpu,
  Database,
  ArrowUpRight
} from "lucide-react";
import { Logo } from "../components/ui/Logo";
import { Banner } from "../photo";
import { useTheme } from "../ThemeContext";
import { usePlatformSetting } from "../lib/platformSettings";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { data: generalSettings } = usePlatformSetting('general');
  const supportEmail = generalSettings.supportEmail || 'support@durax.com';

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-950 flex flex-col transition-colors duration-500">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-brand-border h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 2 }}
              className="flex items-center gap-2"
              onClick={() => window.location.href = '/'}
            >
              <Logo size="md" />
              <span className="bg-brand-primary dark:bg-white text-white dark:text-brand-primary text-[10px] px-1.5 py-0.5 rounded uppercase tracking-normal font-bold">PRO</span>
            </motion.div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-text dark:text-slate-400">
            <a href="#services" className="hover:text-brand-accent transition-colors">Marketplace</a>
            <a href="#why-low" className="hover:text-brand-accent transition-colors">Efficiency</a>
            <a href="/terms" className="text-brand-accent hover:opacity-80 transition-opacity">Legal</a>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-brand-border dark:border-white/10">
              <button 
                onClick={() => window.location.href = '/login'} 
                className="text-brand-text-bold dark:text-white hover:text-brand-accent transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Login
              </button>
              <button 
                onClick={() => window.location.href = '/signup'} 
                className="bg-brand-primary dark:bg-brand-accent text-white px-5 py-2 rounded-md hover:opacity-90 transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 bg-white dark:bg-slate-900 border-b border-brand-border">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-brand-accent text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
              <span>Durable Websites & Premium Experience</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-brand-text-bold dark:text-white leading-[0.95] mb-6 tracking-tight">
              Scale Your <br />
              <span className="text-brand-success">Business</span> with <br />
              Premium Assets.
            </h1>
            <p className="text-lg text-brand-text dark:text-slate-400 mb-8 max-w-lg leading-relaxed font-medium">
              We build high-performance web applications starting at <span className="font-bold text-brand-text-bold dark:text-white underline decoration-brand-accent/30 tracking-tighter">$60.00</span>. 
              Buy professional assets from our marketplace and go live instantly.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => window.location.href = '/signup'} 
                className="bg-brand-primary dark:bg-brand-accent text-white px-8 py-4 rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-blue-600 transition-all shadow-[0_10px_20px_-5px_rgba(59,130,246,0.3)] flex items-center gap-2"
              >
                Create an account <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                className="bg-white dark:bg-slate-800 text-brand-text-bold dark:text-white border border-brand-border px-8 py-4 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Login to your dashboard
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_64px_80px_-20px_rgba(0,0,0,0.3)] border border-brand-border dark:border-white/5 bg-white dark:bg-slate-900">
               <img 
                 src="/WA_1776458039433.jpeg" 
                 alt="Durex Team Premium Web Assets Showcase" 
                 referrerPolicy="no-referrer"
                 className="w-full aspect-[16/9] md:aspect-[21/9] object-cover object-center"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/10 to-transparent pointer-events-none" />
            </div>
            <div className="absolute -inset-10 bg-brand-accent/10 dark:bg-brand-accent/5 rounded-[3rem] -z-10 blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Why is our price low? Section */}
      <section id="why-low" className="py-24 px-6 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div>
              <h2 className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-4">The Efficiency Engine</h2>
              <h3 className="text-4xl font-bold text-brand-text-bold dark:text-white mb-6 leading-tight">Why is our pricing <span className="text-brand-success underline decoration-brand-success/20 italic font-black">unbeatable</span>?</h3>
              <p className="text-brand-text dark:text-slate-400 text-lg mb-8 leading-relaxed">
                We've revolutionized the development stack. By leveraging decentralized cloud logic and high-tier sub-processors, we eliminate the overhead of traditional full-stack maintenance for small businesses.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: Cloud, title: "Hybrid Architecture", desc: "We use Firebase & Supabase to turn static sites into fully functional engines without the server cost." },
                  { icon: Server, title: "Modular Storage", desc: "Third-party APIs manage large assets, keeping your database lean and hyper-fast." },
                  { icon: Cpu, title: "Scalable Logic", desc: "Static for speed, Serverless for power. For big business, we deploy dedicated standard systems." }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-brand-border dark:border-white/5 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-brand-accent font-bold">
                      {<item.icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-brand-text-bold dark:text-white font-bold text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-brand-text dark:text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div 
              style={{ rotateZ: 2 }}
              className="bg-brand-primary p-1 rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="bg-slate-900 p-8 lg:p-12 font-mono text-xs text-brand-success space-y-4">
                 <div className="flex gap-2 text-slate-500 border-b border-white/5 pb-4 mb-6">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                 </div>
                 <p className="opacity-40">// initialize_durex_protocol.ts</p>
                 <p><span className="text-blue-400">const</span> <span className="text-white">platform</span> = <span className="text-white">DurexEngine</span>.<span className="text-blue-400">init</span>({"{"}</p>
                 <p className="pl-4">backend: <span className="text-amber-300">"FIREBASE_CLOUD"</span>,</p>
                 <p className="pl-4">logic: <span className="text-amber-300">"SERVERLESS"</span>,</p>
                 <p className="pl-4">storage: <span className="text-amber-300">"EXTERNAL_API"</span>,</p>
                 <p className="pl-4">optimization: <span className="text-white">true</span></p>
                 <p>{"}"});</p>
                 <p><span className="text-slate-500">// Result: High performance at 70% lower cost</span></p>
                 <p className="text-white bg-brand-success/20 p-2 rounded animate-pulse">STATUS: DEPLOYED_FOR_CLIENT_SUCCESS</p>
              </div>
              <div className="absolute top-0 right-0 p-4">
                 <ArrowUpRight className="text-white w-6 h-6 opacity-20" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Section - Clean Data-focused Grid */}
      <section id="services" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-brand-border pb-12">
            <div>
              <h2 className="text-3xl font-black text-brand-text-bold dark:text-white tracking-tight">Marketplace Assets</h2>
              <p className="text-brand-text dark:text-slate-400 mt-2 max-w-xl font-medium opacity-80 italic">
                Architecting durable systems for schools, institutions, and global commerce.
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 border dark:border-white/5 px-3 py-1 rounded">
              Rev. 2026.04.17 // Standard v1.2
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-border dark:bg-white/5 border border-brand-border dark:border-white/5 overflow-hidden rounded-xl bg-opacity-50">
            {[
              { icon: Monitor, title: "Small Business", desc: "SEO-optimized landing pages with static-speed architecture." },
              { icon: Layers, title: "E-Commerce", desc: "Enterprise gateways with multi-tenant inventory flows." },
              { icon: Globe, title: "Global Institutions", desc: "Scalable school and corporate management systems." },
              { icon: Shield, title: "Security Protocols", desc: "Role-based encryption and proprietary Vault access." },
              { icon: MessageSquare, title: "Real-time Hub", desc: "Low-latency client-admin communication channels." },
              { icon: Zap, title: "Rapid Deployment", desc: "From blueprint to production in record operational time." }
            ].map((f, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group relative cursor-pointer"
              >
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-brand-text-bold dark:text-white flex items-center justify-center rounded-xl mb-8 group-hover:bg-brand-accent group-hover:text-white transition-all shadow-sm">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-brand-text-bold dark:text-white mb-4 tracking-tight">{f.title}</h3>
                <p className="text-sm text-brand-text dark:text-slate-500 leading-relaxed font-medium mb-8 max-w-[240px]">{f.desc}</p>
                <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 text-brand-accent text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-decoration-none">
                  Build System <ArrowUpRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-16 px-6 bg-white dark:bg-slate-900 border-t border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-12">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                <div className="w-6 h-6 rounded bg-brand-accent" />
                <div className="w-6 h-6 rounded bg-brand-success" />
              </div>
              <span className="font-extrabold text-sm tracking-tighter text-brand-primary dark:text-white uppercase ml-2">
                Durex Team <span className="text-brand-accent">Engine v1.2</span>
              </span>
            </div>
            
            <div className="hidden lg:block text-[10px] font-mono text-slate-400 text-center uppercase tracking-widest leading-loose">
              Decentralized Architecture // Multi-Tenant // Security Verified <br />
              <a href={`mailto:${supportEmail}`} className="text-brand-success opacity-60 font-black hover:opacity-100 transition-opacity">{supportEmail}</a>
            </div>

            <div className="flex gap-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Link to="/company/vault" className="hover:text-brand-success transition-colors opacity-40">Vault Entrance</Link>
              <a href="/terms" className="hover:text-brand-accent transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-brand-accent transition-colors">Privacy</a>
              <a href="#" className="hover:text-brand-accent transition-colors">Security</a>
            </div>
          </div>
          
          <div className="border-t border-slate-100 dark:border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
               © 2026 DUREX TEAM PRO. ALL RIGHTS RESERVED.
             </div>
             <div className="flex items-center gap-6">
               <span className="text-[10px] text-slate-500 font-mono">DUREX-TEAM-ENGINE-v1.2</span>
               <span className="text-xs text-brand-accent font-black tracking-tighter">SECURED BY FIREBASE_GCP</span>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
