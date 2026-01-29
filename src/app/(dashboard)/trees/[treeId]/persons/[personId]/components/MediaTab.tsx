import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Image as ImageIcon, FileText, Camera, Upload } from 'lucide-react';
import { useState } from 'react';

interface MediaTabProps {
  media: string[];
  documents: string[];
  isLoading?: boolean;
  onAddMedia: () => void;
}

export function MediaTab({ media, documents, isLoading, onAddMedia }: MediaTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'photo' | 'document'>('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin size-8 border-4 border-[#13c8ec] border-t-transparent rounded-full" />
      </div>
    );
  }

  const allItems = [
    ...media.map((url) => ({ type: 'photo' as const, url })),
    ...documents.map((url) => ({ type: 'document' as const, url })),
  ];

  const filteredItems =
    selectedFilter === 'all'
      ? allItems
      : allItems.filter((item) => item.type === selectedFilter);

  if (allItems.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Camera size={48} className="mx-auto text-[#4c8d9a] mb-4" />
          <h3 className="text-lg font-semibold text-[#0d191b] dark:text-white mb-2">
            No Media Yet
          </h3>
          <p className="text-[#4c8d9a] text-sm max-w-md mx-auto mb-6">
            Add photos and documents to preserve memories and tell this person's story.
          </p>
          <Button leftIcon={<Upload size={16} />} onClick={onAddMedia}>
            Add Media
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#4c8d9a]">
            {allItems.length} {allItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex gap-2">
          <FilterButton
            active={selectedFilter === 'all'}
            onClick={() => setSelectedFilter('all')}
            label={`All (${allItems.length})`}
          />
          <FilterButton
            active={selectedFilter === 'photo'}
            onClick={() => setSelectedFilter('photo')}
            label={`Photos (${media.length})`}
          />
          <FilterButton
            active={selectedFilter === 'document'}
            onClick={() => setSelectedFilter('document')}
            label={`Documents (${documents.length})`}
          />
        </div>

        <Button leftIcon={<Upload size={16} />} onClick={onAddMedia}>
          Add Media
        </Button>
      </div>

      {/* Media Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <p className="text-[#4c8d9a] text-center py-8">
            No {selectedFilter === 'photo' ? 'photos' : 'documents'} found.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <MediaCard key={`${item.type}-${index}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function FilterButton({ active, onClick, label }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active
          ? 'bg-[#13c8ec] text-white'
          : 'bg-[#e7f1f3] dark:bg-white/10 text-[#4c8d9a] hover:bg-[#d0e5e9]'
      }`}
    >
      {label}
    </button>
  );
}

interface MediaCardProps {
  item: {
    type: 'photo' | 'document';
    url: string;
  };
}

function MediaCard({ item }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card hover padding="none" className="overflow-hidden group">
      <div className="aspect-square relative bg-[#f8fbfc] dark:bg-gray-800">
        {item.type === 'photo' && !imageError ? (
          <img
            src={item.url}
            alt="Media"
            className="size-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="size-full flex items-center justify-center">
            {item.type === 'photo' ? (
              <ImageIcon size={32} className="text-[#4c8d9a]" />
            ) : (
              <FileText size={32} className="text-[#4c8d9a]" />
            )}
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="px-4 py-2 bg-white text-[#0d191b] rounded-lg text-sm font-semibold hover:bg-gray-100">
            View
          </button>
        </div>
      </div>
    </Card>
  );
}
