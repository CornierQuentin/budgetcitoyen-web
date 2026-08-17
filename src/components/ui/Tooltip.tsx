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
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max max-w-xs
          -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-center text-xs text-white opacity-0
          transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

export default Tooltip;
