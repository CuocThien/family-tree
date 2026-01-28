import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardContent } from './DashboardContent';
import { DashboardSkeleton } from '@/components/dashboard';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      <DashboardContent userId={session.user.id} userName={session.user.name} />
    </>
  );
}
