import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
}

const VARIANTS: Record<string, string> = {
  primary: 'border-accent bg-accent text-accent-contrast hover:border-accent-hover hover:bg-accent-hover',
  secondary: 'border-line-strong bg-surface text-ink hover:border-ink-faint hover:bg-surface-hover',
  ghost: 'border-transparent bg-transparent text-ink-muted hover:bg-surface-hover hover:text-ink',
};

const SIZES: Record<string, string> = {
  sm: 'h-7 gap-1.5 px-2.5 text-xs',
  md: 'h-8 gap-1.5 px-3 text-[13px]',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md border font-medium transition-colors ' +
    'disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <button
      type="button"
      className={`${base} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
