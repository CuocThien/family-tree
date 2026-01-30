'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import type { IPerson } from '@/types/person';

interface PersonProfileHeaderProps {
  person: IPerson;
  lifeStatus: string;
  onEdit: () => void;
}

export function PersonProfileHeader({ person, lifeStatus, onEdit }: PersonProfileHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-[#e7f1f3] dark:border-gray-800 p-6 md:p-8 mb-6">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Avatar */}
        <div className="relative group">
          <Avatar
            src={person.profilePhoto}
            alt={`${person.firstName} ${person.lastName}`}
            size="xl"
            fullName={`${person.firstName} ${person.lastName}`}
            className="ring-4 ring-white dark:ring-gray-800"
          />
          <button
            className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-md hover:scale-105 transition-transform"
            aria-label="Change photo"
          >
            <MaterialSymbol icon="photo_camera" className="text-sm" />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-[#0d191b] dark:text-white text-3xl md:text-4xl font-bold leading-tight">
                {person.firstName} {person.middleName && `${person.middleName} `}{person.lastName}
                {person.suffix && `, ${person.suffix}`}
              </h1>
              <p className="text-primary text-lg font-semibold mt-1">{lifeStatus}</p>
              {(person.birthPlace || (person.dateOfDeath && person.deathPlace)) && (
                <p className="text-[#4c8d9a] text-base mt-1 flex items-center justify-center md:justify-start gap-1">
                  <MaterialSymbol icon="location_on" className="text-lg" />
                  {person.birthPlace && `Born: ${person.birthPlace}`}
                  {person.birthPlace && person.deathPlace && ' • '}
                  {person.deathPlace && `Died: ${person.deathPlace}`}
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={onEdit} className="gap-2">
                <MaterialSymbol icon="edit" className="text-lg" />
                Edit Profile
              </Button>
              <Button variant="primary" className="gap-2">
                <MaterialSymbol icon="add_a_photo" className="text-lg" />
                Add Media
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="bg-background-light dark:bg-gray-800 px-4 py-2 rounded-lg border border-[#e7f1f3] dark:border-gray-700">
              <p className="text-[10px] uppercase tracking-wider text-[#4c8d9a] font-bold">Relationships</p>
              <p className="text-sm font-bold dark:text-gray-200">12 Connected</p>
            </div>
            <div className="bg-background-light dark:bg-gray-800 px-4 py-2 rounded-lg border border-[#e7f1f3] dark:border-gray-700">
              <p className="text-[10px] uppercase tracking-wider text-[#4c8d9a] font-bold">Records</p>
              <p className="text-sm font-bold dark:text-gray-200">8 Documents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
