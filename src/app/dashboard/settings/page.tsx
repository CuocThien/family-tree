import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SettingsContent } from './SettingsContent';

export const metadata = {
  title: 'Account Settings | AncestryTree',
  description: 'Manage your profile and preferences',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <SettingsContent user={session.user} />;
}
