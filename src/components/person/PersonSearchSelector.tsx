'use client';

import { useState, useEffect } from 'react';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import type { IPerson } from '@/types/person';

interface PersonSearchSelectorProps {
  treeId: string;
  excludePersonIds?: string[];
  onSelect: (person: IPerson) => void;
  onClose: () => void;
}

export function PersonSearchSelector({
  treeId,
  excludePersonIds = [],
  onSelect,
  onClose,
}: PersonSearchSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [persons, setPersons] = useState<IPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersons = async () => {
      if (!treeId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/trees/${treeId}/persons?search=${encodeURIComponent(searchQuery)}`);

        if (!response.ok) {
          throw new Error('Failed to fetch persons');
        }

        const { data } = await response.json();

        // Filter out excluded persons
        const filteredPersons = data.filter((p: IPerson) => !excludePersonIds.includes(p._id));
        setPersons(filteredPersons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load persons');
        setPersons([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchPersons, 300);
    return () => clearTimeout(debounceTimer);
  }, [treeId, searchQuery, excludePersonIds]);

  const handleSelect = (person: IPerson) => {
    // Only call onSelect - it will handle closing the selector
    // Don't call onClose() here as it will interfere with the state management
    onSelect(person);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#152528] rounded-2xl shadow-2xl border border-[#e7f1f3] dark:border-[#2a3a3d] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e7f1f3] dark:border-[#2a3a3d]">
          <h3 className="text-lg font-bold text-[#0d191b] dark:text-white">Select Person</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg size-8 hover:bg-[#f0f5f6] dark:hover:bg-[#1f2f32] transition-colors"
          >
            <MaterialSymbol icon="close" className="text-[#4c8d9a]" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-[#e7f1f3] dark:border-[#2a3a3d]">
          <div className="relative">
            <MaterialSymbol
              icon="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4c8d9a]"
            />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Persons List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-500 text-sm">{error}</div>
          )}

          {!isLoading && !error && persons.length === 0 && (
            <div className="p-8 text-center">
              <MaterialSymbol icon="person_search" className="text-4xl text-[#4c8d9a] mx-auto mb-2" />
              <p className="text-[#0d191b] dark:text-white text-sm font-medium">
                {searchQuery ? 'No persons found' : 'Start typing to search'}
              </p>
            </div>
          )}

          {!isLoading && !error && persons.map((person) => (
            <button
              key={person._id}
              type="button"
              onClick={() => handleSelect(person)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fbfc] dark:hover:bg-[#1a2e32] transition-colors text-left"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-sm">
                {person.firstName[0]}{person.lastName[0]}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0d191b] dark:text-white truncate">
                  {person.firstName} {person.lastName}
                </p>
                {person.dateOfBirth && (
                  <p className="text-xs text-[#4c8d9a]">
                    Born {new Date(person.dateOfBirth).getFullYear()}
                  </p>
                )}
              </div>

              {/* Chevron */}
              <MaterialSymbol icon="chevron_right" className="text-[#4c8d9a]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
