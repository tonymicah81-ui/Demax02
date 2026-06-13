interface PreviewPanelProps {
  html: string;
  className?: string;
}

export function PreviewPanel({ html, className = '' }: PreviewPanelProps) {
  return (
    <div className={`rounded-xl overflow-hidden border border-brand-border dark:border-white/5 bg-white ${className}`}>
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-brand-border dark:border-white/5">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Preview</span>
      </div>
      {html ? (
        <iframe
          srcDoc={html}
          title="Email Preview"
          className="w-full min-h-[400px] border-0"
          sandbox="allow-same-origin"
        />
      ) : (
        <div className="min-h-[400px] flex items-center justify-center opacity-30">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Preview will appear here</p>
        </div>
      )}
    </div>
  );
}
