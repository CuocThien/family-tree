import { IPerson } from '@/types/person';
import { BiographySection } from './BiographySection';
import { TimelineSection } from './TimelineSection';
import { KeyFactsSection } from './KeyFactsSection';
import { LocationsSection } from './LocationsSection';
import { DNAMatchBanner } from './DNAMatchBanner';

interface FamilyMembers {
  parents: IPerson[];
  children: IPerson[];
  spouses: IPerson[];
  siblings: IPerson[];
}

interface OverviewTabProps {
  person: IPerson;
  family?: FamilyMembers | null;
  isLoading?: boolean;
}

export function OverviewTab({ person, family, isLoading }: OverviewTabProps) {
  // Check if person has DNA match from customAttributes
  const hasDnaMatch = person.customAttributes?.get('dnaMatch');
  const dnaMatchCount = typeof hasDnaMatch === 'number' ? hasDnaMatch : 0;

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
        {dnaMatchCount > 0 && <DNAMatchBanner matchCount={dnaMatchCount} />}
      </div>
    </div>
  );
}
