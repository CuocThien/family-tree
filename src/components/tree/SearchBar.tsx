'use client';

import { useTreeBoardStore } from '@/store/treeBoardStore';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';

export function SearchBar() {
  const setSearchQuery = useTreeBoardStore((state) => state.setSearchQuery);

  return (
    <div className="hidden lg:block w-72">
      <label className="flex flex-col h-10 w-full">
        <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-[#e7f1f3] dark:bg-[#1e2f32]">
          <div className="text-[#4c8d9a] flex items-center justify-center pl-4">
            <MaterialSymbol icon="search" className="text-xl" />
          </div>
          <input
            type="text"
            className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-[#0d191b] dark:text-white placeholder:text-[#4c8d9a] px-3 text-sm"
            placeholder="Search ancestors..."
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </label>
    </div>
  );
}
