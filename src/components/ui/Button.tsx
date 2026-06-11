import { cn } from "../../utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
}

export function Button({ 
  className, 
  variant = "primary", 
  size = "md", 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-brand-primary dark:bg-brand-accent text-white hover:opacity-90 shadow-sm",
    secondary: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700",
    outline: "bg-transparent border border-brand-border dark:border-white/10 text-brand-text-bold dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    success: "bg-brand-success text-white hover:opacity-90 shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] uppercase tracking-widest",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
