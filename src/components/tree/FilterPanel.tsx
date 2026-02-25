'use client';

import { useTreeBoardStore } from '@/store/treeBoardStore';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';

interface FilterPanelProps {
  treeId: string;
}

interface QuickAccessItem {
  label: string;
  name: string;
}

export function FilterPanel({ treeId }: FilterPanelProps) {
  const clearFilters = useTreeBoardStore((state) => state.clearFilters);

  // Quick Access items - these would typically come from tree metadata
  const quickAccessItems: QuickAccessItem[] = [
    { label: 'Dong noi', name: 'Ho Nguyen' },
    { label: 'Dong ngoai', name: 'Ho Le' },
  ];

  return (
    <aside className="z-20 w-64 border-r border-border bg-surface p-4 flex flex-col justify-between overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Navigation Section */}
        <div>
          <h1 className="text-foreground text-xs font-bold uppercase tracking-wider mb-4 opacity-60">
            Navigation
          </h1>
          <nav className="flex flex-col gap-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/10 text-primary">
              <MaterialSymbol icon="tune" />
              <p className="text-sm font-semibold">Filters</p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-secondary hover:bg-surface-elevated rounded-xl cursor-pointer">
              <MaterialSymbol icon="layers" />
              <p className="text-sm font-medium">Generations</p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-secondary hover:bg-surface-elevated rounded-xl cursor-pointer">
              <MaterialSymbol icon="account_tree" />
              <p className="text-sm font-medium">Branches</p>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-secondary hover:bg-surface-elevated rounded-xl cursor-pointer">
              <MaterialSymbol icon="settings" />
              <p className="text-sm font-medium">Settings</p>
            </div>
          </nav>
        </div>

        {/* Quick Access Section */}
        <div className="border-t border-border pt-6">
          <h1 className="text-foreground text-xs font-bold uppercase tracking-wider mb-4 opacity-60">
            Quick Access
          </h1>
          <div className="space-y-3">
            {quickAccessItems.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-surface-elevated rounded-xl border border-border cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <p className="text-xs text-secondary mb-1">{item.label}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{item.name}</span>
                  <MaterialSymbol icon="chevron_right" className="text-sm text-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export PDF Button */}
      <div className="pt-4">
        <button
          onClick={() => window.open(`/api/trees/${treeId}/export/pdf`, '_blank')}
          className="w-full flex cursor-pointer items-center justify-center rounded-xl h-11 px-4 bg-primary text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
        >
          <MaterialSymbol icon="picture_as_pdf" className="mr-2 text-xl" />
          <span className="truncate">Export PDF</span>
        </button>
      </div>

      {/* Clear Filters Button */}
      <div className="pt-2">
        <button
          onClick={clearFilters}
          className="w-full py-2 text-secondary text-sm font-medium hover:text-primary transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </aside>
  );
}
