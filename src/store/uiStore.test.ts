import { renderHook, act } from '@testing-library/react';
import { useUIStore, useModal, useToast, useIsLoading } from './uiStore';

describe('UIStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Reset store state before each test
    useUIStore.getState().reset();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('modal actions', () => {
    it('should open modal with data', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openModal('addPerson', { personId: 'person-1' });
      });

      expect(result.current.activeModal).toBe('addPerson');
      expect(result.current.modalData).toEqual({ personId: 'person-1' });
    });

    it('should close modal and clear data', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openModal('editPerson', { personId: 'person-1' });
        result.current.closeModal();
      });

      expect(result.current.activeModal).toBeNull();
      expect(result.current.modalData).toEqual({});
    });

    it('should open modal without data', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openModal('settings');
      });

      expect(result.current.activeModal).toBe('settings');
      expect(result.current.modalData).toEqual({});
    });
  });

  describe('sidebar actions', () => {
    it('should set sidebar open state', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSidebarOpen(false);
      });

      expect(result.current.sidebarOpen).toBe(false);
    });

    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.sidebarOpen).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(true);
    });

    it('should set sidebar tab', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSidebarTab('details');
      });

      expect(result.current.sidebarTab).toBe('details');
    });
  });

  describe('toast actions', () => {
    it('should add toast with auto-generated id', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addToast({ type: 'success', message: 'Success!' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].type).toBe('success');
      expect(result.current.toasts[0].message).toBe('Success!');
      expect(result.current.toasts[0].id).toMatch(/^toast-\d+-[a-z0-9]+$/);
    });

    it('should add toast with custom duration', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addToast({ type: 'error', message: 'Error!', duration: 1000 });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should add toast with default duration of 5000ms', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addToast({ type: 'info', message: 'Info!' });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should not auto-remove toast with duration 0', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addToast({ type: 'warning', message: 'Warning!', duration: 0 });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('should remove toast by id', () => {
      const { result } = renderHook(() => useUIStore());

      let toastId: string;

      act(() => {
        result.current.addToast({ type: 'success', message: 'Success!' });
      });

      act(() => {
        toastId = result.current.toasts[0].id;
      });

      act(() => {
        result.current.removeToast(toastId!);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should clear all toasts', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addToast({ type: 'success', message: 'Success 1!' });
        result.current.addToast({ type: 'error', message: 'Error!' });
        result.current.addToast({ type: 'warning', message: 'Warning!' });
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.clearToasts();
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('loading actions', () => {
    it('should set global loading state', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setGlobalLoading(true);
      });

      expect(result.current.globalLoading).toBe(true);
    });

    it('should start and end task', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.startTask('task-1', 'Loading data...');
      });

      expect(result.current.loadingTasks.size).toBe(1);
      expect(result.current.loadingTasks.get('task-1')).toBe('Loading data...');

      act(() => {
        result.current.endTask('task-1');
      });

      expect(result.current.loadingTasks.size).toBe(0);
    });

    it('should handle multiple tasks', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.startTask('task-1', 'Task 1');
        result.current.startTask('task-2', 'Task 2');
        result.current.startTask('task-3', 'Task 3');
      });

      expect(result.current.loadingTasks.size).toBe(3);

      act(() => {
        result.current.endTask('task-2');
      });

      expect(result.current.loadingTasks.size).toBe(2);
      expect(result.current.loadingTasks.has('task-2')).toBe(false);
    });
  });

  describe('mobile menu actions', () => {
    it('should set mobile menu open state', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setMobileMenuOpen(true);
      });

      expect(result.current.mobileMenuOpen).toBe(true);
    });

    it('should toggle mobile menu', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.mobileMenuOpen).toBe(false);

      act(() => {
        result.current.toggleMobileMenu();
      });

      expect(result.current.mobileMenuOpen).toBe(true);

      act(() => {
        result.current.toggleMobileMenu();
      });

      expect(result.current.mobileMenuOpen).toBe(false);
    });
  });

  describe('useModal hook', () => {
    it('should return modal state and actions', () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.activeModal).toBeNull();
      expect(result.current.modalData).toEqual({});
      expect(typeof result.current.openModal).toBe('function');
      expect(typeof result.current.closeModal).toBe('function');
    });

    it('should open and close modal through hook', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.openModal('addPerson', { test: 'data' });
      });

      expect(result.current.activeModal).toBe('addPerson');
      expect(result.current.modalData).toEqual({ test: 'data' });

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.activeModal).toBeNull();
    });
  });

  describe('useToast hook', () => {
    it('should return toast functions', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.success).toBe('function');
      expect(typeof result.current.error).toBe('function');
      expect(typeof result.current.warning).toBe('function');
      expect(typeof result.current.info).toBe('function');
    });

    it('should create success toast', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useUIStore());

      act(() => {
        toastResult.current.success('Success message');
      });

      expect(storeResult.current.toasts).toHaveLength(1);
      expect(storeResult.current.toasts[0].type).toBe('success');
      expect(storeResult.current.toasts[0].message).toBe('Success message');
    });

    it('should create error toast', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useUIStore());

      act(() => {
        toastResult.current.error('Error message');
      });

      expect(storeResult.current.toasts[0].type).toBe('error');
    });

    it('should create warning toast', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useUIStore());

      act(() => {
        toastResult.current.warning('Warning message');
      });

      expect(storeResult.current.toasts[0].type).toBe('warning');
    });

    it('should create info toast', () => {
      const { result: toastResult } = renderHook(() => useToast());
      const { result: storeResult } = renderHook(() => useUIStore());

      act(() => {
        toastResult.current.info('Info message');
      });

      expect(storeResult.current.toasts[0].type).toBe('info');
    });
  });

  describe('useIsLoading hook', () => {
    it('should return true when global loading is true', () => {
      const { result: storeResult } = renderHook(() => useUIStore());
      const { result: hookResult } = renderHook(() => useIsLoading());

      expect(hookResult.current).toBe(false);

      act(() => {
        storeResult.current.setGlobalLoading(true);
      });

      expect(hookResult.current).toBe(true);
    });

    it('should return true when there are active tasks', () => {
      const { result: storeResult } = renderHook(() => useUIStore());
      const { result: hookResult } = renderHook(() => useIsLoading());

      expect(hookResult.current).toBe(false);

      act(() => {
        storeResult.current.startTask('task-1', 'Loading...');
      });

      expect(hookResult.current).toBe(true);
    });

    it('should return true when both global loading and active tasks', () => {
      const { result: storeResult } = renderHook(() => useUIStore());
      const { result: hookResult } = renderHook(() => useIsLoading());

      act(() => {
        storeResult.current.setGlobalLoading(true);
        storeResult.current.startTask('task-1', 'Loading...');
      });

      expect(hookResult.current).toBe(true);
    });

    it('should return false when no loading state', () => {
      const { result } = renderHook(() => useIsLoading());

      expect(result.current).toBe(false);
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.activeModal).toBeNull();
      expect(result.current.modalData).toEqual({});
      expect(result.current.sidebarOpen).toBe(true);
      expect(result.current.sidebarTab).toBe('filters');
      expect(result.current.toasts).toEqual([]);
      expect(result.current.globalLoading).toBe(false);
      expect(result.current.loadingTasks.size).toBe(0);
      expect(result.current.mobileMenuOpen).toBe(false);
    });
  });
});
