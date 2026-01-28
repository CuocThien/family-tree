import { IPerson } from '@/types/person';
import { Button } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Edit, Camera, MapPin, Users, FileText } from 'lucide-react';
import { formatLifespan, formatDate } from '@/lib/utils';

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

  // Get primary photo or use avatar
  const profilePhoto = person.photos?.[0];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-[#e7f1f3] dark:border-gray-800 p-6 md:p-8 mb-6">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Profile Photo */}
        <div className="relative group">
          <Avatar
            src={profilePhoto}
            alt={fullName}
            fullName={fullName}
            size="2xl"
            className="size-32 md:size-48 shadow-lg ring-4 ring-white dark:ring-gray-800"
          />
          <button
            onClick={onAddMedia}
            className="absolute -bottom-2 -right-2 bg-[#13c8ec] text-white p-2 rounded-full shadow-md hover:scale-105 transition-transform"
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
              {person.dateOfBirth && (
                <p className="text-[#13c8ec] text-lg font-semibold mt-1">
                  {formatLifespan(person.dateOfBirth, person.dateOfDeath)}
                </p>
              )}
              <p className="text-[#4c8d9a] text-base mt-1 flex items-center justify-center md:justify-start gap-1">
                <MapPin size={16} />
                Born: {person.dateOfBirth ? formatDate(new Date(person.dateOfBirth)) : 'Unknown'}
                {person.dateOfDeath && ` • Died: ${formatDate(new Date(person.dateOfDeath))}`}
              </p>
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
            <StatBadge
              icon={<Camera size={14} />}
              label="Media"
              value={`${stats.photos} Photos`}
            />
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
    <div className="bg-[#f8fbfc] dark:bg-gray-800 px-4 py-2 rounded-lg border border-[#e7f1f3] dark:border-gray-700">
      <p className="text-[10px] uppercase tracking-wider text-[#4c8d9a] font-bold flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold dark:text-gray-200">{value}</p>
    </div>
  );
}
