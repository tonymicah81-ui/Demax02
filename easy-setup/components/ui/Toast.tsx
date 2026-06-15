'use client';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { clsx } from 'clsx';
import type { ToastItem } from '@/types';

const icons = {
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
};

const styles: Record<ToastItem['type'], string> = {
  success: 'border-green-200 dark:border-green-500/30',
  error: 'border-red-200 dark:border-red-500/30',
  warning: 'border-yellow-200 dark:border-yellow-500/30',
  info: 'border-blue-200 dark:border-blue-500/30',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className={clsx('flex items-start gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border', styles[t.type])}>
            <span className="mt-0.5">{icons[t.type]}</span>
            <p className="flex-1 text-sm text-gray-700 dark:text-gray-200">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
