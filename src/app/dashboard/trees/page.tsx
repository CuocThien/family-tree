import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { TreesContent } from './TreesContent';

export default async function TreesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      <TreesContent userId={session.user.id} userName={session.user.name} />
    </>
  );
}
