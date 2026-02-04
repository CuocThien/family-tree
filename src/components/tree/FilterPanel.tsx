'use client';

import { useTreeBoardStore } from '@/store/treeBoardStore';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import type { GenerationFilter, GenderFilter, LifeStatusFilter } from './types';

interface FilterPanelProps {
  treeId: string;
}

export function FilterPanel({ treeId }: FilterPanelProps) {
  const filters = useTreeBoardStore((state) => state.filters);
  const setFilter = useTreeBoardStore((state) => state.setFilter);
  const clearFilters = useTreeBoardStore((state) => state.clearFilters);

  const generations: GenerationFilter[] = [1, 2, 3, 4, 5, 6, 7, 8];
  const genders: GenderFilter[] = ['male', 'female', 'other'];
  const lifeStatuses: LifeStatusFilter[] = ['all', 'living', 'deceased'];

  const toggleGender = (gender: GenderFilter) => {
    const current = filters.gender || [];
    const updated = current.includes(gender)
      ? current.filter((g) => g !== gender)
      : [...current, gender];
    setFilter({ gender: updated });
  };

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
          </nav>
        </div>

        {/* Generation Filter */}
        <div className="border-t border-border pt-6">
          <h2 className="text-foreground text-sm font-bold mb-4">
            Generations to Show
          </h2>
          <div className="flex flex-wrap gap-2">
            {generations.map((gen) => (
              <button
                key={gen}
                onClick={() => setFilter({ generations: gen })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.generations === gen
                    ? 'bg-primary text-white'
                    : 'bg-border text-secondary'
                }`}
              >
                {gen}
              </button>
            ))}
          </div>
        </div>

        {/* Gender Filter */}
        <div className="border-t border-border pt-6">
          <h2 className="text-foreground text-sm font-bold mb-4">
            Gender
          </h2>
          <div className="space-y-2">
            {genders.map((gender) => (
              <label key={gender} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters.gender || []).includes(gender)}
                  onChange={() => toggleGender(gender)}
                  className="form-checkbox rounded text-primary focus:ring-primary bg-surface dark:bg-surface-elevated border-border"
                />
                <span className="text-sm capitalize text-secondary">{gender}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Life Status Filter */}
        <div className="border-t border-border pt-6">
          <h2 className="text-foreground text-sm font-bold mb-4">
            Life Status
          </h2>
          <div className="space-y-2">
            {lifeStatuses.map((status) => (
              <label key={status} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="lifeStatus"
                  checked={filters.lifeStatus === status}
                  onChange={() => setFilter({ lifeStatus: status })}
                  className="form-radio text-primary focus:ring-primary bg-surface dark:bg-surface-elevated border-border"
                />
                <span className="text-sm capitalize text-secondary">{status}</span>
              </label>
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
