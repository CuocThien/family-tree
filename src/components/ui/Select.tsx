import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'options'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      onValueChange,
      className,
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint ? `${selectId}-hint` : undefined;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-semibold text-[#0d191b] dark:text-white"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'block w-full rounded-xl border-none bg-[#e7f1f3] dark:bg-white/5',
            'px-4 py-3 text-[#0d191b] dark:text-white',
            'focus:ring-2 focus:ring-[#13c8ec] focus:bg-white dark:focus:bg-white/10',
            'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'ring-2 ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={cn(
            error && errorId,
            hint && !error && hintId
          )}
          onChange={handleChange}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="text-xs text-red-500 flex items-center gap-1" role="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={12}
              height={12}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-[#4c8d9a]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
