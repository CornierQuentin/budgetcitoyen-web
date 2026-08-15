import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
