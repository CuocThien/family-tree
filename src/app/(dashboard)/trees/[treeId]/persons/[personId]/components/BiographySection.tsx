import { Card } from '@/components/ui';

interface BiographySectionProps {
  biography?: string | null;
}

export function BiographySection({ biography }: BiographySectionProps) {
  if (!biography) {
    return (
      <section>
        <h2 className="text-[#0d191b] dark:text-white text-2xl font-bold font-serif mb-4">
          Biography
        </h2>
        <Card>
          <p className="text-[#4c8d9a] text-center py-8">
            No biography has been added yet. Click &quot;Edit Profile&quot; to add information about this person.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-[#0d191b] dark:text-white text-2xl font-bold font-serif mb-4">
        Biography
      </h2>
      <Card>
        <p className="text-[#0d191b] dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
          {biography}
        </p>
      </Card>
    </section>
  );
}
