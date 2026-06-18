import { useEffect, useRef, useState } from "react";
import { db, doc, onSnapshot } from "../../firebase";
import { AdsSettings } from "../../lib/platformSettings";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSlotProps {
  className?: string;
}

export function AdSlot({ className }: AdSlotProps) {
  const [config, setConfig] = useState<AdsSettings | null>(null);
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "platform_settings", "ads"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as AdsSettings);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!config?.adsEnabled || !config.adsenseClientId || pushed.current) return;

    const scriptId = "adsense-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.adsenseClientId}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    const timer = setTimeout(() => {
      if (insRef.current && !pushed.current) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        } catch {}
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [config]);

  if (!config?.adsEnabled || !config.adsenseClientId || !config.adsSlotId) return null;

  return (
    <div className={className}>
      <div className="relative rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-brand-border dark:border-white/5 min-h-[200px] flex items-center justify-center">
        <span className="absolute top-2 right-2 text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Ad</span>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: "200px" }}
          data-ad-client={config.adsenseClientId}
          data-ad-slot={config.adsSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
