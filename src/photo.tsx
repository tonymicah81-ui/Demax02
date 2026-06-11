import React from "react";
import { Shield, Monitor, Zap, Handshake } from "lucide-react";
import { Logo } from "./components/ui/Logo";
import { cn } from "./utils/cn";

/**
 * photo.tsx
 * This file stores the visual assets for the Durex Team platform.
 * It reconstructs the official branding banner and logo as high-fidelity React components.
 */

export const Banner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn(
      "relative w-full aspect-[21/9] min-h-[400px] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col items-center justify-center p-8",
      className
    )}>
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[140%] bg-gradient-to-br from-brand-success/20 to-transparent rounded-full blur-[120px] rotate-12" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[140%] bg-gradient-to-tl from-brand-accent/20 to-transparent rounded-full blur-[120px] -rotate-12" />
        
        {/* Wave Elements (Simulating the banner's style) */}
        <svg className="absolute bottom-0 left-0 w-full h-1/2 opacity-20" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path 
            fill="url(#wave-gradient)" 
            fillOpacity="1" 
            d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,181.3C672,181,768,139,864,128C960,117,1056,139,1152,149.3C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Center Logo Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <Logo size="xl" showText={false} className="mb-4 drop-shadow-2xl" />
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-brand-text-bold uppercase italic">
          <span className="text-brand-success">Durex</span> <span className="text-brand-accent">Team</span>
        </h1>
        <p className="mt-2 text-sm md:text-lg font-bold text-slate-500 uppercase tracking-[0.5em] ml-2">
          Premium Web Solutions
        </p>
      </div>

      {/* Bottom Features Grid */}
      <div className="absolute bottom-8 left-0 w-full px-12 z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <FeatureItem icon={<Shield className="w-6 h-6" />} label="Durable Websites" />
          <FeatureItem icon={<Monitor className="w-6 h-6" />} label="Responsive Design" />
          <FeatureItem icon={<Zap className="w-6 h-6" />} label="Advanced Features" />
          <FeatureItem icon={<Handshake className="w-6 h-6" />} label="Reseller Friendly" />
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex flex-col items-center gap-2 group">
    <div className="w-12 h-12 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center group-hover:text-brand-text-bold transition-colors">
      {label}
    </span>
  </div>
);
