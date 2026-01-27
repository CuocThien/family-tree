# Task 22: Create Person Profile Page

**Phase:** 12 - Pages
**Priority:** High
**Dependencies:** Task 16 (UI), Task 18 (Hooks)
**Estimated Complexity:** High

---

## Objective

Implement the Person Profile page based on `design/person-profile.html`. This page displays detailed information about a family member including biography, timeline, relationships, and media.

---

## Design Analysis

### Layout Structure

```
┌────────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                       │
├────────────────────────────────────────────────────────────┤
│  Breadcrumbs: Main Tree > Smith Family > William Smith     │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │               Profile Header                          │  │
│  │  [Photo]  Name                    [Edit] [Add Media] │  │
│  │           1892 — 1954                                │  │
│  │           Born: London • Died: New York              │  │
│  │  [12 Relationships] [8 Documents] [2nd Cousin DNA]   │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│  [Overview] [Relationships] [Media] [Life Events]         │
├─────────────────────────────────────┬──────────────────────┤
│       Left Column (2/3)             │  Right Column (1/3)  │
│  ┌───────────────────────────────┐  │  ┌────────────────┐  │
│  │        Biography              │  │  │  Key Facts     │  │
│  │  Lorem ipsum dolor sit amet...│  │  │  Gender: Male  │  │
│  └───────────────────────────────┘  │  │  Nationality   │  │
│  ┌───────────────────────────────┐  │  │  Occupation    │  │
│  │    Life Events Timeline       │  │  └────────────────┘  │
│  │  ○ Birth - 14 May 1892       │  │  ┌────────────────┐  │
│  │  │                           │  │  │   Locations    │  │
│  │  ○ Marriage - 02 June 1925   │  │  │  [Map Preview] │  │
│  │  │                           │  │  │  Primary Res   │  │
│  │  ○ Death - 11 Nov 1954       │  │  │  Migration     │  │
│  └───────────────────────────────┘  │  └────────────────┘  │
│                                     │  ┌────────────────┐  │
│                                     │  │ DNA Matches    │  │
│                                     │  │ 2 potential    │  │
│                                     │  └────────────────┘  │
└─────────────────────────────────────┴──────────────────────┘
```

### Key Features from Design

1. **Profile Header**
   - Large profile photo with edit button
   - Name with heritage font (Source Serif 4)
   - Lifespan dates in primary color
   - Location info with icon
   - Quick stats badges

2. **Tabbed Navigation**
   - Overview (default)
   - Relationships
   - Media gallery
   - Life Events

3. **Content Sections**
   - Biography with rich text
   - Timeline with icons
   - Key facts table
   - Location map placeholder
   - DNA match banner

---

## Implementation Specification

### Page Component

**File:** `src/app/(dashboard)/trees/[treeId]/persons/[personId]/page.tsx`

```typescript
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { container } from '@/lib/di/container';
import { PersonProfileContent } from './PersonProfileContent';
import { PersonProfileSkeleton } from './PersonProfileSkeleton';

interface PageProps {
  params: {
    treeId: string;
    personId: string;
  };
}

export async function generateMetadata({ params }: PageProps) {
  const person = await container.personService.getPersonById(params.personId, 'system');

  if (!person) {
    return { title: 'Person Not Found' };
  }

  return {
    title: `${person.firstName} ${person.lastName} | AncestryTree`,
    description: person.biography?.slice(0, 160) || `Profile of ${person.firstName} ${person.lastName}`,
  };
}

export default async function PersonProfilePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const [person, tree] = await Promise.all([
    container.personService.getPersonById(params.personId, session.user.id),
    container.treeService.getTreeById(params.treeId, session.user.id),
  ]);

  if (!person || !tree) {
    notFound();
  }

  return (
    <Suspense fallback={<PersonProfileSkeleton />}>
      <PersonProfileContent
        person={person}
        tree={tree}
        userId={session.user.id}
      />
    </Suspense>
  );
}
```

### Profile Content Component

**File:** `src/app/(dashboard)/trees/[treeId]/persons/[personId]/PersonProfileContent.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IPerson } from '@/types/person';
import { ITree } from '@/types/tree';
import { useFamily, usePersonMedia } from '@/hooks';
import { useUIStore } from '@/store/uiStore';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileTabs } from './components/ProfileTabs';
import { OverviewTab } from './components/OverviewTab';
import { RelationshipsTab } from './components/RelationshipsTab';
import { MediaTab } from './components/MediaTab';
import { LifeEventsTab } from './components/LifeEventsTab';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

type TabId = 'overview' | 'relationships' | 'media' | 'life-events';

interface PersonProfileContentProps {
  person: IPerson;
  tree: ITree;
  userId: string;
}

export function PersonProfileContent({ person, tree, userId }: PersonProfileContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { openModal } = useUIStore();

  const { data: family, isLoading: familyLoading } = useFamily(person._id);
  const { data: media, isLoading: mediaLoading } = usePersonMedia(person._id);

  const breadcrumbItems = [
    { label: 'Trees', href: '/trees' },
    { label: tree.name, href: `/trees/${tree._id}` },
    { label: `${person.firstName} ${person.lastName}` },
  ];

  const handleEditProfile = () => {
    openModal('editPerson', { person });
  };

  const handleAddMedia = () => {
    openModal('addMedia', { personId: person._id, treeId: tree._id });
  };

  const stats = {
    relationships: family
      ? family.parents.length + family.children.length + family.spouses.length + family.siblings.length
      : 0,
    documents: media?.filter((m) => m.type === 'document').length || 0,
    photos: media?.filter((m) => m.type === 'photo').length || 0,
  };

  return (
    <main className="flex-1 py-5 md:py-10">
      <div className="max-w-[1024px] mx-auto px-4 md:px-0">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-4" />

        {/* Profile Header */}
        <ProfileHeader
          person={person}
          stats={stats}
          onEdit={handleEditProfile}
          onAddMedia={handleAddMedia}
        />

        {/* Tabs Navigation */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'overview' && (
            <OverviewTab person={person} family={family} />
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
              media={media || []}
              isLoading={mediaLoading}
              onAddMedia={handleAddMedia}
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
```

### Profile Header Component

**File:** `src/app/(dashboard)/trees/[treeId]/persons/[personId]/components/ProfileHeader.tsx`

```typescript
import { IPerson } from '@/types/person';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Edit, Camera, MapPin, Users, FileText, Dna } from 'lucide-react';
import { formatLifespan } from '@/lib/utils/date';

interface ProfileHeaderProps {
  person: IPerson;
  stats: {
    relationships: number;
    documents: number;
    photos: number;
  };
  onEdit: () => void;
  onAddMedia: () => void;
}

export function ProfileHeader({ person, stats, onEdit, onAddMedia }: ProfileHeaderProps) {
  const fullName = `${person.firstName} ${person.middleName || ''} ${person.lastName}`.trim();
  const lifespan = formatLifespan(person.birthDate, person.deathDate);
  const locationParts = [];

  if (person.birthPlace) {
    locationParts.push(`Born: ${person.birthPlace}`);
  }
  if (person.deathPlace) {
    locationParts.push(`Died: ${person.deathPlace}`);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-[#e7f1f3] dark:border-gray-800 p-6 md:p-8 mb-6">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Profile Photo */}
        <div className="relative group">
          <Avatar
            src={person.profilePhoto}
            alt={fullName}
            size="xl"
            className="size-32 md:size-48 shadow-lg ring-4 ring-white dark:ring-gray-800"
          />
          <button
            onClick={onAddMedia}
            className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-md hover:scale-105 transition-transform"
            aria-label="Change profile photo"
          >
            <Camera size={16} />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-[#0d191b] dark:text-white text-3xl md:text-4xl font-bold leading-tight font-serif">
                {fullName}
              </h1>
              {lifespan && (
                <p className="text-primary text-lg font-semibold mt-1">{lifespan}</p>
              )}
              {locationParts.length > 0 && (
                <p className="text-[#4c8d9a] text-base mt-1 flex items-center justify-center md:justify-start gap-1">
                  <MapPin size={16} />
                  {locationParts.join(' • ')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" leftIcon={<Edit size={16} />} onClick={onEdit}>
                Edit Profile
              </Button>
              <Button leftIcon={<Camera size={16} />} onClick={onAddMedia}>
                Add Media
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
            <StatBadge
              icon={<Users size={14} />}
              label="Relationships"
              value={`${stats.relationships} Connected`}
            />
            <StatBadge
              icon={<FileText size={14} />}
              label="Records"
              value={`${stats.documents} Documents`}
            />
            {person.dnaMatch && (
              <StatBadge
                icon={<Dna size={14} />}
                label="DNA Match"
                value={person.dnaMatch}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-background-light dark:bg-gray-800 px-4 py-2 rounded-lg border border-[#e7f1f3] dark:border-gray-700">
      <p className="text-[10px] uppercase tracking-wider text-[#4c8d9a] font-bold flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold dark:text-gray-200">{value}</p>
    </div>
  );
}
```

### Overview Tab Component

**File:** `src/app/(dashboard)/trees/[treeId]/persons/[personId]/components/OverviewTab.tsx`

```typescript
import { IPerson } from '@/types/person';
import { FamilyMembers } from '@/types/relationship';
import { BiographySection } from './BiographySection';
import { TimelineSection } from './TimelineSection';
import { KeyFactsSection } from './KeyFactsSection';
import { LocationsSection } from './LocationsSection';
import { DNAMatchBanner } from './DNAMatchBanner';

interface OverviewTabProps {
  person: IPerson;
  family?: FamilyMembers | null;
}

export function OverviewTab({ person, family }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-8">
        <BiographySection biography={person.biography} />
        <TimelineSection person={person} />
      </div>

      {/* Right Column */}
      <div className="space-y-8">
        <KeyFactsSection person={person} />
        <LocationsSection person={person} />
        {person.hasDnaMatch && <DNAMatchBanner matchCount={2} />}
      </div>
    </div>
  );
}
```

### Timeline Section Component

**File:** `src/app/(dashboard)/trees/[treeId]/persons/[personId]/components/TimelineSection.tsx`

```typescript
import { IPerson } from '@/types/person';
import { Card } from '@/components/ui/Card';
import { Baby, Heart, Cross, Briefcase, GraduationCap, Home } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

interface TimelineEvent {
  id: string;
  type: 'birth' | 'marriage' | 'death' | 'occupation' | 'education' | 'residence';
  title: string;
  date?: Date | string;
  location?: string;
  description?: string;
}

const eventIcons = {
  birth: Baby,
  marriage: Heart,
  death: Cross,
  occupation: Briefcase,
  education: GraduationCap,
  residence: Home,
};

interface TimelineSectionProps {
  person: IPerson;
}

export function TimelineSection({ person }: TimelineSectionProps) {
  // Build timeline from person data
  const events: TimelineEvent[] = [];

  if (person.birthDate) {
    events.push({
      id: 'birth',
      type: 'birth',
      title: 'Birth',
      date: person.birthDate,
      location: person.birthPlace,
    });
  }

  // Add life events from person.lifeEvents if available
  if (person.lifeEvents) {
    events.push(...person.lifeEvents.map((e, i) => ({
      id: `event-${i}`,
      ...e,
    })));
  }

  if (person.deathDate) {
    events.push({
      id: 'death',
      type: 'death',
      title: 'Death',
      date: person.deathDate,
      location: person.deathPlace,
    });
  }

  // Sort by date
  events.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  if (events.length === 0) {
    return (
      <section>
        <h2 className="text-[#0d191b] dark:text-white text-2xl font-bold font-serif mb-4">
          Life Events Timeline
        </h2>
        <Card>
          <p className="text-[#4c8d9a] text-center py-8">
            No life events recorded yet.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-[#0d191b] dark:text-white text-2xl font-bold font-serif mb-4">
        Life Events Timeline
      </h2>
      <div className="space-y-4">
        {events.map((event, index) => (
          <TimelineEventCard
            key={event.id}
            event={event}
            isLast={index === events.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function TimelineEventCard({
  event,
  isLast,
}: {
  event: TimelineEvent;
  isLast: boolean;
}) {
  const Icon = eventIcons[event.type] || Baby;

  return (
    <Card className="flex gap-4 p-4">
      <div className="flex flex-col items-center">
        <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
          <Icon size={20} />
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-[#e7f1f3] dark:bg-gray-800 mt-2" />
        )}
      </div>
      <div className="pb-2">
        <p className="text-sm font-bold text-[#0d191b] dark:text-white">
          {event.title}
        </p>
        {event.date && (
          <p className="text-xs text-primary font-bold">
            {formatDate(event.date)}
          </p>
        )}
        {event.location && (
          <p className="text-sm text-[#4c8d9a] mt-1">{event.location}</p>
        )}
        {event.description && (
          <p className="text-sm text-[#4c8d9a] mt-2">{event.description}</p>
        )}
      </div>
    </Card>
  );
}
```

---

## UX Improvements Over Design

| Original Design | Improvement | Rationale |
|-----------------|-------------|-----------|
| Static photo | Photo with lightbox | Better viewing |
| No empty states | Placeholder content | Guide users |
| Basic timeline | Interactive with details | More engaging |
| No edit inline | Quick edit buttons | Faster workflow |
| Fixed tabs | Sticky tabs on scroll | Better navigation |
| No loading states | Skeleton loaders | Perceived performance |

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| No profile photo | Show default avatar based on gender |
| No biography | Show "Add biography" placeholder |
| No life events | Show "Add first event" CTA |
| Missing birth date | Don't show lifespan |
| Living person | Hide sensitive info based on privacy |
| Long biography | Truncate with "Read more" |
| Many relationships | Paginate or show summary |
| No media | Show upload prompt |
| Deceased indicator | Visual indicator (muted colors) |

---

## Acceptance Criteria

- [ ] Profile header displays correctly
- [ ] Tabs navigation working
- [ ] Overview tab with biography and timeline
- [ ] Relationships tab shows family members
- [ ] Media tab shows photos/documents
- [ ] Life events tab with timeline
- [ ] Edit functionality working
- [ ] Add media functionality
- [ ] Breadcrumbs navigation
- [ ] Mobile responsive layout
- [ ] Dark mode support
- [ ] Loading skeletons
- [ ] Empty states handled
