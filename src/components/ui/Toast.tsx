'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

export function Toast({ id, message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const config = {
    success: {
      icon: '✓',
      bgColor: 'bg-green-500',
      textColor: 'text-white',
    },
    error: {
      icon: '✕',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
    },
    warning: {
      icon: '⚠',
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
    },
    info: {
      icon: 'ℹ',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
    },
  };

  const { icon, bgColor, textColor } = config[type];

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-5',
        bgColor,
        textColor
      )}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-2 hover:opacity-70 transition-opacity"
        aria-label="Close toast"
      >
        ✕
      </button>
    </div>
  );
}
