import { IPerson } from '@/types/person';
import { Card } from '@/components/ui';
import { MapPin, Home } from 'lucide-react';

interface LocationsSectionProps {
  person: IPerson;
}

export function LocationsSection({ person }: LocationsSectionProps) {
  const locations: { type: string; location: string; icon?: React.ReactNode }[] = [];

  // Birth Place
  const birthPlace = person.customAttributes?.get('birthPlace');
  if (typeof birthPlace === 'string') {
    locations.push({
      type: 'Birth Place',
      location: birthPlace,
      icon: <MapPin size={16} />,
    });
  }

  // Death Place
  const deathPlace = person.customAttributes?.get('deathPlace');
  if (typeof deathPlace === 'string') {
    locations.push({
      type: 'Death Place',
      location: deathPlace,
      icon: <MapPin size={16} />,
    });
  }

  // Primary Residence (from customAttributes)
  const primaryResidence = person.customAttributes?.get('primaryResidence');
  if (typeof primaryResidence === 'string') {
    locations.push({
      type: 'Primary Residence',
      location: primaryResidence,
      icon: <Home size={16} />,
    });
  }

  // Migration History (from customAttributes)
  const migrationHistory = person.customAttributes?.get('migrationHistory');
  if (typeof migrationHistory === 'string') {
    locations.push({
      type: 'Migration',
      location: migrationHistory,
      icon: <MapPin size={16} />,
    });
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-[#0d191b] dark:text-white text-xl font-bold font-serif mb-4">
        Locations
      </h3>
      <Card>
        <div className="relative p-4 bg-[#f8fbfc] dark:bg-gray-800 rounded-lg overflow-hidden">
          {/* Map placeholder background */}
          <div className="absolute inset-0 opacity-10 flex items-center justify-center">
            <svg
              className="w-full h-full text-[#4c8d9a]"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" />
              <path d="M10 50 Q 30 30, 50 50 T 90 50" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M50 10 Q 70 30, 50 50 T 50 90" stroke="currentColor" strokeWidth="0.5" fill="none" />
            </svg>
          </div>

          {/* Location markers */}
          <div className="relative space-y-3">
            {locations.map((loc, index) => (
              <div key={loc.type} className="flex items-start gap-3">
                <div className="text-[#13c8ec] mt-0.5">{loc.icon}</div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-[#4c8d9a] font-semibold mb-0.5">
                    {loc.type}
                  </p>
                  <p className="text-sm text-[#0d191b] dark:text-gray-200">{loc.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View on map button placeholder */}
        <div className="mt-4 pt-4 border-t border-[#e7f1f3] dark:border-gray-700">
          <button className="w-full text-center text-sm text-[#13c8ec] hover:text-[#13c8ec]/80 font-semibold py-2">
            View on Map
          </button>
        </div>
      </Card>
    </section>
  );
}
