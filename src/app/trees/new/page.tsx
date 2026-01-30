import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { NewTreeContent } from './NewTreeContent';

export default async function NewTreePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      <NewTreeContent userId={session.user.id} />
    </>
  );
}
