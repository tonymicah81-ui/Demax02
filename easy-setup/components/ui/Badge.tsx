import { clsx } from 'clsx';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-blue-500', default: 'bg-gray-400',
};

export function Badge({ label, variant = 'default', dot }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', styles[variant])}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {label}
    </span>
  );
}
