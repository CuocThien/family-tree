import { renderHook, act } from '@testing-library/react';
import { usePreferencesStore } from './preferencesStore';

describe('PreferencesStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { resetToDefaults } = usePreferencesStore.getState();
    resetToDefaults();
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const { result } = renderHook(() => usePreferencesStore());

      expect(result.current.theme).toBe('system');
      expect(result.current.fontSize).toBe('medium');
      expect(result.current.dateFormat).toBe('DMY');
      expect(result.current.measurementUnit).toBe('metric');
      expect(result.current.language).toBe('en');
      expect(result.current.defaultViewMode).toBe('pedigree');
      expect(result.current.defaultMaxGenerations).toBe(5);
      expect(result.current.showMinimap).toBe(true);
      expect(result.current.showNodeLabels).toBe(true);
      expect(result.current.animationsEnabled).toBe(true);
      expect(result.current.defaultTreePrivacy).toBe('private');
      expect(result.current.hideLivingPersonDetails).toBe(true);
      expect(result.current.emailNotifications).toBe(true);
      expect(result.current.activityDigest).toBe('weekly');
    });
  });

  describe('appearance settings', () => {
    it('should set theme', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should set font size', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setFontSize('large');
      });

      expect(result.current.fontSize).toBe('large');
    });
  });

  describe('localization settings', () => {
    it('should set date format', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDateFormat('MDY');
      });

      expect(result.current.dateFormat).toBe('MDY');
    });

    it('should set measurement unit', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setMeasurementUnit('imperial');
      });

      expect(result.current.measurementUnit).toBe('imperial');
    });

    it('should set language', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setLanguage('fr');
      });

      expect(result.current.language).toBe('fr');
    });
  });

  describe('tree view settings', () => {
    it('should set default view mode', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDefaultViewMode('fan');
      });

      expect(result.current.defaultViewMode).toBe('fan');
    });

    it('should set default max generations', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDefaultMaxGenerations(7);
      });

      expect(result.current.defaultMaxGenerations).toBe(7);
    });

    it('should toggle minimap', () => {
      const { result } = renderHook(() => usePreferencesStore());

      expect(result.current.showMinimap).toBe(true);

      act(() => {
        result.current.toggleMinimap();
      });

      expect(result.current.showMinimap).toBe(false);

      act(() => {
        result.current.toggleMinimap();
      });

      expect(result.current.showMinimap).toBe(true);
    });

    it('should toggle node labels', () => {
      const { result } = renderHook(() => usePreferencesStore());

      expect(result.current.showNodeLabels).toBe(true);

      act(() => {
        result.current.toggleNodeLabels();
      });

      expect(result.current.showNodeLabels).toBe(false);
    });

    it('should toggle animations', () => {
      const { result } = renderHook(() => usePreferencesStore());

      expect(result.current.animationsEnabled).toBe(true);

      act(() => {
        result.current.toggleAnimations();
      });

      expect(result.current.animationsEnabled).toBe(false);
    });
  });

  describe('privacy settings', () => {
    it('should set default tree privacy', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDefaultTreePrivacy('public');
      });

      expect(result.current.defaultTreePrivacy).toBe('public');
    });

    it('should toggle hide living person details', () => {
      const { result } = renderHook(() => usePreferencesStore());

      expect(result.current.hideLivingPersonDetails).toBe(true);

      act(() => {
        result.current.toggleHideLivingPersonDetails();
      });

      expect(result.current.hideLivingPersonDetails).toBe(false);
    });
  });

  describe('notification settings', () => {
    it('should set email notifications', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setEmailNotifications(false);
      });

      expect(result.current.emailNotifications).toBe(false);
    });

    it('should set activity digest', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setActivityDigest('daily');
      });

      expect(result.current.activityDigest).toBe('daily');
    });
  });

  describe('reset to defaults', () => {
    it('should reset all preferences to defaults', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme('dark');
        result.current.setFontSize('large');
        result.current.setDateFormat('MDY');
        result.current.setMeasurementUnit('imperial');
        result.current.setLanguage('fr');
        result.current.setDefaultViewMode('fan');
        result.current.setDefaultMaxGenerations(10);
        result.current.toggleMinimap();
        result.current.toggleNodeLabels();
        result.current.toggleAnimations();
        result.current.setDefaultTreePrivacy('public');
        result.current.toggleHideLivingPersonDetails();
        result.current.setEmailNotifications(false);
        result.current.setActivityDigest('never');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.fontSize).toBe('large');

      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.fontSize).toBe('medium');
      expect(result.current.dateFormat).toBe('DMY');
      expect(result.current.measurementUnit).toBe('metric');
      expect(result.current.language).toBe('en');
      expect(result.current.defaultViewMode).toBe('pedigree');
      expect(result.current.defaultMaxGenerations).toBe(5);
      expect(result.current.showMinimap).toBe(true);
      expect(result.current.showNodeLabels).toBe(true);
      expect(result.current.animationsEnabled).toBe(true);
      expect(result.current.defaultTreePrivacy).toBe('private');
      expect(result.current.hideLivingPersonDetails).toBe(true);
      expect(result.current.emailNotifications).toBe(true);
      expect(result.current.activityDigest).toBe('weekly');
    });
  });

  describe('theme options', () => {
    it('should support all theme options', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.setTheme('system');
      });
      expect(result.current.theme).toBe('system');
    });
  });

  describe('date format options', () => {
    it('should support all date format options', () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDateFormat('DMY');
      });
      expect(result.current.dateFormat).toBe('DMY');

      act(() => {
        result.current.setDateFormat('MDY');
      });
      expect(result.current.dateFormat).toBe('MDY');

      act(() => {
        result.current.setDateFormat('YMD');
      });
      expect(result.current.dateFormat).toBe('YMD');
    });
  });

  describe('view mode options', () => {
    it('should support all view mode options', () => {
      const { result } = renderHook(() => usePreferencesStore());

      const viewModes: Array<'pedigree' | 'fan' | 'timeline' | 'vertical'> = ['pedigree', 'fan', 'timeline', 'vertical'];

      viewModes.forEach((mode) => {
        act(() => {
          result.current.setDefaultViewMode(mode);
        });
        expect(result.current.defaultViewMode).toBe(mode);
      });
    });
  });

  describe('privacy options', () => {
    it('should support all privacy options', () => {
      const { result } = renderHook(() => usePreferencesStore());

      const privacyOptions: Array<'private' | 'family' | 'public'> = ['private', 'family', 'public'];

      privacyOptions.forEach((privacy) => {
        act(() => {
          result.current.setDefaultTreePrivacy(privacy);
        });
        expect(result.current.defaultTreePrivacy).toBe(privacy);
      });
    });
  });

  describe('activity digest options', () => {
    it('should support all activity digest options', () => {
      const { result } = renderHook(() => usePreferencesStore());

      const digestOptions: Array<'daily' | 'weekly' | 'never'> = ['daily', 'weekly', 'never'];

      digestOptions.forEach((frequency) => {
        act(() => {
          result.current.setActivityDigest(frequency);
        });
        expect(result.current.activityDigest).toBe(frequency);
      });
    });
  });

  describe('font size options', () => {
    it('should support all font size options', () => {
      const { result } = renderHook(() => usePreferencesStore());

      const fontSizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

      fontSizes.forEach((size) => {
        act(() => {
          result.current.setFontSize(size);
        });
        expect(result.current.fontSize).toBe(size);
      });
    });
  });
});
