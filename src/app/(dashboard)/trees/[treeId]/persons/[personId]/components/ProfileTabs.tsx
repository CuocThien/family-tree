import { cn } from '@/lib/utils';

type TabId = 'overview' | 'relationships' | 'media' | 'life-events';

interface ProfileTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'media', label: 'Media' },
  { id: 'life-events', label: 'Life Events' },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-[#e7f1f3] dark:bg-white/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#13c8ec]',
            activeTab === tab.id
              ? 'bg-white dark:bg-[#101f22] text-[#0d191b] dark:text-white shadow-sm'
              : 'text-[#4c8d9a] hover:text-[#0d191b] dark:hover:text-white'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
