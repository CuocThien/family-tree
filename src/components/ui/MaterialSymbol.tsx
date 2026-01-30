'use client';

import { HTMLAttributes } from 'react';

interface MaterialSymbolProps extends HTMLAttributes<HTMLSpanElement> {
  icon: string;
  className?: string;
}

export function MaterialSymbol({ icon, className = '', ...props }: MaterialSymbolProps) {
  return (
    <span className={`material-symbols-outlined ${className}`} {...props}>
      {icon}
    </span>
  );
}
