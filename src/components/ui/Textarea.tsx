import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-semibold text-[#0d191b] dark:text-white"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          className={cn(
            'block w-full rounded-xl border-none bg-[#e7f1f3] dark:bg-white/5',
            'px-4 py-3 text-[#0d191b] dark:text-white placeholder:text-[#4c8d9a]',
            'focus:ring-2 focus:ring-[#13c8ec] focus:bg-white dark:focus:bg-white/10',
            'transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none',
            error && 'ring-2 ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={cn(
            error && errorId,
            hint && !error && hintId
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
