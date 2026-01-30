import { Metadata } from 'next';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PersonProfileContent } from './PersonProfileContent';
import { PersonProfileSkeleton } from '@/components/person/PersonProfileSkeleton';

interface PersonProfilePageProps {
  params: {
    personId: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Person Profile - Family Tree',
    description: 'View person details and family connections',
  };
}

export default async function PersonProfilePage({ params }: PersonProfilePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<PersonProfileSkeleton />}>
      <PersonProfileContent personId={params.personId} />
    </Suspense>
  );
}
