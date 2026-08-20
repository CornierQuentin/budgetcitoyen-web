import type { ReactNode } from 'react';

/**
 * `tone` encode un état, pas une décoration. « pos »/« neg » ne servent qu'aux
 * variations (un écart d'une année sur l'autre) : un montant absolu n'est
 * jamais teinté, la neutralité politique étant une contrainte produit.
 */
type BadgeTone = 'accent' | 'quiet' | 'pos' | 'neg' | 'warn';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const TONES: Record<BadgeTone, string> = {
  accent: 'border-accent-line bg-accent-soft text-accent',
  quiet: 'border-line bg-surface-sunken text-ink-muted',
  pos: 'border-pos/25 bg-pos-soft text-pos',
  neg: 'border-neg/25 bg-neg-soft text-neg',
  warn: 'border-warn/30 bg-warn-soft text-warn',
};

export function Badge({ children, tone = 'accent', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px]
        font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
