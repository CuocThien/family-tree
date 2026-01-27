# Task 23: Create Account Settings Page, Types, and Utilities

**Phase:** 12-16 - Pages, Types, Utilities, Environment Config
**Priority:** Medium
**Dependencies:** Task 16 (UI), Task 14 (NextAuth)
**Estimated Complexity:** Medium

---

## Objective

Implement the Account Settings page based on `design/account-setting.html`, define all TypeScript types, create utility functions, and configure environment variables.

---

## Part 1: Account Settings Page

### Design Analysis

```
┌────────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                       │
├────────────────────────────────────────────────────────────┤
│  Account Settings                                           │
│  Manage your profile information and tree preferences.      │
├───────────────┬────────────────────────────────────────────┤
│  Side Nav     │            Content Area                     │
│  [Profile]    │  ┌────────────────────────────────────────┐ │
│  [Security]   │  │      Personal Information              │ │
│  [Subscription│  │  [Avatar]  Display Name: ____          │ │
│  [Notifications│ │           Contact Email: ____          │ │
│  ─────────────│  │           Short Bio: ____              │ │
│  [Log Out]    │  └────────────────────────────────────────┘ │
│               │  ┌────────────────────────────────────────┐ │
│               │  │      Tree Preferences                  │ │
│               │  │  Default Visibility: [Private][Public] │ │
│               │  │  Measurement Units: [Metric ▼]         │ │
│               │  │  Open Collaboration: [Toggle]          │ │
│               │  └────────────────────────────────────────┘ │
│               │           [Cancel]  [Save Changes]         │
└───────────────┴────────────────────────────────────────────┘
```

### Page Implementation

**File:** `src/app/(dashboard)/settings/page.tsx`

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SettingsContent } from './SettingsContent';

export const metadata = {
  title: 'Account Settings | AncestryTree',
  description: 'Manage your profile and preferences',
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <SettingsContent user={session.user} />;
}
```

**File:** `src/app/(dashboard)/settings/SettingsContent.tsx`

```typescript
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
    name: string;
    email: string;
    image?: string;
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
```

### Profile Section

**File:** `src/app/(dashboard)/settings/sections/ProfileSection.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/store/uiStore';
import { Camera, Badge, TreePine } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(2).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
});

const preferencesSchema = z.object({
  defaultVisibility: z.enum(['private', 'public']),
  measurementUnit: z.enum(['metric', 'imperial']),
  openCollaboration: z.boolean(),
});

type ProfileData = z.infer<typeof profileSchema>;
type PreferencesData = z.infer<typeof preferencesSchema>;

interface ProfileSectionProps {
  user: {
    name: string;
    email: string;
    image?: string;
  };
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.name,
      email: user.email,
      bio: '',
    },
  });

  const preferencesForm = useForm<PreferencesData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      defaultVisibility: 'private',
      measurementUnit: 'metric',
      openCollaboration: true,
    },
  });

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const profileData = profileForm.getValues();
      const preferencesData = preferencesForm.getValues();

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, preferences: preferencesData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Personal Information */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-[#e7f1f3] dark:border-white/10">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Badge className="text-primary" size={20} />
          Personal Information
        </h2>

        <div className="space-y-8">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar src={user.image} alt={user.name} size="xl" />
              <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Camera size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-lg">Profile Picture</p>
              <p className="text-sm text-[#4c8d9a]">PNG, JPG or GIF. Max 5MB.</p>
              <div className="flex gap-3 mt-2">
                <button className="text-xs font-bold text-primary hover:underline">
                  Upload New
                </button>
                <button className="text-xs font-bold text-red-500 hover:underline">
                  Remove
                </button>
              </div>
            </div>
          </div>

          <hr className="border-[#e7f1f3] dark:border-white/10" />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Display Name"
              {...profileForm.register('displayName')}
              error={profileForm.formState.errors.displayName?.message}
            />
            <Input
              label="Contact Email"
              type="email"
              {...profileForm.register('email')}
              error={profileForm.formState.errors.email?.message}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Short Bio"
                rows={3}
                {...profileForm.register('bio')}
                placeholder="Tell us about yourself and your genealogy interests..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tree Preferences */}
      <div className="bg-white dark:bg-white/5 rounded-2xl p-8 shadow-sm border border-[#e7f1f3] dark:border-white/10">
        <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
          <TreePine className="text-primary" size={20} />
          Tree Preferences
        </h2>

        <div className="space-y-6">
          {/* Default Visibility */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-bold">Default Visibility</p>
              <p className="text-sm text-[#4c8d9a]">
                Control who can see your family trees by default.
              </p>
            </div>
            <div className="flex bg-[#e7f1f3] dark:bg-white/10 p-1 rounded-xl">
              <button
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  preferencesForm.watch('defaultVisibility') === 'private'
                    ? 'bg-white dark:bg-white/20 shadow-sm'
                    : 'text-[#4c8d9a]'
                }`}
                onClick={() => preferencesForm.setValue('defaultVisibility', 'private')}
              >
                Private
              </button>
              <button
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  preferencesForm.watch('defaultVisibility') === 'public'
                    ? 'bg-white dark:bg-white/20 shadow-sm'
                    : 'text-[#4c8d9a]'
                }`}
                onClick={() => preferencesForm.setValue('defaultVisibility', 'public')}
              >
                Public
              </button>
            </div>
          </div>

          <hr className="border-[#e7f1f3] dark:border-white/10" />

          {/* Measurement Units */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-bold">Measurement Units</p>
              <p className="text-sm text-[#4c8d9a]">
                Used for displaying distances and map data.
              </p>
            </div>
            <Select
              value={preferencesForm.watch('measurementUnit')}
              onChange={(value) =>
                preferencesForm.setValue('measurementUnit', value as 'metric' | 'imperial')
              }
              options={[
                { value: 'metric', label: 'Metric (km, m)' },
                { value: 'imperial', label: 'Imperial (mi, ft)' },
              ]}
            />
          </div>

          <hr className="border-[#e7f1f3] dark:border-white/10" />

          {/* Open Collaboration */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Open Collaboration</p>
              <p className="text-sm text-[#4c8d9a]">
                Allow others to request to join your tree edits.
              </p>
            </div>
            <Toggle
              checked={preferencesForm.watch('openCollaboration')}
              onChange={(checked) => preferencesForm.setValue('openCollaboration', checked)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="ghost">Cancel</Button>
        <Button onClick={handleSave} loading={isSaving}>
          Save Changes
        </Button>
      </div>
    </>
  );
}
```

---

## Part 2: TypeScript Types

**File:** `src/types/index.ts`

```typescript
// Re-export all types
export * from './user';
export * from './tree';
export * from './person';
export * from './relationship';
export * from './media';
export * from './dtos';
```

**File:** `src/types/person.ts`

```typescript
import { ObjectId } from 'mongodb';

export interface IPerson {
  _id: string;
  treeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  maidenName?: string;
  suffix?: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: Date;
  birthPlace?: string;
  deathDate?: Date;
  deathPlace?: string;
  isLiving: boolean;
  biography?: string;
  profilePhoto?: string;
  occupation?: string;
  nationality?: string;
  religion?: string;
  privacyLevel?: 'public' | 'family' | 'private';
  dnaMatch?: string;
  hasDnaMatch?: boolean;
  lifeEvents?: LifeEvent[];
  customFields?: Record<string, string>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LifeEvent {
  type: 'birth' | 'death' | 'marriage' | 'divorce' | 'occupation' | 'education' | 'residence' | 'military' | 'immigration' | 'custom';
  title: string;
  date?: Date;
  endDate?: Date;
  location?: string;
  description?: string;
  sources?: string[];
}

export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type PrivacyLevel = 'public' | 'family' | 'private';
```

**File:** `src/types/tree.ts`

```typescript
export interface ITree {
  _id: string;
  name: string;
  description?: string;
  ownerId: string;
  privacy: 'private' | 'family' | 'public';
  coverImage?: string;
  rootPersonId?: string;
  collaborators: TreeCollaborator[];
  settings: TreeSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreeCollaborator {
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
  addedAt: Date;
  addedBy: string;
}

export interface TreeSettings {
  defaultPrivacyLevel: 'public' | 'family' | 'private';
  allowDnaMatching: boolean;
  showLivingPersonDetails: boolean;
}

export interface TreeStats {
  memberCount: number;
  relationshipCount: number;
  mediaCount: number;
  oldestPerson?: IPerson;
  newestPerson?: IPerson;
  generations: number;
}
```

**File:** `src/types/relationship.ts`

```typescript
export type RelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'step-parent'
  | 'step-child'
  | 'adoptive-parent'
  | 'adoptive-child'
  | 'partner';

export interface IRelationship {
  _id: string;
  treeId: string;
  fromPersonId: string;
  toPersonId: string;
  type: RelationshipType;
  startDate?: Date;
  endDate?: Date;
  status?: 'active' | 'ended' | 'unknown';
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMembers {
  parents: IPerson[];
  children: IPerson[];
  spouses: IPerson[];
  siblings: IPerson[];
}
```

**File:** `src/types/dtos/person.ts`

```typescript
import { z } from 'zod';

export const CreatePersonDtoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  middleName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  birthDate: z.date().optional(),
  birthPlace: z.string().max(200).optional(),
  deathDate: z.date().optional(),
  deathPlace: z.string().max(200).optional(),
  isLiving: z.boolean().default(true),
  biography: z.string().max(5000).optional(),
}).refine(
  (data) => {
    if (data.deathDate && data.birthDate) {
      return data.deathDate >= data.birthDate;
    }
    return true;
  },
  { message: 'Death date must be after birth date', path: ['deathDate'] }
);

export type CreatePersonDto = z.infer<typeof CreatePersonDtoSchema>;

export const UpdatePersonDtoSchema = CreatePersonDtoSchema.partial();
export type UpdatePersonDto = z.infer<typeof UpdatePersonDtoSchema>;
```

---

## Part 3: Utility Functions

**File:** `src/lib/utils/date.ts`

```typescript
export function formatDate(date: Date | string, format: 'short' | 'long' = 'long'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatLifespan(birthDate?: Date | string, deathDate?: Date | string): string {
  const birth = birthDate ? new Date(birthDate).getFullYear() : null;
  const death = deathDate ? new Date(deathDate).getFullYear() : null;

  if (birth && death) {
    return `${birth} — ${death}`;
  }
  if (birth) {
    return `${birth} — Present`;
  }
  return '';
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(d, 'short');
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function calculateAge(birthDate: Date | string, referenceDate?: Date): number | null {
  const birth = new Date(birthDate);
  const reference = referenceDate || new Date();

  if (isNaN(birth.getTime())) return null;

  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
```

**File:** `src/lib/utils/cn.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**File:** `src/lib/utils/string.ts`

```typescript
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getInitials(name: string, maxLength = 2): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
}
```

---

## Part 4: Environment Configuration

**File:** `.env.example`

```bash
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/family-tree
MONGODB_NAME=family-tree

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-generate-with-openssl

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Storage
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# AWS S3 (optional)
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Email
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@familytree.app

# Security
FILE_SIGNING_SECRET=your-file-signing-secret
RATE_LIMIT_MAX=100
```

**File:** `src/lib/config/env.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  MONGODB_URI: z.string(),
  MONGODB_NAME: z.string().default('family-tree'),

  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),

  STORAGE_TYPE: z.enum(['local', 'gridfs', 'cloudinary', 's3']).default('local'),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  FILE_SIGNING_SECRET: z.string().min(16).default('change-this-secret'),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = getEnv();
```

---

## Acceptance Criteria

- [ ] Account Settings page with all sections
- [ ] Profile editing functionality
- [ ] Tree preferences saving
- [ ] Security section (password change)
- [ ] Notifications preferences
- [ ] All TypeScript types defined
- [ ] Zod schemas for validation
- [ ] Utility functions created
- [ ] Environment configuration
- [ ] Mobile responsive layout
- [ ] Dark mode support
- [ ] Form validation
- [ ] Toast notifications
