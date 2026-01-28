import { useEffect } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type DateFormat = 'DMY' | 'MDY' | 'YMD';
type MeasurementUnit = 'metric' | 'imperial';

interface PreferencesState {
  // Appearance
  theme: Theme;
  fontSize: 'small' | 'medium' | 'large';

  // Localization
  dateFormat: DateFormat;
  measurementUnit: MeasurementUnit;
  language: string;

  // Tree View
  defaultViewMode: 'pedigree' | 'fan' | 'timeline' | 'vertical';
  defaultMaxGenerations: number;
  showMinimap: boolean;
  showNodeLabels: boolean;
  animationsEnabled: boolean;

  // Privacy
  defaultTreePrivacy: 'private' | 'family' | 'public';
  hideLivingPersonDetails: boolean;

  // Notifications
  emailNotifications: boolean;
  activityDigest: 'daily' | 'weekly' | 'never';
}

interface PreferencesActions {
  setTheme: (theme: Theme) => void;
  setFontSize: (size: PreferencesState['fontSize']) => void;
  setDateFormat: (format: DateFormat) => void;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
  setLanguage: (language: string) => void;
  setDefaultViewMode: (mode: PreferencesState['defaultViewMode']) => void;
  setDefaultMaxGenerations: (generations: number) => void;
  toggleMinimap: () => void;
  toggleNodeLabels: () => void;
  toggleAnimations: () => void;
  setDefaultTreePrivacy: (privacy: PreferencesState['defaultTreePrivacy']) => void;
  toggleHideLivingPersonDetails: () => void;
  setEmailNotifications: (enabled: boolean) => void;
  setActivityDigest: (frequency: PreferencesState['activityDigest']) => void;
  resetToDefaults: () => void;
}

const defaultPreferences: PreferencesState = {
  theme: 'system',
  fontSize: 'medium',
  dateFormat: 'DMY',
  measurementUnit: 'metric',
  language: 'en',
  defaultViewMode: 'pedigree',
  defaultMaxGenerations: 5,
  showMinimap: true,
  showNodeLabels: true,
  animationsEnabled: true,
  defaultTreePrivacy: 'private',
  hideLivingPersonDetails: true,
  emailNotifications: true,
  activityDigest: 'weekly',
};

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  devtools(
    persist(
      (set) => ({
        ...defaultPreferences,

        setTheme: (theme) => set({ theme }),
        setFontSize: (fontSize) => set({ fontSize }),
        setDateFormat: (dateFormat) => set({ dateFormat }),
        setMeasurementUnit: (measurementUnit) => set({ measurementUnit }),
        setLanguage: (language) => set({ language }),
        setDefaultViewMode: (defaultViewMode) => set({ defaultViewMode }),
        setDefaultMaxGenerations: (defaultMaxGenerations) => set({ defaultMaxGenerations }),
        toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
        toggleNodeLabels: () => set((state) => ({ showNodeLabels: !state.showNodeLabels })),
        toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
        setDefaultTreePrivacy: (defaultTreePrivacy) => set({ defaultTreePrivacy }),
        toggleHideLivingPersonDetails: () =>
          set((state) => ({ hideLivingPersonDetails: !state.hideLivingPersonDetails })),
        setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
        setActivityDigest: (activityDigest) => set({ activityDigest }),
        resetToDefaults: () => set(defaultPreferences),
      }),
      {
        name: 'user-preferences',
        partialize: (state) => ({
          theme: state.theme,
          fontSize: state.fontSize,
          dateFormat: state.dateFormat,
          measurementUnit: state.measurementUnit,
          language: state.language,
          defaultViewMode: state.defaultViewMode,
          defaultMaxGenerations: state.defaultMaxGenerations,
          showMinimap: state.showMinimap,
          animationsEnabled: state.animationsEnabled,
        }),
      }
    ),
    { name: 'preferences-store' }
  )
);

// Theme effect hook
export const useThemeEffect = () => {
  const theme = usePreferencesStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);
};
