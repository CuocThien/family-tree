import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatLifespan } from '@/lib/utils';
import { IPerson } from '@/types/person';

export interface PersonNodeData {
  person: IPerson;
  isRoot?: boolean;
  generation?: number;
}

export const PersonNode = memo(function PersonNode({
  data,
  selected,
}: NodeProps<PersonNodeData>) {
  const { person, isRoot, generation } = data;
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const hasPhoto = person.photos && person.photos.length > 0;
  const photoUrl = hasPhoto ? person.photos[0] : undefined;

  // Determine size based on node role
  const sizeClass = isRoot ? 'w-20 h-20' : generation === 1 ? 'w-16 h-16' : 'w-12 h-12';
  const textSizeClass = isRoot ? 'text-sm' : generation === 1 ? 'text-xs' : 'text-[10px]';

  return (
    <div
      className={cn(
        'flex flex-col items-center group cursor-pointer transition-all duration-200',
        'hover:scale-105'
      )}
    >
      {/* Target handle (for incoming edges) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[#13c8ec] !border-2 !border-white dark:!border-[#101f22] !w-3 !h-3"
      />

      {/* Avatar */}
      <div
        className={cn(
          sizeClass,
          'rounded-full p-1 shadow-lg transition-all duration-200',
          isRoot
            ? 'border-4 border-[#13c8ec]'
            : selected
            ? 'border-2 border-[#13c8ec]'
            : 'border-2 border-[#cbd5e1] dark:border-[#2d3a3c]',
          'bg-white dark:bg-[#1e2f32]'
        )}
      >
        <Avatar
          src={photoUrl}
          fullName={fullName}
          className="w-full h-full"
        />
      </div>

      {/* Name label */}
      <div className="mt-2 text-center bg-white/95 dark:bg-[#1e2f32]/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-[#e7f1f3] dark:border-white/10 min-w-[100px]">
        <p className={cn('font-bold text-[#0d191b] dark:text-white truncate', textSizeClass)}>
          {person.firstName} {person.lastName}
        </p>
        <p className="text-[9px] text-[#4c8d9a] tabular-nums">
          {formatLifespan(person.dateOfBirth, person.dateOfDeath)}
        </p>
      </div>

      {/* Source handle (for outgoing edges) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[#13c8ec] !border-2 !border-white dark:!border-[#101f22] !w-3 !h-3"
      />
    </div>
  );
});

PersonNode.displayName = 'PersonNode';
