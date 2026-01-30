import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { TreeBoardContent } from './TreeBoardContent';
import { TreeBoardSkeleton } from '@/components/tree/TreeBoardSkeleton';

interface PageProps {
  params: Promise<{ treeId: string }>;
}

export default async function TreeBoardPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { treeId } = await params;

  return (
    <>
      <TreeBoardContent treeId={treeId} userId={session.user.id} />
    </>
  );
}
