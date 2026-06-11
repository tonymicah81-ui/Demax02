import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlatformSetting } from '../../lib/platformSettings';

interface LoadingScreenProps {
  visible: boolean;
}

function DefaultEffect({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative"
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
        ) : (
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-lg bg-brand-accent shadow-[0_0_30px_rgba(59,130,246,0.6)]" />
                <div className="w-10 h-10 rounded-lg bg-brand-success shadow-[0_0_30px_rgba(34,197,94,0.6)]" />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-3"
      >
        <p className="text-white font-black text-xl uppercase tracking-[0.3em]">DUREX TEAM</p>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">Initializing System...</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-48 h-0.5 bg-slate-800 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-brand-accent to-brand-success rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
}

function PulseEffect({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-brand-success"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute inset-0 rounded-full bg-brand-accent"
        />
        <div className="relative w-20 h-20 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
          ) : (
            <div className="flex -space-x-1">
              <div className="w-5 h-5 rounded bg-brand-accent" />
              <div className="w-5 h-5 rounded bg-brand-success" />
            </div>
          )}
        </div>
      </div>

      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-brand-success font-mono text-[10px] font-black uppercase tracking-[0.5em]"
      >
        System Active
      </motion.p>
    </div>
  );
}

function ScanEffect({ logoUrl }: { logoUrl?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="relative w-32 h-32 border border-brand-success/30 rounded-2xl overflow-hidden flex items-center justify-center">
        <motion.div
          className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brand-success to-transparent"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-success rounded-tl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-success rounded-tr" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-success rounded-bl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-success rounded-br" />
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
        ) : (
          <div className="flex -space-x-1.5">
            <div className="w-6 h-6 rounded bg-brand-accent opacity-80" />
            <div className="w-6 h-6 rounded bg-brand-success opacity-80" />
          </div>
        )}
      </div>

      <div className="space-y-2 text-center">
        <p className="text-white font-black text-sm uppercase tracking-[0.4em]">DUREX TEAM</p>
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-brand-success font-mono text-[9px] font-bold uppercase tracking-widest"
        >
          Scanning System...
        </motion.p>
      </div>
    </div>
  );
}

function CustomEffect({ html, css }: { html: string; css: string }) {
  useEffect(() => {
    if (!css) return;
    const style = document.createElement('style');
    style.id = 'custom-loading-css';
    style.textContent = css;
    document.head.appendChild(style);
    return () => { document.getElementById('custom-loading-css')?.remove(); };
  }, [css]);

  if (!html) return <DefaultEffect />;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export function LoadingScreen({ visible }: LoadingScreenProps) {
  const { data: config } = usePlatformSetting('loading');

  const renderEffect = () => {
    switch (config.effect) {
      case 'pulse': return <PulseEffect logoUrl={config.logoUrl} />;
      case 'scan': return <ScanEffect logoUrl={config.logoUrl} />;
      case 'custom': return <CustomEffect html={config.customHTML} css={config.customCSS} />;
      default: return <DefaultEffect logoUrl={config.logoUrl} />;
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-brand-accent/5 rounded-full blur-[150px] pointer-events-none" />
          {renderEffect()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
