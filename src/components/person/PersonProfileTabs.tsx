'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PersonProfileTabsProps {
  personId: string;
  activeTab: string;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'person' },
  { id: 'relationships', label: 'Relationships', icon: 'family_restroom' },
  { id: 'media', label: 'Media', icon: 'photo_library' },
  { id: 'events', label: 'Life Events', icon: 'event' },
  { id: 'sources', label: 'Sources', icon: 'description' },
];

export function PersonProfileTabs({ personId, activeTab }: PersonProfileTabsProps) {
  return (
    <div className="mb-8">
      <div className="flex border-b border-[#cfe3e7] dark:border-gray-800 px-4 gap-8">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/dashboard/persons/${personId}/${tab.id}`}
            className={cn(
              'flex items-center gap-2 pb-[13px] pt-4 border-b-[3px] transition-colors',
              activeTab === tab.id
                ? 'border-b-primary text-[#0d191b] dark:text-white'
                : 'border-b-transparent text-[#4c8d9a] hover:text-primary'
            )
            }
          >
            <MaterialSymbol icon={tab.icon as any} className="text-lg" />
            <p className="text-sm font-bold tracking-[0.015em]">{tab.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
