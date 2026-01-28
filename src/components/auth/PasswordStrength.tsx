import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthResult {
  score: number;
  label: string;
  textColor: string;
  barColor: string;
}

function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: '', textColor: '', barColor: '' };
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: PasswordStrengthResult[] = [
    { score: 0, label: '', textColor: '', barColor: '' },
    { score: 1, label: 'Very Weak', textColor: 'text-red-500', barColor: 'bg-red-500' },
    { score: 2, label: 'Weak', textColor: 'text-orange-500', barColor: 'bg-orange-500' },
    { score: 3, label: 'Fair', textColor: 'text-yellow-500', barColor: 'bg-yellow-500' },
    { score: 4, label: 'Good', textColor: 'text-lime-500', barColor: 'bg-lime-500' },
    { score: 5, label: 'Strong', textColor: 'text-green-500', barColor: 'bg-green-500' },
    { score: 6, label: 'Very Strong', textColor: 'text-emerald-500', barColor: 'bg-emerald-500' },
  ];

  return levels[Math.min(score, 6)];
}

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password || strength.score === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              level <= strength.score ? strength.barColor : 'bg-gray-200 dark:bg-gray-700'
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', strength.textColor)}>
        Password strength: {strength.label}
      </p>
    </div>
  );
}
