# Task 16: Create UI Components

**Phase:** 9 - UI Components
**Priority:** High
**Dependencies:** Task 03
**Estimated Complexity:** High

---

## Objective

Create reusable UI components following the design system from the HTML prototypes. Components should be accessible, responsive, and follow React best practices.

---

## Design System Analysis

Based on design files review:

### Color Palette

```typescript
const colors = {
  primary: '#13c8ec',
  'background-light': '#f6f8f8',
  'background-dark': '#101f22',
  'text-primary': '#0d191b',
  'text-secondary': '#4c8d9a',
  'border-light': '#e7f1f3',
  'border-dark': 'rgba(255, 255, 255, 0.1)',
};
```

### Typography

```typescript
const typography = {
  fontFamily: '"Work Sans", sans-serif',
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
};
```

### Spacing & Borders

```typescript
const design = {
  borderRadius: {
    DEFAULT: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    lg: '0 10px 15px -3px rgba(19, 200, 236, 0.25)',
  },
};
```

---

## Components to Create

### Base UI Components

| Component | Props | Used In |
|-----------|-------|---------|
| Button | variant, size, loading, disabled | All pages |
| Input | type, error, icon, label | Forms |
| Card | variant, padding, hover | Dashboard, Profile |
| Modal | open, onClose, title | Add Person, Confirm |
| Avatar | src, size, fallback | Header, Profile |
| Badge | variant, size | Tree cards |
| Tabs | items, activeTab | Profile |
| Dropdown | options, value, onChange | Settings |
| Toggle | checked, onChange | Settings |
| Spinner | size | Loading states |

### Feature Components

| Component | Purpose |
|-----------|---------|
| TreeCard | Display family tree preview |
| PersonNode | Tree visualization node |
| PersonCard | Person summary card |
| PersonForm | Add/Edit person form |
| RelationshipPicker | Select relationship type |
| ActivityItem | Recent activity entry |
| InvitationCard | Collaboration invitation |

---

## Component Specifications

### 1. Button Component

**File:** `src/components/ui/Button.tsx`

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90',
        secondary: 'bg-[#e7f1f3] dark:bg-white/10 text-[#0d191b] dark:text-white hover:bg-[#d0e5e9]',
        outline: 'border border-[#e7f1f3] dark:border-white/10 hover:bg-[#f8fbfc] dark:hover:bg-white/5',
        ghost: 'hover:bg-[#e7f1f3] dark:hover:bg-white/5',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);
```

**UX Improvements:**
- Loading state with spinner
- Disabled visual feedback
- Active press animation
- Icon support (left/right)
- Dark mode support

### 2. Input Component

**File:** `src/components/ui/Input.tsx`

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-semibold text-[#0d191b] dark:text-white">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#4c8d9a]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'block w-full rounded-xl border-none bg-[#e7f1f3] dark:bg-white/5',
              'px-4 py-3 text-[#0d191b] dark:text-white',
              'placeholder:text-[#4c8d9a]',
              'focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-white/10',
              'transition-all',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error && 'ring-2 ring-red-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <ErrorIcon size={12} />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[#4c8d9a]">{hint}</p>
        )}
      </div>
    );
  }
);
```

**UX Improvements:**
- Clear error states with icon
- Hint text support
- Icon placement (email, password icons)
- Focus ring animation
- Dark mode colors

### 3. Card Component

**File:** `src/components/ui/Card.tsx`

```typescript
const cardVariants = cva(
  'rounded-2xl border transition-all',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-white/5 border-[#e7f1f3] dark:border-white/10 shadow-sm',
        elevated: 'bg-white dark:bg-white/5 border-transparent shadow-lg',
        outline: 'bg-transparent border-[#e7f1f3] dark:border-white/10',
        ghost: 'bg-transparent border-transparent',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hover: {
        true: 'hover:shadow-md hover:border-primary/20 cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: false,
    },
  }
);
```

### 4. Modal Component

**File:** `src/components/ui/Modal.tsx`

```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  // Focus trap
  // Escape key handling
  // Click outside to close
  // Animation (fade + scale)
}
```

**UX Improvements:**
- Backdrop blur effect
- Focus trap for accessibility
- Escape key closes modal
- Click outside closes
- Smooth open/close animation
- Prevent body scroll when open

### 5. TreeCard Component (Feature)

**File:** `src/components/tree/TreeCard.tsx`

Based on `dashboard.html` design:

```typescript
interface TreeCardProps {
  tree: ITree;
  memberCount: number;
  lastUpdated: Date;
  isMain?: boolean;
  coverImage?: string;
  onClick?: () => void;
}

export function TreeCard({ tree, memberCount, lastUpdated, isMain, coverImage, onClick }: TreeCardProps) {
  return (
    <div
      className="flex flex-col gap-3 group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm transition-transform group-hover:scale-[1.02]">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />

        {/* Cover image */}
        <div
          className="w-full h-full bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${coverImage})` }}
        />

        {/* Badge */}
        {isMain && (
          <div className="absolute bottom-3 left-3 z-20">
            <Badge variant="primary">Main</Badge>
          </div>
        )}
      </div>

      <div>
        <p className="text-[#0d191b] dark:text-white text-base font-bold group-hover:text-primary transition-colors">
          {tree.name}
        </p>
        <div className="flex items-center gap-3 text-[#4c8d9a] text-xs">
          <span className="flex items-center gap-1">
            <Users size={14} />
            {memberCount} members
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatRelativeTime(lastUpdated)}
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## Edge Cases & Accessibility

### Button Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Long text | Text truncation with ellipsis |
| No children | Icon-only button |
| Loading + disabled | Loading takes precedence |
| Touch devices | Larger touch targets |

### Input Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Password visibility | Toggle icon in rightIcon |
| Very long error | Wrap to multiple lines |
| Autofill styles | Override browser defaults |
| Validation timing | On blur, not on change |

### Modal Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Content overflow | Scrollable content area |
| Nested modals | Not supported, avoid |
| Rapid open/close | Animation cleanup |
| Mobile keyboard | Viewport adjustment |

---

## Accessibility Requirements

| Component | ARIA | Keyboard | Focus |
|-----------|------|----------|-------|
| Button | role="button" | Enter, Space | visible ring |
| Input | aria-invalid, aria-describedby | Tab | visible ring |
| Modal | role="dialog", aria-modal | Escape, Tab trap | auto-focus first |
| Dropdown | role="listbox", aria-selected | Arrow keys | highlight option |

---

## Testing Strategy

```typescript
// tests/unit/components/Button.test.tsx
describe('Button', () => {
  it('renders with correct variant styles', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard activation', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByRole('button').focus();
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## Acceptance Criteria

- [ ] All base UI components created
- [ ] All feature components created
- [ ] Dark mode support
- [ ] Responsive design
- [ ] Accessibility compliant (WCAG 2.1 AA)
- [ ] Unit tests for all components
- [ ] Storybook stories (optional)
- [ ] TypeScript props documented
