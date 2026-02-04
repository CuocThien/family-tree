'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Button } from '@/components/ui/Button';
import { RelationshipType } from '@/schemas/person';
import { cn } from '@/lib/utils';

interface RelationshipEntryProps {
  index: number;
  relatedPersonName: string;
  relationshipType: RelationshipType;
  onRemove: () => void;
  onEdit: () => void;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  parent: 'Parent',
  child: 'Child',
  spouse: 'Spouse',
  sibling: 'Sibling',
  'step-parent': 'Step Parent',
  'step-child': 'Step Child',
  'adoptive-parent': 'Adoptive Parent',
  'adoptive-child': 'Adoptive Child',
  partner: 'Partner',
};

const RELATIONSHIP_ICONS: Record<RelationshipType, string> = {
  parent: 'north',
  child: 'south',
  spouse: 'favorite',
  sibling: 'group',
  'step-parent': 'north',
  'step-child': 'south',
  'adoptive-parent': 'north',
  'adoptive-child': 'south',
  partner: 'favorite',
};

export function RelationshipEntry({
  index,
  relatedPersonName,
  relationshipType,
  onRemove,
  onEdit,
}: RelationshipEntryProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[#e7f1f3] dark:border-[#2a3a3d] bg-[#f8fbfc] dark:bg-[#1a2e32]">
      {/* Index Badge */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
        {index + 1}
      </div>

      {/* Relationship Icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <MaterialSymbol icon={RELATIONSHIP_ICONS[relationshipType] as any} className="text-sm text-white" />
      </div>

      {/* Relationship Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0d191b] dark:text-white truncate">
          {relatedPersonName}
        </p>
        <p className="text-xs text-[#4c8d9a]">
          {RELATIONSHIP_LABELS[relationshipType]}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-[#e7f1f3] dark:hover:bg-[#2a3a3d] transition-colors"
          aria-label="Edit relationship"
        >
          <MaterialSymbol icon="edit" className="text-[#4c8d9a] text-lg" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          aria-label="Remove relationship"
        >
          <MaterialSymbol icon="delete" className="text-red-500 text-lg" />
        </button>
      </div>
    </div>
  );
}
