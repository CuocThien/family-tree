import { IPerson } from '@/types/person';
import { Card } from '@/components/ui';
import { Baby, Heart, Cross, Briefcase, GraduationCap, Home } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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

  if (person.dateOfBirth) {
    events.push({
      id: 'birth',
      type: 'birth',
      title: 'Birth',
      date: person.dateOfBirth,
      location: undefined,
    });
  }

  // Add life events from person.customAttributes if any exist
  if (person.customAttributes) {
    const lifeEvents = person.customAttributes.get('lifeEvents');
    if (lifeEvents && Array.isArray(lifeEvents)) {
      events.push(
        ...(lifeEvents as TimelineEvent[]).map((e, i) => ({
          id: `event-${i}`,
          ...e,
        }))
      );
    }
  }

  if (person.dateOfDeath) {
    events.push({
      id: 'death',
      type: 'death',
      title: 'Death',
      date: person.dateOfDeath,
      location: undefined,
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
        <div className="size-10 rounded-full bg-[#13c8ec]/20 text-[#13c8ec] flex items-center justify-center">
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
          <p className="text-xs text-[#13c8ec] font-bold">
            {formatDate(new Date(event.date))}
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
