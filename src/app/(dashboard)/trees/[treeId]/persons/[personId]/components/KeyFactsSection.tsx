import { IPerson, Gender } from '@/types/person';
import { Card } from '@/components/ui';
import { User, Calendar, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface KeyFactsSectionProps {
  person: IPerson;
}

export function KeyFactsSection({ person }: KeyFactsSectionProps) {
  const facts: { label: string; value: string; icon?: React.ReactNode }[] = [];

  // Gender
  if (person.gender) {
    facts.push({
      label: 'Gender',
      value: formatGender(person.gender),
      icon: <User size={16} />,
    });
  }

  // Birth Date
  if (person.dateOfBirth) {
    facts.push({
      label: 'Birth Date',
      value: formatDate(new Date(person.dateOfBirth)),
      icon: <Calendar size={16} />,
    });
  }

  // Death Date
  if (person.dateOfDeath) {
    facts.push({
      label: 'Death Date',
      value: formatDate(new Date(person.dateOfDeath)),
      icon: <Calendar size={16} />,
    });
  }

  // Birth Place (from customAttributes)
  const birthPlace = person.customAttributes?.get('birthPlace');
  if (typeof birthPlace === 'string') {
    facts.push({
      label: 'Birth Place',
      value: birthPlace,
      icon: <MapPin size={16} />,
    });
  }

  // Death Place (from customAttributes)
  const deathPlace = person.customAttributes?.get('deathPlace');
  if (typeof deathPlace === 'string') {
    facts.push({
      label: 'Death Place',
      value: deathPlace,
      icon: <MapPin size={16} />,
    });
  }

  // Occupation (from customAttributes)
  const occupation = person.customAttributes?.get('occupation');
  if (typeof occupation === 'string') {
    facts.push({
      label: 'Occupation',
      value: occupation,
    });
  }

  // Nationality (from customAttributes)
  const nationality = person.customAttributes?.get('nationality');
  if (typeof nationality === 'string') {
    facts.push({
      label: 'Nationality',
      value: nationality,
    });
  }

  if (facts.length === 0) {
    return (
      <section>
        <h3 className="text-[#0d191b] dark:text-white text-xl font-bold font-serif mb-4">
          Key Facts
        </h3>
        <Card>
          <p className="text-[#4c8d9a] text-center py-6 text-sm">
            No additional information recorded.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-[#0d191b] dark:text-white text-xl font-bold font-serif mb-4">
        Key Facts
      </h3>
      <Card className="divide-y divide-[#e7f1f3] dark:divide-gray-700">
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-start gap-3 py-3 px-4">
            {fact.icon && (
              <div className="text-[#13c8ec] mt-0.5">{fact.icon}</div>
            )}
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-[#4c8d9a] font-semibold mb-0.5">
                {fact.label}
              </p>
              <p className="text-sm text-[#0d191b] dark:text-gray-200">{fact.value}</p>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}

function formatGender(gender: Gender): string {
  const genderLabels: Record<Gender, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    unknown: 'Unknown',
  };
  return genderLabels[gender] || 'Unknown';
}
