'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IPerson, ITree } from '@/types';
import { useFamily, usePerson, useTree } from '@/hooks';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileTabs } from './components/ProfileTabs';
import { OverviewTab } from './components/OverviewTab';
import { RelationshipsTab } from './components/RelationshipsTab';
import { MediaTab } from './components/MediaTab';
import { LifeEventsTab } from './components/LifeEventsTab';
import { Spinner } from '@/components/ui';

type TabId = 'overview' | 'relationships' | 'media' | 'life-events';

interface PersonProfileContentProps {
  treeId: string;
  personId: string;
  userId: string;
}

export function PersonProfileContent({ treeId, personId, userId }: PersonProfileContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: person, isLoading: personLoading, error: personError } = usePerson(personId);
  const { data: tree, isLoading: treeLoading } = useTree(treeId);
  const { data: family, isLoading: familyLoading } = useFamily(personId);

  if (personLoading || treeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (personError || !person || !tree) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-[#4c8d9a]">Person or tree not found.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-[#13c8ec] text-white rounded-lg hover:bg-[#13c8ec]/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Trees', href: '/trees' },
    { label: tree.name, href: `/trees/${treeId}` },
    { label: `${person.firstName} ${person.lastName}` },
  ];

  const stats = {
    relationships: family
      ? family.parents.length + family.children.length + family.spouses.length + family.siblings.length
      : 0,
    documents: person.documents?.length || 0,
    photos: person.photos?.length || 0,
  };

  return (
    <main className="flex-1 py-5 md:py-10">
      <div className="max-w-[1024px] mx-auto px-4 md:px-0">
        {/* Breadcrumbs */}
        <nav className="mb-4 flex items-center gap-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <span key={item.label} className="flex items-center gap-2">
              {index > 0 && <span className="text-[#4c8d9a]">/</span>}
              {item.href ? (
                <a
                  href={item.href}
                  className="text-[#4c8d9a] hover:text-[#13c8ec] transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-[#0d191b] dark:text-white font-medium">{item.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Profile Header */}
        <ProfileHeader
          person={person}
          stats={stats}
          onEdit={() => console.log('Edit profile')}
          onAddMedia={() => console.log('Add media')}
        />

        {/* Tabs Navigation */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'overview' && (
            <OverviewTab person={person} family={family} isLoading={familyLoading} />
          )}
          {activeTab === 'relationships' && (
            <RelationshipsTab
              person={person}
              family={family}
              isLoading={familyLoading}
            />
          )}
          {activeTab === 'media' && (
            <MediaTab
              media={person.photos || []}
              documents={person.documents || []}
              isLoading={false}
              onAddMedia={() => console.log('Add media')}
            />
          )}
          {activeTab === 'life-events' && (
            <LifeEventsTab person={person} />
          )}
        </div>
      </div>
    </main>
  );
}
