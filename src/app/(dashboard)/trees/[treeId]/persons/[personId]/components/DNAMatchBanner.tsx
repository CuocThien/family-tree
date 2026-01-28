import { Card } from '@/components/ui';
import { Dna } from 'lucide-react';

interface DNAMatchBannerProps {
  matchCount: number;
}

export function DNAMatchBanner({ matchCount }: DNAMatchBannerProps) {
  if (matchCount === 0) {
    return null;
  }

  return (
    <section>
      <Card variant="outline" className="bg-gradient-to-r from-[#13c8ec]/10 to-[#13c8ec]/5 border-[#13c8ec]/20">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full bg-[#13c8ec]/20 text-[#13c8ec] flex items-center justify-center flex-shrink-0">
            <Dna size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-[#0d191b] dark:text-white font-semibold">
              DNA Matches
            </h3>
            <p className="text-sm text-[#4c8d9a]">
              {matchCount} potential {matchCount === 1 ? 'match' : 'matches'} found
            </p>
          </div>
          <button className="px-4 py-2 bg-[#13c8ec] text-white text-sm font-semibold rounded-lg hover:bg-[#13c8ec]/90 transition-colors">
            View Matches
          </button>
        </div>
      </Card>
    </section>
  );
}
