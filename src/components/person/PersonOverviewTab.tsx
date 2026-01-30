'use client';

import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import type { IPerson } from '@/types/person';

interface PersonOverviewTabProps {
  person: IPerson;
}

export function PersonOverviewTab({ person }: PersonOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Biography & Life Story */}
      <div className="lg:col-span-2 space-y-8">
        {/* Biography */}
        <section>
          <h2 className="text-[#0d191b] dark:text-white text-2xl font-bold mb-4">
            Biography
          </h2>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-[#e7f1f3] dark:border-gray-800 leading-relaxed text-[#4c8d9a] dark:text-gray-300">
            {person.biography ? (
              <p className="whitespace-pre-wrap">{person.biography}</p>
            ) : (
              <p className="italic text-[#4c8d9a]">No biography added yet.</p>
            )}
          </div>
        </section>

        {/* Life Events Timeline */}
        <section>
          <h2 className="text-[#0d191b] dark:text-white text-2xl font-bold mb-4">
            Life Events
          </h2>
          <div className="space-y-4">
            {/* Birth */}
            {person.dateOfBirth && (
              <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-[#e7f1f3] dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <MaterialSymbol icon="child_care" />
                  </div>
                  <div className="w-0.5 h-full bg-[#e7f1f3] dark:bg-gray-800 mt-2" />
                </div>
                <div className="pb-2">
                  <p className="text-sm font-bold text-[#0d191b] dark:text-white">Birth</p>
                  <p className="text-xs text-primary font-bold">
                    {new Date(person.dateOfBirth).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {person.birthPlace && (
                    <p className="text-sm text-[#4c8d9a] mt-1">{person.birthPlace}</p>
                  )}
                </div>
              </div>
            )}

            {/* Death */}
            {person.dateOfDeath && (
              <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-[#e7f1f3] dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <MaterialSymbol icon="deceased" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0d191b] dark:text-white">Death</p>
                  <p className="text-xs text-primary font-bold">
                    {new Date(person.dateOfDeath).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {person.deathPlace && (
                    <p className="text-sm text-[#4c8d9a] mt-1">{person.deathPlace}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Column: Key Facts */}
      <div className="space-y-8">
        {/* Key Facts */}
        <section>
          <h2 className="text-[#0d191b] dark:text-white text-xl font-bold mb-4">
            Key Facts
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#e7f1f3] dark:border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[#e7f1f3] dark:border-gray-800">
                  <td className="p-4 text-[#4c8d9a] font-medium">Gender</td>
                  <td className="p-4 text-[#0d191b] dark:text-gray-200 font-bold capitalize">
                    {person.gender || 'Unknown'}
                  </td>
                </tr>
                {person.occupation && (
                  <tr className="border-b border-[#e7f1f3] dark:border-gray-800">
                    <td className="p-4 text-[#4c8d9a] font-medium">Occupation</td>
                    <td className="p-4 text-[#0d191b] dark:text-gray-200 font-bold">
                      {person.occupation}
                    </td>
                  </tr>
                )}
                {person.nationality && (
                  <tr>
                    <td className="p-4 text-[#4c8d9a] font-medium">Nationality</td>
                    <td className="p-4 text-[#0d191b] dark:text-gray-200 font-bold">
                      {person.nationality}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
