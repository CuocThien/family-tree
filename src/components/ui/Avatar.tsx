import { forwardRef, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallback?: string;
  fullName?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-24 w-24 text-3xl',
};

export const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      size = 'md',
      fallback,
      fullName,
      className,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    // Generate initials from full name
    const getInitials = (name?: string) => {
      if (!name) return fallback || '?';
      const parts = name.trim().split(' ');
      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const initials = getInitials(fullName);

    // Generate consistent background color based on name
    const getBackgroundColor = (name?: string) => {
      if (!name) return 'bg-[#13c8ec]';
      const colors = [
        'bg-[#13c8ec]',
        'bg-purple-500',
        'bg-pink-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-indigo-500',
      ];
      const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[index % colors.length];
    };

    if (src && !imageError) {
      return (
        <div className={cn('relative inline-block rounded-full overflow-hidden', sizeClasses[size])}>
          {!imageLoaded && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center text-white font-semibold',
                getBackgroundColor(fullName)
              )}
            >
                {initials}
            </div>
          )}
          <img
            ref={ref}
            src={src}
            alt={alt}
            className={cn(
              'h-full w-full object-cover',
              !imageLoaded && 'opacity-0',
              className
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            {...props}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full text-white font-semibold',
          sizeClasses[size],
          getBackgroundColor(fullName),
          className
        )}
        role="img"
        aria-label={alt || fullName || 'Avatar'}
      >
        {initials}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Import React for useState
import React from 'react';
