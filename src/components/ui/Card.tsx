import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /**
   * Titre du panneau. Dès qu'il est fourni, la carte adopte la structure
   * en-tête + corps (filet de séparation, titre à gauche, actions à droite)
   * plutôt qu'un simple bloc rembourré.
   */
  title?: ReactNode;
  /** Précision discrète posée à côté du titre (ex. « 32 missions · 593,9 Md€ »). */
  note?: ReactNode;
  /** Actions alignées à droite de l'en-tête (export, filtre…). */
  actions?: ReactNode;
  /**
   * Supprime le rembourrage du corps : nécessaire pour un tableau qui doit
   * filer jusqu'aux bords de la carte.
   */
  flush?: boolean;
  /** Contenu discret en pied de carte, sous un filet (source, précision). */
  footer?: ReactNode;
}

export function Card({
  children,
  className = '',
  title,
  note,
  actions,
  flush = false,
  footer,
}: CardProps) {
  const structuree = title !== undefined || actions !== undefined || footer !== undefined;

  if (!structuree) {
    return (
      <div className={`rounded-lg border border-line bg-surface p-4 shadow-sm ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-line bg-surface shadow-sm ${className}`}>
      {(title !== undefined || actions !== undefined) && (
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          {title !== undefined && (
            <h2 className="text-[13.5px] font-bold tracking-[-0.008em] text-ink">{title}</h2>
          )}
          {note !== undefined && <span className="text-xs text-ink-muted">{note}</span>}
          {actions !== undefined && <div className="ml-auto flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className={flush ? '' : 'p-4'}>{children}</div>

      {footer !== undefined && (
        <div className="border-t border-line px-4 py-3 text-xs text-ink-muted">{footer}</div>
      )}
    </div>
  );
}

export default Card;
