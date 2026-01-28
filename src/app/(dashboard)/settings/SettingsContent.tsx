'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { User, Shield, CreditCard, Bell, LogOut } from 'lucide-react';
import { ProfileSection } from './sections/ProfileSection';
import { SecuritySection } from './sections/SecuritySection';
import { SubscriptionSection } from './sections/SubscriptionSection';
import { NotificationsSection } from './sections/NotificationsSection';

type SettingsTab = 'profile' | 'security' | 'subscription' | 'notifications';

interface SettingsContentProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const tabs = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'security' as const, label: 'Security', icon: Shield },
  { id: 'subscription' as const, label: 'Subscription', icon: CreditCard },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
];

export function SettingsContent({ user }: SettingsContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <main className="flex-1 px-4 md:px-10 lg:px-40 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[#0d191b] dark:text-white text-3xl font-black leading-tight">
          Account Settings
        </h1>
        <p className="text-[#4c8d9a] text-base mt-1">
          Manage your profile information and tree preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/5 border border-primary/20 text-primary font-bold shadow-sm'
                  : 'hover:bg-white dark:hover:bg-white/5 text-[#4c8d9a] font-medium'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}

          <hr className="my-4 border-[#e7f1f3] dark:border-white/10" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 font-medium transition-all"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-9 flex flex-col gap-8">
          {activeTab === 'profile' && <ProfileSection user={user} />}
          {activeTab === 'security' && <SecuritySection />}
          {activeTab === 'subscription' && <SubscriptionSection />}
          {activeTab === 'notifications' && <NotificationsSection />}
        </div>
      </div>
    </main>
  );
}
