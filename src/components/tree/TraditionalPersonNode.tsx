import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatLifespan } from '@/lib/utils';
import { IPerson } from '@/types/person';
import { PersonNodeData } from './PersonNode.flow';

interface TraditionalPersonNodeProps extends NodeProps<PersonNodeData> {
  showGenerationBadge?: boolean;
  variant?: 'traditional' | 'modern';
}

export const TraditionalPersonNode = memo(function TraditionalPersonNode({
  data,
  selected,
  showGenerationBadge = true,
  variant = 'traditional',
}: TraditionalPersonNodeProps) {
  const { person, isRoot, generation } = data;
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const hasPhoto = person.photos && person.photos.length > 0;
  const photoUrl = hasPhoto ? person.photos[0] : undefined;

  // Gender-based styling
  const isMale = person.gender === 'male';
  const borderColor = isMale
    ? 'border-blue-500 dark:border-blue-400'
    : 'border-pink-500 dark:border-pink-400';

  const bgColor = 'bg-white dark:bg-surface-elevated';
  const textColor = 'text-foreground dark:text-foreground';

  // Size variations
  const sizeClass = isRoot
    ? 'w-36 h-28'
    : generation === 0 || generation === 1
    ? 'w-32 h-24'
    : 'w-28 h-20';

  const avatarSize = isRoot ? 'w-16 h-16' : generation === 0 || generation === 1 ? 'w-14 h-14' : 'w-12 h-12';
  const nameSize = isRoot ? 'text-sm' : 'text-xs';
  const dateSize = 'text-[10px]';

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all duration-200',
        selected && 'ring-4 ring-cyan-400 ring-offset-2'
      )}
    >
      {/* Generation Badge */}
      {showGenerationBadge && generation !== undefined && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-500 dark:bg-amber-600 flex items-center justify-center text-white text-xs font-bold z-10 shadow-md">
          {generation < 0 ? `A${Math.abs(generation)}` : generation === 0 ? '根' : `D${generation}`}
        </div>
      )}

      {/* Traditional rectangular card */}
      <div
        className={cn(
          'flex flex-col items-center p-3 rounded-lg shadow-md border-2 transition-all duration-200',
          sizeClass,
          bgColor,
          borderColor,
          'hover:scale-105 hover:shadow-lg'
        )}
      >
        {/* Target handle (top) */}
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-gray-400 !border-2 !border-white dark:!border-surface-elevated !w-2 !h-2"
        />

        {/* Avatar */}
        <div className={cn('rounded-full border-2 border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm', avatarSize)}>
          <Avatar
            src={photoUrl}
            fullName={fullName}
            className="w-full h-full"
          />
        </div>

        {/* Name */}
        <p className={cn('font-bold text-center truncate w-full mt-1', textColor, nameSize)}>
          {person.firstName} {person.lastName}
        </p>

        {/* Dates */}
        <p className={cn('text-center text-gray-500 dark:text-gray-400 tabular-nums', dateSize)}>
          {formatLifespan(person.dateOfBirth, person.dateOfDeath)}
        </p>

        {/* Source handle (bottom) */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-gray-400 !border-2 !border-white dark:!border-surface-elevated !w-2 !h-2"
        />
      </div>

      {/* Spouse handles (left/right) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-pink-400 !border-2 !border-white dark:!border-surface-elevated !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-pink-400 !border-2 !border-white dark:!border-surface-elevated !w-2 !h-2"
      />
    </div>
  );
});

TraditionalPersonNode.displayName = 'TraditionalPersonNode';
