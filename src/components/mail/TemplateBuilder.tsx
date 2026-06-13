import { useState, useRef } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Code2, Blocks, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { PreviewPanel } from './PreviewPanel';
import { cn } from '../../utils/cn';

type BlockType = 'header' | 'paragraph' | 'button' | 'image' | 'divider' | 'footer' | 'spacer';

interface Block {
  id: string;
  type: BlockType;
  props: Record<string, any>;
}

const DEFAULT_PROPS: Record<BlockType, Record<string, any>> = {
  header: { title: 'Hello, {{username}}!', subtitle: '', bgColor: '#0f172a', textColor: '#ffffff', logoUrl: '' },
  paragraph: { text: 'Your message here.', fontSize: '14', color: '#334155', align: 'left' },
  button: { text: 'Click Here', url: '#', bgColor: '#3b82f6', textColor: '#ffffff', borderRadius: '8', style: 'solid', size: 'md' },
  image: { url: '', width: '100', borderRadius: '8', borderColor: 'transparent' },
  divider: { color: '#e2e8f0', thickness: '1' },
  footer: { text: '© 2026 Durex Team. All rights reserved.', linkText: 'Unsubscribe', linkUrl: '#', bgColor: '#f8fafc', textColor: '#94a3b8' },
  spacer: { height: '24' },
};

function newBlock(type: BlockType): Block {
  return { id: Math.random().toString(36).slice(2), type, props: { ...DEFAULT_PROPS[type] } };
}

function renderBlock(block: Block): string {
  const { type, props } = block;
  switch (type) {
    case 'header':
      return `<div style="background:${props.bgColor};padding:40px 32px;text-align:center;">
        ${props.logoUrl ? `<img src="${props.logoUrl}" style="max-height:48px;margin-bottom:16px;" />` : ''}
        <h1 style="color:${props.textColor};font-size:24px;font-weight:900;margin:0;font-style:italic;">${props.title}</h1>
        ${props.subtitle ? `<p style="color:${props.textColor};opacity:0.7;margin:8px 0 0;font-size:13px;">${props.subtitle}</p>` : ''}
      </div>`;
    case 'paragraph':
      return `<p style="font-size:${props.fontSize}px;color:${props.color};text-align:${props.align};padding:16px 32px;margin:0;line-height:1.6;">${props.text}</p>`;
    case 'button': {
      const isSolid = props.style === 'solid';
      const isOutline = props.style === 'outline';
      const pad = props.size === 'sm' ? '8px 20px' : props.size === 'lg' ? '16px 40px' : '12px 28px';
      return `<div style="padding:8px 32px;text-align:center;">
        <a href="${props.url}" style="display:inline-block;padding:${pad};background:${isSolid ? props.bgColor : 'transparent'};color:${isSolid ? props.textColor : props.bgColor};border:2px solid ${props.bgColor};border-radius:${props.borderRadius}px;font-weight:700;font-size:13px;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">${props.text}</a>
      </div>`;
    }
    case 'image':
      return props.url ? `<div style="padding:8px 32px;text-align:center;"><img src="${props.url}" style="width:${props.width}%;border-radius:${props.borderRadius}px;border:2px solid ${props.borderColor};" /></div>` : '';
    case 'divider':
      return `<div style="padding:8px 32px;"><hr style="border:none;border-top:${props.thickness}px solid ${props.color};margin:0;" /></div>`;
    case 'footer':
      return `<div style="background:${props.bgColor};padding:24px 32px;text-align:center;">
        <p style="color:${props.textColor};font-size:12px;margin:0;">${props.text}</p>
        ${props.linkText ? `<a href="${props.linkUrl}" style="color:${props.textColor};font-size:11px;margin-top:4px;display:block;">${props.linkText}</a>` : ''}
      </div>`;
    case 'spacer':
      return `<div style="height:${props.height}px;"></div>`;
    default:
      return '';
  }
}

function blocksToHTML(blocks: Block[]): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;}table{width:100%;max-width:600px;margin:0 auto;background:#ffffff;}</style></head><body><table><tbody>${blocks.map(b => `<tr><td>${renderBlock(b)}</td></tr>`).join('')}</tbody></table></body></html>`;
}

interface BlockEditorProps {
  block: Block;
  onChange: (id: string, props: Record<string, any>) => void;
}

function BlockEditor({ block, onChange }: BlockEditorProps) {
  const { type, props, id } = block;
  const inputClass = "w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-brand-accent transition-all dark:text-white";
  const labelClass = "text-[9px] font-black text-slate-400 uppercase tracking-widest";
  const field = (key: string, label: string, input: React.ReactNode) => (
    <div key={key} className="space-y-1">
      <label className={labelClass}>{label}</label>
      {input}
    </div>
  );

  const upd = (k: string, v: any) => onChange(id, { ...props, [k]: v });
  const inp = (k: string, placeholder?: string, type_?: string) => (
    <input type={type_ || 'text'} value={props[k] || ''} onChange={e => upd(k, e.target.value)} className={inputClass} placeholder={placeholder} />
  );
  const colorInp = (k: string) => (
    <div className="flex gap-2">
      <input type="color" value={props[k] || '#000000'} onChange={e => upd(k, e.target.value)} className="w-10 h-8 rounded cursor-pointer border border-brand-border" />
      <input type="text" value={props[k] || ''} onChange={e => upd(k, e.target.value)} className={inputClass + ' flex-1'} />
    </div>
  );

  if (type === 'header') return <div className="grid grid-cols-2 gap-3">{[
    field('title', 'Title', inp('title', 'Email Title')),
    field('subtitle', 'Subtitle', inp('subtitle', 'Optional')),
    field('bgColor', 'Background', colorInp('bgColor')),
    field('textColor', 'Text Color', colorInp('textColor')),
    field('logoUrl', 'Logo URL', inp('logoUrl', 'https://...')),
  ]}</div>;

  if (type === 'paragraph') return <div className="grid grid-cols-2 gap-3">{[
    <div key="text" className="col-span-2 space-y-1"><label className={labelClass}>Text</label><textarea value={props.text || ''} onChange={e => upd('text', e.target.value)} className={inputClass + ' resize-none'} rows={3} /></div>,
    field('fontSize', 'Font Size (px)', inp('fontSize', '14', 'number')),
    field('color', 'Text Color', colorInp('color')),
    field('align', 'Alignment', <select value={props.align} onChange={e => upd('align', e.target.value)} className={inputClass}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>),
  ]}</div>;

  if (type === 'button') return <div className="grid grid-cols-2 gap-3">{[
    field('text', 'Button Text', inp('text', 'Click Here')),
    field('url', 'URL', inp('url', 'https://...')),
    field('bgColor', 'Background', colorInp('bgColor')),
    field('textColor', 'Text Color', colorInp('textColor')),
    field('borderRadius', 'Border Radius (px)', inp('borderRadius', '8', 'number')),
    field('style', 'Style', <select value={props.style} onChange={e => upd('style', e.target.value)} className={inputClass}><option value="solid">Solid</option><option value="outline">Outline</option></select>),
    field('size', 'Size', <select value={props.size} onChange={e => upd('size', e.target.value)} className={inputClass}><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select>),
  ]}</div>;

  if (type === 'image') return <div className="grid grid-cols-2 gap-3">{[
    <div key="url" className="col-span-2 space-y-1"><label className={labelClass}>Image URL</label>{inp('url', 'https://...')}</div>,
    field('width', 'Width (%)', inp('width', '100', 'number')),
    field('borderRadius', 'Border Radius (px)', inp('borderRadius', '8', 'number')),
    field('borderColor', 'Border Color', colorInp('borderColor')),
  ]}</div>;

  if (type === 'divider') return <div className="grid grid-cols-2 gap-3">{[
    field('color', 'Color', colorInp('color')),
    field('thickness', 'Thickness (px)', inp('thickness', '1', 'number')),
  ]}</div>;

  if (type === 'footer') return <div className="grid grid-cols-2 gap-3">{[
    <div key="text" className="col-span-2 space-y-1"><label className={labelClass}>Footer Text</label>{inp('text', '© 2026...')}</div>,
    field('linkText', 'Link Text', inp('linkText', 'Unsubscribe')),
    field('linkUrl', 'Link URL', inp('linkUrl', '#')),
    field('bgColor', 'Background', colorInp('bgColor')),
    field('textColor', 'Text Color', colorInp('textColor')),
  ]}</div>;

  if (type === 'spacer') return <div className="grid grid-cols-1 gap-3">{[
    field('height', 'Height (px)', inp('height', '24', 'number')),
  ]}</div>;

  return null;
}

const BLOCK_TYPES: { type: BlockType; label: string }[] = [
  { type: 'header', label: 'Header' },
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'button', label: 'Button' },
  { type: 'image', label: 'Image' },
  { type: 'divider', label: 'Divider' },
  { type: 'footer', label: 'Footer' },
  { type: 'spacer', label: 'Spacer' },
];

const VARIABLES = ['{{username}}', '{{email}}', '{{amount}}', '{{subscription}}', '{{project}}', '{{date}}'];

interface TemplateBuilderProps {
  value: string;
  onChange: (html: string) => void;
  showVariables?: boolean;
}

export function TemplateBuilder({ value, onChange, showVariables = true }: TemplateBuilderProps) {
  const [mode, setMode] = useState<'paste' | 'builder'>('paste');
  const [showPreview, setShowPreview] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([
    newBlock('header'),
    newBlock('paragraph'),
    newBlock('footer'),
  ]);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const builderHTML = blocksToHTML(blocks);
  const displayHTML = mode === 'builder' ? builderHTML : value;

  function insertVariable(v: string) {
    if (mode === 'paste' && textareaRef.current) {
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.slice(0, start) + v + value.slice(end);
      onChange(newVal);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + v.length, start + v.length);
      }, 0);
    }
  }

  function addBlock(type: BlockType) {
    const b = newBlock(type);
    setBlocks(prev => [...prev, b]);
    setExpandedBlock(b.id);
    if (mode === 'builder') onChange(blocksToHTML([...blocks, b]));
  }

  function updateBlock(id: string, props: Record<string, any>) {
    const updated = blocks.map(b => b.id === id ? { ...b, props } : b);
    setBlocks(updated);
    if (mode === 'builder') onChange(blocksToHTML(updated));
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const arr = [...blocks];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    setBlocks(arr);
    if (mode === 'builder') onChange(blocksToHTML(arr));
  }

  function removeBlock(id: string) {
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    if (mode === 'builder') onChange(blocksToHTML(updated));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-brand-border dark:border-white/5 overflow-hidden">
          <button onClick={() => setMode('paste')} className={cn('flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all', mode === 'paste' ? 'bg-brand-accent text-white' : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-brand-text-bold dark:hover:text-white')}>
            <Code2 className="w-3.5 h-3.5" /> Paste HTML
          </button>
          <button onClick={() => { setMode('builder'); onChange(builderHTML); }} className={cn('flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all', mode === 'builder' ? 'bg-brand-accent text-white' : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-brand-text-bold dark:hover:text-white')}>
            <Blocks className="w-3.5 h-3.5" /> Visual Builder
          </button>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowPreview(p => !p)} className="gap-2 text-[10px]">
          <Eye className="w-3.5 h-3.5" /> {showPreview ? 'Hide' : 'Preview'}
        </Button>
      </div>

      {showVariables && (
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map(v => (
            <button key={v} onClick={() => insertVariable(v)} className="px-2.5 py-1 bg-brand-accent/10 text-brand-accent text-[10px] font-black rounded-lg hover:bg-brand-accent/20 transition-colors font-mono">
              {v}
            </button>
          ))}
        </div>
      )}

      {mode === 'paste' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-brand-border dark:border-white/5 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-brand-accent transition-all dark:text-white resize-none min-h-[300px]"
          placeholder={'<html>\n<body>\n  <h1>Hello {{username}}</h1>\n</body>\n</html>'}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} onClick={() => addBlock(bt.type)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-brand-accent/10 hover:text-brand-accent transition-colors">
                <Plus className="w-3 h-3" /> {bt.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {blocks.map((block, idx) => (
              <div key={block.id} className="border border-brand-border dark:border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 cursor-pointer" onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-bold dark:text-white">{block.type}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); moveBlock(block.id, -1); }} disabled={idx === 0} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5 text-slate-400" /></button>
                    <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 1); }} disabled={idx === blocks.length - 1} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-slate-400" /></button>
                    <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                {expandedBlock === block.id && (
                  <div className="p-4 bg-white dark:bg-slate-900">
                    <BlockEditor block={block} onChange={updateBlock} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showPreview && <PreviewPanel html={displayHTML} />}
    </div>
  );
}
