'use client';
import { InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
}

export function Input({ label, error, icon, rightElement, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          className={clsx(
            'w-full rounded-xl border bg-white dark:bg-white/5 text-sm transition-all outline-none',
            'border-gray-200 dark:border-white/10 focus:border-[var(--color-primary)]',
            'py-3 placeholder:text-gray-400 dark:text-white',
            icon ? 'pl-10 pr-4' : 'px-4',
            rightElement ? 'pr-10' : '',
            error ? 'border-red-400 focus:border-red-400' : '',
            className
          )}
          {...props}
        />
        {rightElement && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
