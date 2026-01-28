import { Calendar, MapPin, Mail, Phone, Camera } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { IPerson } from '@/types/person';

export interface PersonCardProps {
  person: IPerson;
  onClick?: () => void;
  showActions?: boolean;
  actions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

const genderColors: Record<string, string> = {
  male: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  female: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  other: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const genderLabels: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  unknown: 'Unknown',
};

export function PersonCard({
  person,
  onClick,
  showActions = false,
  actions,
  className,
  variant = 'default',
}: PersonCardProps) {
  const fullName = `${person.firstName} ${person.middleName ? person.middleName + ' ' : ''}${person.lastName}`;
  const hasPhoto = person.photos && person.photos.length > 0;
  const photoUrl = hasPhoto ? person.photos[0] : undefined;

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border border-[#e7f1f3] dark:border-white/10',
          'bg-white dark:bg-[#101f22] hover:shadow-md transition-all cursor-pointer',
          className
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`View ${fullName}`}
      >
        <Avatar
          src={photoUrl}
          fullName={fullName}
          size="md"
          alt={fullName}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#0d191b] dark:text-white truncate">
            {fullName}
          </p>
          {person.dateOfBirth && (
            <p className="text-xs text-[#4c8d9a]">
              Born {new Date(person.dateOfBirth).getFullYear()}
            </p>
          )}
        </div>
        {showActions && actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer hover:shadow-md',
        onClick && 'group',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${fullName}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar
              src={photoUrl}
              fullName={fullName}
              size="xl"
              alt={fullName}
              className="ring-2 ring-[#e7f1f3] dark:ring-white/10"
            />
            {person.gender && (
              <Badge
                variant="outline"
                className="absolute -bottom-1 -right-1 text-xs"
              >
                {genderLabels[person.gender] || person.gender}
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#0d191b] dark:text-white group-hover:text-[#13c8ec] transition-colors">
              {fullName}
            </h3>

            {/* Dates */}
            <div className="flex items-center gap-3 mt-2 text-sm text-[#4c8d9a]">
              {person.dateOfBirth && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} aria-hidden="true" />
                  <span>
                    {new Date(person.dateOfBirth).toLocaleDateString()}
                    {person.dateOfDeath && (
                      <> – {new Date(person.dateOfDeath).toLocaleDateString()}</>
                    )}
                  </span>
                </span>
              )}
              {person.dateOfDeath && (
                <Badge variant="danger" size="sm">Deceased</Badge>
              )}
            </div>

            {/* Biography */}
            {variant === 'detailed' && person.biography && (
              <p className="mt-3 text-sm text-[#0d191b] dark:text-white/80 line-clamp-2">
                {person.biography}
              </p>
            )}

            {/* Media count */}
            {variant === 'detailed' && (person.photos?.length || person.documents?.length) && (
              <div className="flex items-center gap-3 mt-3 text-xs text-[#4c8d9a]">
                {person.photos && person.photos.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Camera size={12} aria-hidden="true" />
                    {person.photos.length} {person.photos.length === 1 ? 'photo' : 'photos'}
                  </span>
                )}
                {person.documents && person.documents.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} aria-hidden="true" />
                    {person.documents.length} {person.documents.length === 1 ? 'document' : 'documents'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && actions && (
            <div className="flex-shrink-0">{actions}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

PersonCard.displayName = 'PersonCard';
