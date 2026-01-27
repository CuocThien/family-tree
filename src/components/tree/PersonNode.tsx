import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import type { IPerson } from '@/types/person';

export interface PersonNodeProps {
  person: IPerson;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  showSpouse?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'min-w-[80px] max-w-[80px]',
  md: 'min-w-[120px] max-w-[120px]',
  lg: 'min-w-[160px] max-w-[160px]',
};

const avatarSizes = {
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
};

export function PersonNode({
  person,
  isSelected = false,
  isHighlighted = false,
  onClick,
  onDoubleClick,
  className,
  size = 'md',
}: PersonNodeProps) {
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const hasPhoto = person.photos && person.photos.length > 0;
  const photoUrl = hasPhoto ? person.photos[0] : undefined;

  // Generate color based on gender
  const getGenderColor = (gender?: string) => {
    switch (gender) {
      case 'male':
        return 'male';
      case 'female':
        return 'female';
      default:
        return undefined;
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl transition-all cursor-pointer',
        'bg-white dark:bg-[#101f22] border-2',
        'hover:shadow-md',
        isSelected && 'border-[#13c8ec] shadow-lg shadow-[#13c8ec]/20',
        !isSelected && 'border-transparent hover:border-[#e7f1f3] dark:hover:border-white/10',
        isHighlighted && 'ring-2 ring-[#13c8ec]/50',
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={fullName}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Avatar */}
      <Avatar
        src={photoUrl}
        fullName={fullName}
        size={avatarSizes[size]}
        alt={fullName}
        className="ring-2 ring-[#e7f1f3] dark:ring-white/10"
      />

      {/* Name */}
      <div className="text-center w-full">
        <p className="text-sm font-semibold text-[#0d191b] dark:text-white truncate">
          {person.firstName}
        </p>
        {person.lastName && (
          <p className="text-xs text-[#4c8d9a] truncate">
            {person.lastName}
          </p>
        )}
      </div>

      {/* Dates */}
      {(person.dateOfBirth || person.dateOfDeath) && (
        <div className="text-xs text-[#4c8d9a] text-center">
          {person.dateOfBirth && (
            <span>{new Date(person.dateOfBirth).getFullYear()}</span>
          )}
          {person.dateOfDeath && (
            <>
              <span className="mx-1">–</span>
              <span>{new Date(person.dateOfDeath).getFullYear()}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

PersonNode.displayName = 'PersonNode';
