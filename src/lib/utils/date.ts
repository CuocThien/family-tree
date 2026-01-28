/**
 * Date utility functions
 */

export function formatDate(date: Date | string, format: 'short' | 'long' = 'long'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatLifespan(birthDate?: Date | string, deathDate?: Date | string): string {
  const birth = birthDate ? new Date(birthDate).getFullYear() : null;
  const death = deathDate ? new Date(deathDate).getFullYear() : null;

  if (birth && death) {
    return `${birth} — ${death}`;
  }
  if (birth) {
    return `${birth} — Present`;
  }
  return '';
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(d, 'short');
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function calculateAge(birthDate: Date | string, referenceDate?: Date): number | null {
  const birth = new Date(birthDate);
  const reference = referenceDate || new Date();

  if (isNaN(birth.getTime())) return null;

  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
