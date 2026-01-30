import { IPerson } from '@/types/person';
import { Card } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Spinner } from '@/components/ui';
import { Users, Heart, Baby, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FamilyMembers {
  parents: IPerson[];
  children: IPerson[];
  spouses: IPerson[];
  siblings: IPerson[];
}

interface RelationshipsTabProps {
  person: IPerson;
  family?: FamilyMembers | null;
  isLoading?: boolean;
}

export function RelationshipsTab({ person, family, isLoading }: RelationshipsTabProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!family) {
    return (
      <Card>
        <p className="text-[#4c8d9a] text-center py-8">
          No family information available.
        </p>
      </Card>
    );
  }

  const totalRelationships =
    family.parents.length + family.children.length + family.spouses.length + family.siblings.length;

  if (totalRelationships === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-[#4c8d9a] mb-4" />
          <h3 className="text-lg font-semibold text-[#0d191b] dark:text-white mb-2">
            No Relationships Yet
          </h3>
          <p className="text-[#4c8d9a] text-sm max-w-md mx-auto">
            Start building the family tree by adding parents, spouses, children, or siblings.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Parents */}
      {family.parents.length > 0 && (
        <RelationshipSection
          title="Parents"
          icon={<Users size={20} />}
          persons={family.parents}
          relationType="parent"
          onPersonClick={(p) => router.push(`/trees/${person.treeId}/persons/${p._id}`)}
        />
      )}

      {/* Spouses */}
      {family.spouses.length > 0 && (
        <RelationshipSection
          title="Spouses"
          icon={<Heart size={20} />}
          persons={family.spouses}
          relationType="spouse"
          onPersonClick={(p) => router.push(`/trees/${person.treeId}/persons/${p._id}`)}
        />
      )}

      {/* Children */}
      {family.children.length > 0 && (
        <RelationshipSection
          title="Children"
          icon={<Baby size={20} />}
          persons={family.children}
          relationType="child"
          onPersonClick={(p) => router.push(`/trees/${person.treeId}/persons/${p._id}`)}
        />
      )}

      {/* Siblings */}
      {family.siblings.length > 0 && (
        <RelationshipSection
          title="Siblings"
          icon={<ArrowRight size={20} />}
          persons={family.siblings}
          relationType="sibling"
          onPersonClick={(p) => router.push(`/trees/${person.treeId}/persons/${p._id}`)}
        />
      )}
    </div>
  );
}

interface RelationshipSectionProps {
  title: string;
  icon: React.ReactNode;
  persons: IPerson[];
  relationType: string;
  onPersonClick: (person: IPerson) => void;
}

function RelationshipSection({
  title,
  icon,
  persons,
  relationType,
  onPersonClick,
}: RelationshipSectionProps) {
  return (
    <section>
      <h2 className="text-[#0d191b] dark:text-white text-xl font-bold font-serif mb-4 flex items-center gap-2">
        <span className="text-[#13c8ec]">{icon}</span>
        {title} <span className="text-sm text-[#4c8d9a] font-normal">({persons.length})</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {persons.map((person) => (
          <PersonCard
            key={person._id}
            person={person}
            relationType={relationType}
            onClick={() => onPersonClick(person)}
          />
        ))}
      </div>
    </section>
  );
}

interface PersonCardProps {
  person: IPerson;
  relationType: string;
  onClick: () => void;
}

function PersonCard({ person, relationType, onClick }: PersonCardProps) {
  const fullName = `${person.firstName} ${person.middleName || ''} ${person.lastName}`.trim();
  const profilePhoto = person.photos?.[0];

  return (
    <Card
      hover
      className="p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <Avatar
          src={profilePhoto}
          alt={fullName}
          fullName={fullName}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#0d191b] dark:text-white truncate">
            {fullName}
          </p>
          <p className="text-sm text-[#4c8d9a] capitalize">{relationType}</p>
          {person.dateOfBirth && (
            <p className="text-xs text-[#4c8d9a]">
              {new Date(person.dateOfBirth).getFullYear()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
