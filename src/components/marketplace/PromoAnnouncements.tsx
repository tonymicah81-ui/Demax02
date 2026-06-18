import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, Megaphone, Tag, Info } from "lucide-react";
import { db, doc, onSnapshot } from "../../firebase";
import { AnnouncementItem } from "../../lib/platformSettings";
import { cn } from "../../utils/cn";

const TYPE_CONFIG = {
  promo: {
    bg: "bg-gradient-to-r from-orange-500 to-amber-500",
    icon: Tag,
    label: "PROMO",
  },
  info: {
    bg: "bg-gradient-to-r from-blue-600 to-indigo-600",
    icon: Info,
    label: "INFO",
  },
  ad: {
    bg: "bg-gradient-to-r from-green-600 to-emerald-600",
    icon: Megaphone,
    label: "NEWS",
  },
};

export function PromoAnnouncements() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "platform_settings", "announcements"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setItems((data.items || []).filter((i: AnnouncementItem) => i.active));
      }
    });
    return () => unsub();
  }, []);

  const visible = items.filter(i => !dismissed.includes(i.id));

  useEffect(() => {
    if (visible.length <= 1) return;
    const t = setInterval(() => {
      setCurrentIdx(idx => (idx + 1) % visible.length);
    }, 5000);
    return () => clearInterval(t);
  }, [visible.length]);

  useEffect(() => {
    setCurrentIdx(0);
  }, [visible.length]);

  if (visible.length === 0) return null;

  const current = visible[currentIdx % visible.length];
  const config = TYPE_CONFIG[current?.type || "info"];
  const Icon = config.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={cn("flex items-center gap-3 px-5 py-3.5 text-white", config.bg)}
        >
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full shrink-0">
            <Icon className="w-3 h-3" />
            {config.label}
          </span>

          <p className="flex-1 text-xs font-bold truncate">{current.message}</p>

          <div className="flex items-center gap-2 shrink-0">
            {current.link && (
              <a
                href={current.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
              >
                View <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {visible.length > 1 && (
              <span className="text-[10px] font-bold opacity-60">
                {(currentIdx % visible.length) + 1}/{visible.length}
              </span>
            )}
            <button
              onClick={() => setDismissed(d => [...d, current.id])}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
