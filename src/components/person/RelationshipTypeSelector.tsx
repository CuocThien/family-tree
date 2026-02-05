'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { RelationshipType } from '@/schemas/person';
import { cn } from '@/lib/utils';

interface RelationshipTypeSelectorProps {
  onSelect: (type: RelationshipType) => void;
  onClose: () => void;
}

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string; icon: string; description: string }[] = [
  { value: 'parent', label: 'Parent', icon: 'north', description: 'Mother, father, or guardian' },
  { value: 'child', label: 'Child', icon: 'south', description: 'Son, daughter, or dependent' },
  { value: 'spouse', label: 'Spouse', icon: 'favorite', description: 'Husband, wife, or partner' },
  { value: 'sibling', label: 'Sibling', icon: 'group', description: 'Brother or sister' },
  { value: 'step-parent', label: 'Step Parent', icon: 'north', description: 'Step mother or step father' },
  { value: 'step-child', label: 'Step Child', icon: 'south', description: 'Step son or step daughter' },
  { value: 'adoptive-parent', label: 'Adoptive Parent', icon: 'north', description: 'Adoptive mother or father' },
  { value: 'adoptive-child', label: 'Adoptive Child', icon: 'south', description: 'Adoptive son or daughter' },
  { value: 'partner', label: 'Partner', icon: 'favorite', description: 'Domestic or life partner' },
];

export function RelationshipTypeSelector({ onSelect, onClose }: RelationshipTypeSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#152528] rounded-2xl shadow-2xl border border-[#e7f1f3] dark:border-[#2a3a3d] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e7f1f3] dark:border-[#2a3a3d]">
          <h3 className="text-lg font-bold text-[#0d191b] dark:text-white">Select Relationship</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg size-8 hover:bg-[#f0f5f6] dark:hover:bg-[#1f2f32] transition-colors"
          >
            <MaterialSymbol icon="close" className="text-[#4c8d9a]" />
          </button>
        </div>

        {/* Relationship Types Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-2">
            {RELATIONSHIP_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => onSelect(type.value)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  'border-[#cfe3e7] dark:border-[#2a3a3d]',
                  'hover:border-primary hover:bg-[#f8fbfc] dark:hover:bg-[#1a2e32]',
                  'text-left'
                )}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MaterialSymbol icon={type.icon as any} className="text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0d191b] dark:text-white">
                    {type.label}
                  </p>
                  <p className="text-xs text-[#4c8d9a]">
                    {type.description}
                  </p>
                </div>

                {/* Chevron */}
                <MaterialSymbol icon="chevron_right" className="text-[#4c8d9a]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
