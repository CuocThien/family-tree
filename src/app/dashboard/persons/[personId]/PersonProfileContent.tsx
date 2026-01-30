'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PersonProfileHeader } from '@/components/person/PersonProfileHeader';
import { PersonProfileTabs } from '@/components/person/PersonProfileTabs';
import { PersonOverviewTab } from '@/components/person/PersonOverviewTab';
import { PersonProfileSkeleton } from '@/components/person/PersonProfileSkeleton';
import { personKeys } from '@/hooks/usePerson';

interface PersonProfileContentProps {
  personId: string;
}

export function PersonProfileContent({ personId }: PersonProfileContentProps) {
  const router = useRouter();

  const { data: person, isLoading, error } = useQuery({
    queryKey: personKeys.detail(personId),
    queryFn: async () => {
      const response = await fetch(`/api/persons/${personId}`);
      if (!response.ok) throw new Error('Failed to fetch person');
      const { data } = await response.json();
      return data;
    },
  });

  if (isLoading) {
    return <PersonProfileSkeleton />;
  }

  if (error || !person) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Error loading person</p>
          <p className="text-sm text-[#4c8d9a]">{(error as Error)?.message || 'Person not found'}</p>
        </div>
      </div>
    );
  }

  const lifeStatus = person.dateOfDeath
    ? `${person.dateOfBirth ? `${new Date(person.dateOfBirth).getFullYear()} — ` : ''}${new Date(person.dateOfDeath).getFullYear()}`
    : `${person.dateOfBirth ? `${new Date(person.dateOfBirth).getFullYear()} — Present` : 'Present'}`;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Navigation */}
      <nav className="flex items-center gap-2 py-2 px-4 md:px-8 border-b border-[#e7f1f3] dark:border-gray-800">
        <a href="/dashboard" className="text-primary text-sm font-medium hover:underline">
          Dashboard
        </a>
        <span className="text-[#4c8d9a] text-sm font-medium">/</span>
        <a href="/dashboard/trees" className="text-primary text-sm font-medium hover:underline">
          Family Trees
        </a>
        <span className="text-[#4c8d9a] text-sm font-medium">/</span>
        <span className="text-[#0d191b] dark:text-gray-400 text-sm font-medium">
          {person.firstName} {person.lastName}
        </span>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {/* Profile Header */}
        <PersonProfileHeader
          person={person}
          lifeStatus={lifeStatus}
          onEdit={() => router.push(`/dashboard/persons/${personId}/edit`)}
        />

        {/* Tabs */}
        <PersonProfileTabs
          personId={personId}
          activeTab="overview"
        />

        {/* Tab Content */}
        <div className="mt-8">
          <PersonOverviewTab person={person} />
        </div>
      </main>
    </div>
  );
}
