import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  label: string;
}

export function Tooltip({ children, label }: TooltipProps) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2
          whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0
          transition-opacity group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

export default Tooltip;
