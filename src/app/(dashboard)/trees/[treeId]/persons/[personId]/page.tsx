import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PersonProfileContent } from './PersonProfileContent';
import { PersonProfileSkeleton } from './PersonProfileSkeleton';

interface PageProps {
  params: Promise<{ treeId: string; personId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { personId } = await params;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/persons/${personId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return { title: 'Person Not Found' };
    }

    const { data: person } = await response.json();

    return {
      title: `${person.firstName} ${person.lastName} | AncestryTree`,
      description: person.biography?.slice(0, 160) || `Profile of ${person.firstName} ${person.lastName}`,
    };
  } catch {
    return { title: 'Person Profile | AncestryTree' };
  }
}

export default async function PersonProfilePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { treeId, personId } = await params;

  return (
    <>
      <PersonProfileContent treeId={treeId} personId={personId} userId={session.user.id} />
    </>
  );
}
