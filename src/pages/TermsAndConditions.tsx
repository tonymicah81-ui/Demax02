/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion } from "motion/react";
import { Scale, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "../utils/cn";

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState("03. Liability & Responsibility");

  const sections = [
    "01. Introduction",
    "02. Service Level Agreement",
    "03. Liability & Responsibility",
    "04. Payments & Rates",
    "05. Multi-Tenant Usage",
    "06. Privacy Policy"
  ];

  return (
    <div className="h-screen bg-brand-bg flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-brand-border h-16 flex items-center justify-between px-8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xl tracking-tighter text-brand-primary flex items-center gap-2">
            DUREX TEAM <span className="bg-brand-primary text-white text-[10px] px-1.5 py-0.5 rounded uppercase tracking-normal">PRO</span>
          </span>
        </div>
        <nav className="flex gap-8 text-sm font-semibold text-slate-500">
          <span className="cursor-pointer hover:text-brand-primary transition-colors">Marketplace</span>
          <span className="cursor-pointer hover:text-brand-primary transition-colors">Builds</span>
          <span className="cursor-pointer hover:text-brand-primary transition-colors">Support</span>
          <span className="text-brand-accent">Legal</span>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[280px] bg-white border-r border-brand-border p-8 overflow-y-auto">
          {sections.map(s => (
            <div 
              key={s}
              onClick={() => setActiveSection(s)}
              className={cn(
                "px-4 py-3 rounded-md text-[13px] font-medium mb-2 cursor-pointer transition-all",
                activeSection === s ? "bg-blue-50 text-brand-accent font-bold" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {s}
            </div>
          ))}
        </aside>

        {/* Content Section */}
        <section className="flex-1 bg-white p-12 lg:p-20 overflow-y-auto custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            key={activeSection}
            className="max-w-3xl"
          >
            <div className="mb-8">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                Rev. 2026.04.17 // Platform Standard // Compliance ID: DT-8829-LEG
              </span>
              <h1 className="text-5xl font-extrabold text-brand-text-bold mt-2 tracking-tight">Terms of Service</h1>
            </div>

            <div className="space-y-8">
              <div className="legal-clause">
                <h2 className="text-lg font-bold">Client Responsibility Framework</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                  By engaging with Durex Team services, the Client acknowledges that the platform is provided "as-is" for the purpose of business operations, including but not limited to E-commerce, School Management, and Corporate portals.
                </p>
                
                <div className="liability-alert dark:bg-amber-900/10 dark:border-amber-900/30">
                  <h3 className="dark:text-amber-500">Section 3.4: Limitation of Liability</h3>
                  <p className="dark:text-amber-600/80">
                    Any action made, data uploaded, or interactions performed by clients using the Durex Team infrastructure are the sole responsibility of the account holder. 
                    Durex Team, its developers, and stakeholders shall be held harmless and maintain zero liability for any legal, financial, or reputational repercussions arising from client misuse of the platform.
                  </p>
                </div>

                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  The system supports multi-tenant architecture. While we provide security rules and role-based access control, the ultimate governance of end-user data resides with the Admin and Super Admin users assigned to each specific instance.
                </p>
              </div>

              <div className="legal-clause">
                <h2 className="text-lg font-bold">Privacy & Data Governance</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                  We respect your data sovereignty. Durex Team utilizes enterprise-grade sub-processors including Firebase (Google Cloud) and Supabase for real-time logic. Sensitive client data is encrypted at rest.
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-2 italic">
                  Note: External storage APIs (AWS S3, Google Cloud Storage) are managed based on the client's chosen subscription tier.
                </p>
              </div>

              <div className="legal-clause">
                <h2 className="text-lg font-bold">Billing & Subscription</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                  Entry-level rates begin at <strong className="text-brand-text-bold">$60.00 USD</strong>. 
                  Additional features including real-time chat, analytics, and external file storage integrations may incur modular fees as detailed in the Marketplace section.
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                  Subscription fees are non-refundable after the 7-day initial setup period. Durex Team reserves the right to adjust rates with a 30-day notice period.
                </p>
              </div>

              <div className="legal-clause">
                <h2 className="text-lg font-bold">Prohibited Conduct</h2>
                <ul className="list-disc ml-6 text-slate-600 dark:text-slate-400 space-y-2 mt-4">
                  <li>Unauthorized penetration testing or stress testing of our infrastructure.</li>
                  <li>Usage of the platform for phishing, malware distribution, or illegal data harvesting.</li>
                  <li>Reselling sub-tenant access without an authorized Enterprise license.</li>
                </ul>
              </div>

              <div className="inline-block bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Durex Team Compliance ID: DT-8829-LEG
              </div>

              <div className="pt-8 border-t border-brand-border flex gap-4">
                <button className="bg-brand-primary text-white px-6 py-3 rounded text-sm font-bold hover:bg-slate-800 transition-all shadow-sm">
                  I Accept Terms
                </button>
                <button className="bg-white border border-brand-border text-brand-text-bold px-6 py-3 rounded text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
                  Download PDF
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
