import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface DNAInsightsBannerProps {
  matchCount: number;
  className?: string;
}

export function DNAInsightsBanner({ matchCount, className }: DNAInsightsBannerProps) {
  const router = useRouter();

  if (matchCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-[#13c8ec] to-[#00b4db] rounded-2xl p-6 text-white',
        'flex items-center justify-between gap-4',
        'shadow-lg shadow-[#13c8ec]/20',
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold">New DNA matches found</h3>
        <p className="text-white/80 text-sm">
          You have {matchCount} potential {matchCount === 1 ? 'relative' : 'relatives'} matching your DNA profile.
        </p>
      </div>
      <Button
        variant="secondary"
        className="bg-white text-[#13c8ec] hover:bg-white/90 shrink-0"
        onClick={() => router.push('/dna')}
      >
        Review Matches
      </Button>
    </div>
  );
}

DNAInsightsBanner.displayName = 'DNAInsightsBanner';
