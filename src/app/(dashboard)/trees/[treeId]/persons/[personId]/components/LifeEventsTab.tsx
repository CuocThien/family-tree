import { IPerson } from '@/types/person';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { TimelineSection } from './TimelineSection';
import { Calendar, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface LifeEventsTabProps {
  person: IPerson;
}

export function LifeEventsTab({ person }: LifeEventsTabProps) {
  // Build a list of all life events
  const events: {
    id: string;
    type: string;
    title: string;
    date?: Date | string;
    location?: string;
    description?: string;
  }[] = [];

  // Birth
  if (person.dateOfBirth) {
    events.push({
      id: 'birth',
      type: 'birth',
      title: 'Birth',
      date: person.dateOfBirth,
      location: person.customAttributes?.get('birthPlace') as string | undefined,
    });
  }

  // Custom life events from customAttributes
  const lifeEvents = person.customAttributes?.get('lifeEvents');
  if (lifeEvents && Array.isArray(lifeEvents)) {
    events.push(
      ...(lifeEvents as any[]).map((event, i) => ({
        id: `custom-${i}`,
        type: event.type || 'custom',
        title: event.title || 'Event',
        date: event.date,
        location: event.location,
        description: event.description,
      }))
    );
  }

  // Death
  if (person.dateOfDeath) {
    events.push({
      id: 'death',
      type: 'death',
      title: 'Death',
      date: person.dateOfDeath,
      location: person.customAttributes?.get('deathPlace') as string | undefined,
    });
  }

  // Sort by date
  events.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const hasEvents = events.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[#0d191b] dark:text-white text-xl font-bold font-serif">
            Life Events
          </h2>
          <p className="text-sm text-[#4c8d9a] mt-1">
            {hasEvents
              ? `${events.length} event${events.length === 1 ? '' : 's'} recorded`
              : 'No events recorded yet'}
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />}>
          Add Event
        </Button>
      </div>

      {!hasEvents ? (
        <Card>
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-[#4c8d9a] mb-4" />
            <h3 className="text-lg font-semibold text-[#0d191b] dark:text-white mb-2">
              No Life Events Yet
            </h3>
            <p className="text-[#4c8d9a] text-sm max-w-md mx-auto mb-6">
              Document important milestones and events to tell this person's life story.
            </p>
            <Button leftIcon={<Plus size={16} />}>Add First Event</Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Timeline */}
          <TimelineSection person={person} />

          {/* Events Table */}
          <div className="mt-8">
            <h3 className="text-[#0d191b] dark:text-white text-lg font-bold font-serif mb-4">
              All Events
            </h3>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8fbfc] dark:bg-gray-800 border-b border-[#e7f1f3] dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#4c8d9a] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#4c8d9a] uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#4c8d9a] uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#4c8d9a] uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#4c8d9a] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7f1f3] dark:divide-gray-700">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-[#f8fbfc] dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-sm text-[#0d191b] dark:text-gray-200">
                          {event.date ? formatDate(new Date(event.date)) : 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[#0d191b] dark:text-white">
                          {event.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4c8d9a]">
                          {event.location || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4c8d9a] max-w-xs truncate">
                          {event.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-[#13c8ec] hover:text-[#13c8ec]/80 text-sm font-semibold">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
