'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Bell, Mail, Smartphone, AlertCircle } from 'lucide-react';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

const notificationCategories = [
  {
    title: 'Collaboration',
    icon: Bell,
    settings: [
      {
        id: 'tree-invites',
        label: 'Tree Invites',
        description: 'When someone invites you to their family tree',
        email: true,
        push: true,
      },
      {
        id: 'collaboration-requests',
        label: 'Collaboration Requests',
        description: 'When someone requests to edit your tree',
        email: true,
        push: true,
      },
      {
        id: 'member-changes',
        label: 'Member Changes',
        description: 'When collaborators add or edit tree members',
        email: false,
        push: true,
      },
    ],
  },
  {
    title: 'Activity',
    icon: AlertCircle,
    settings: [
      {
        id: 'new-matches',
        label: 'New DNA Matches',
        description: 'When new potential relatives are found',
        email: true,
        push: true,
      },
      {
        id: 'comments',
        label: 'Comments',
        description: 'When someone comments on your tree',
        email: false,
        push: true,
      },
      {
        id: 'weekly-report',
        label: 'Weekly Activity Report',
        description: 'Summary of weekly activity on your trees',
        email: true,
        push: false,
      },
    ],
  },
];

export function NotificationsSection() {
  const [settings, setSettings] = useState<Record<string, { email: boolean; push: boolean }>>({
    'tree-invites': { email: true, push: true },
    'collaboration-requests': { email: true, push: true },
    'member-changes': { email: false, push: true },
    'new-matches': { email: true, push: true },
    'comments': { email: false, push: true },
    'weekly-report': { email: true, push: false },
  });

  const updateSetting = (id: string, type: 'email' | 'push', value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], [type]: value },
    }));
  };

  const handleSave = () => {
    // TODO: Implement save to API
    console.log('Saving notification settings:', settings);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-[#e7f1f3] dark:border-white/10">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Bell className="text-primary" size={20} />
          Notification Preferences
        </h2>

        <div className="space-y-10">
          {notificationCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <category.icon className="text-primary" size={18} />
                {category.title}
              </h3>

              <div className="space-y-6">
                {category.settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-[#e7f1f3] dark:border-white/10 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{setting.label}</p>
                      <p className="text-sm text-[#4c8d9a] mt-1">{setting.description}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <Mail size={18} className="text-[#4c8d9a]" />
                        <span className="text-sm font-medium">Email</span>
                        <Toggle
                          checked={settings[setting.id]?.email ?? false}
                          onChange={(checked) => updateSetting(setting.id, 'email', checked)}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <Smartphone size={18} className="text-[#4c8d9a]" />
                        <span className="text-sm font-medium">Push</span>
                        <Toggle
                          checked={settings[setting.id]?.push ?? false}
                          onChange={(checked) => updateSetting(setting.id, 'push', checked)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  );
}
