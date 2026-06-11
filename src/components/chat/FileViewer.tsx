import { X, Download, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import { motion } from "motion/react";
import { createPortal } from "react-dom";
import { useState, useEffect, useCallback } from "react";

interface FileViewerProps {
  file: { url: string; name: string; type: string };
  onClose: () => void;
}

export function FileViewer({ file, onClose }: FileViewerProps) {
  const [zoom, setZoom] = useState(1);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const isImage = file.type === "image";
  const isVideo = file.type === "video";

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[9999] flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-md flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-white/80 font-bold text-sm truncate max-w-[60%]">{file.name}</p>
        <div className="flex items-center gap-2">
          {isImage && (
            <>
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white/60 text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(4, z + 0.25))}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
            </>
          )}
          <a
            href={file.url}
            download
            target="_blank"
            rel="noreferrer"
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            onClick={e => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-red-500/70 text-white rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex items-center justify-center overflow-auto p-4"
        onClick={e => e.stopPropagation()}
      >
        {isImage ? (
          <img
            src={file.url}
            alt={file.name}
            draggable={false}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s" }}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl cursor-zoom-in select-none"
            onClick={() => setZoom(z => z < 2 ? 2 : 1)}
          />
        ) : isVideo ? (
          <video
            src={file.url}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-xl shadow-2xl"
          />
        ) : (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center mx-auto">
              <ExternalLink className="w-10 h-10 text-white/60" />
            </div>
            <div>
              <p className="text-white font-black text-xl mb-2">{file.name}</p>
              <p className="text-white/40 text-sm">This document type opens with your device viewer</p>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-brand-accent/20"
            >
              <ExternalLink className="w-4 h-4" /> Open Document
            </a>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="py-3 text-center flex-shrink-0">
        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">
          ESC or click outside to close
        </p>
      </div>
    </motion.div>,
    document.body
  );
}
