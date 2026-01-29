'use client';

import { createContext, useContext, useState, useRef, useEffect, type ReactNode, type KeyboardEvent, type MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedValue: string;
  setSelectedValue: (value: string) => void;
}

const DropdownContext = createContext<DropdownContextValue | undefined>(undefined);

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

export function Dropdown({
  options,
  value: controlledValue,
  defaultValue = '',
  onChange,
  placeholder = 'Select an option',
  className,
  triggerClassName,
  menuClassName,
}: DropdownProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const selectedValue = controlledValue !== undefined ? controlledValue : uncontrolledValue;
  const setSelectedValue = (newValue: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(newValue);
    }
    onChange?.(newValue);
    setIsOpen(false);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
      return;
    }

    if (!isOpen) return;

    const currentIndex = options.findIndex((opt) => opt.value === selectedValue);
    let newIndex = currentIndex;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % options.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = options.length - 1;
    }

    if (newIndex !== currentIndex && !options[newIndex].disabled) {
      setSelectedValue(options[newIndex].value);
    }
  };

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, selectedValue, setSelectedValue }}>
      <div ref={dropdownRef} className={cn('relative', className)}>
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby="dropdown-label"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex items-center justify-between w-full rounded-xl',
            'bg-white dark:bg-[#101f22] border border-[#e7f1f3] dark:border-white/10',
            'px-4 py-3 text-[#0d191b] dark:text-white',
            'focus:ring-2 focus:ring-[#13c8ec] focus:outline-none',
            'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2">
            {selectedOption?.icon && <span aria-hidden="true">{selectedOption.icon}</span>}
            <span className={cn(!selectedOption && 'text-[#4c8d9a]')}>
              {selectedOption?.label || placeholder}
            </span>
          </span>
          <svg
            className={cn('w-5 h-5 text-[#4c8d9a] transition-transform', isOpen && 'rotate-180')}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <ul
            role="listbox"
            aria-activedescendant={`option-${selectedValue}`}
            className={cn(
              'absolute z-50 w-full mt-1 rounded-xl',
              'bg-white dark:bg-[#101f22] border border-[#e7f1f3] dark:border-white/10',
              'shadow-lg max-h-60 overflow-auto',
              'py-1',
              menuClassName
            )}
          >
            {options.map((option) => (
              <li
                key={option.value}
                id={`option-${option.value}`}
                role="option"
                aria-selected={option.value === selectedValue}
                aria-disabled={option.disabled}
                onClick={() => !option.disabled && setSelectedValue(option.value)}
                className={cn(
                  'px-4 py-3 cursor-pointer transition-colors',
                  'flex items-center gap-2',
                  'focus:bg-[#e7f1f3] dark:focus:bg-white/5 focus:outline-none',
                  option.value === selectedValue && 'bg-[#e7f1f3] dark:bg-white/5',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.icon && <span aria-hidden="true">{option.icon}</span>}
                <span className="text-sm font-medium text-[#0d191b] dark:text-white">
                  {option.label}
                </span>
                {option.value === selectedValue && (
                  <svg
                    className="ml-auto w-4 h-4 text-[#13c8ec]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

Dropdown.displayName = 'Dropdown';
