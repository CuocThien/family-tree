import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Avatar } from '@/components/ui/Avatar';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { cn } from '@/lib/utils';
import { IPerson } from '@/types/person';

export interface PersonNodeData {
  person: IPerson;
  isRoot?: boolean;
  generation?: number;
}

interface TraditionalPersonNodeProps extends NodeProps<PersonNodeData> {
  showGenerationBadge?: boolean;
}

export const TraditionalPersonNode = memo(function TraditionalPersonNode({
  data,
  selected,
}: TraditionalPersonNodeProps) {
  const { person, isRoot, generation } = data;
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const hasPhoto = person.photos && person.photos.length > 0;
  const photoUrl = hasPhoto ? person.photos[0] : undefined;

  // Gender-based styling - primary color for male, pink for female
  const isMale = person.gender === 'male';
  const borderColor = isMale
    ? 'border-primary'
    : 'border-pink-400';

  const iconColor = isMale
    ? 'text-primary'
    : 'text-pink-400';

  // Size variations based on generation
  // Generation 0 (root) and 1: size-14 (56px)
  // Generation 2+: size-12 (48px)
  const sizeClass = (isRoot || generation === 0 || generation === 1)
    ? 'size-14'
    : 'size-12';

  const iconSize = (isRoot || generation === 0 || generation === 1)
    ? 'text-3xl'
    : 'text-2xl';

  const nameSize = (isRoot || generation === 0 || generation === 1)
    ? 'text-xs'
    : 'text-[10px]';

  return (
    <div
      className={cn(
        'flex flex-col items-center group cursor-pointer transition-all duration-200',
        selected && 'ring-4 ring-primary/40 ring-offset-2 rounded-full'
      )}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !border-2 !border-white dark:!border-surface-elevated !w-2 !h-2"
      />

      {/* Circular Avatar */}
      <div
        className={cn(
          'rounded-full border-2 bg-white flex items-center justify-center shadow-md mb-2 transition-all duration-200',
          'hover:scale-105 hover:shadow-lg',
          sizeClass,
          borderColor,
          hasPhoto && 'overflow-hidden'
        )}
      >
        {hasPhoto ? (
          <Avatar
            src={photoUrl}
            fullName={fullName}
            className="w-full h-full"
          />
        ) : (
          <MaterialSymbol
            icon={isMale ? 'person' : 'person_4'}
            className={cn(iconSize, iconColor)}
          />
        )}
      </div>

      {/* Name */}
      <p className={cn(
        'font-bold text-center text-foreground max-w-[100px] leading-tight',
        nameSize
      )}>
        {person.firstName}
        {person.lastName && (
          <>
            <br />
            {person.lastName}
          </>
        )}
      </p>

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !border-2 !border-white dark:!border-surface-elevated !w-2 !h-2"
      />

      {/* Spouse handles (left/right) */}
      <Handle
        type="target"
        position={Position.Left}
        id="spouse-target"
        className="!bg-gray-400 !border-2 !border-white dark:!border-surface-elevated !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="spouse-source"
        className="!bg-gray-400 !border-2 !border-white dark:!border-surface-elevated !w-2 !h-2"
      />
    </div>
  );
});

TraditionalPersonNode.displayName = 'TraditionalPersonNode';
