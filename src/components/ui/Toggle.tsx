'use client';

import { forwardRef, useState, type ButtonHTMLAttributes, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      label,
      description,
      size = 'md',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);

    const checked = controlledChecked !== undefined ? controlledChecked : uncontrolledChecked;

    const handleToggle = () => {
      if (disabled) return;
      const newChecked = !checked;
      if (controlledChecked === undefined) {
        setUncontrolledChecked(newChecked);
      }
      onChange?.(newChecked);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    };

    const sizeClasses = {
      sm: { width: 'w-9', thumb: 'w-5 h-5', translate: 'translate-x-4' },
      md: { width: 'w-11', thumb: 'w-6 h-6', translate: 'translate-x-5' },
      lg: { width: 'w-14', thumb: 'w-7 h-7', translate: 'translate-x-7' },
    };

    const currentSize = sizeClasses[size];

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            'relative inline-flex flex-shrink-0 rounded-full p-1 transition-colors duration-200 ease-in-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#13c8ec] focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            currentSize.width,
            checked ? 'bg-[#13c8ec]' : 'bg-[#e7f1f3] dark:bg-white/10'
          )}
          {...props}
        >
          <span
            className={cn(
              'pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out',
              currentSize.thumb,
              checked ? currentSize.translate : 'translate-x-0'
            )}
            aria-hidden="true"
          />
        </button>

        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <span className="text-sm font-semibold text-[#0d191b] dark:text-white">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-[#4c8d9a]">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
