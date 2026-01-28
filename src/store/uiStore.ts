import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type ModalType =
  | 'addPerson'
  | 'editPerson'
  | 'confirmDelete'
  | 'shareTree'
  | 'inviteCollaborator'
  | 'exportTree'
  | 'settings'
  | null;

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // Modal State
  activeModal: ModalType;
  modalData: Record<string, unknown>;

  // Sidebar State
  sidebarOpen: boolean;
  sidebarTab: 'filters' | 'details' | 'activity';

  // Toasts
  toasts: Toast[];

  // Loading States
  globalLoading: boolean;
  loadingTasks: Map<string, string>;

  // Mobile
  mobileMenuOpen: boolean;
}

interface UIActions {
  // Modal Actions
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Sidebar Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: UIState['sidebarTab']) => void;

  // Toast Actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Loading Actions
  setGlobalLoading: (loading: boolean) => void;
  startTask: (taskId: string, message: string) => void;
  endTask: (taskId: string) => void;

  // Mobile Actions
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Reset
  reset: () => void;
}

const initialState: UIState = {
  activeModal: null,
  modalData: {},
  sidebarOpen: true,
  sidebarTab: 'filters',
  toasts: [],
  globalLoading: false,
  loadingTasks: new Map(),
  mobileMenuOpen: false,
};

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    immer((set) => ({
      ...initialState,

      // Modal Actions
      openModal: (modal, data = {}) =>
        set((state) => {
          state.activeModal = modal;
          state.modalData = data;
        }),

      closeModal: () =>
        set((state) => {
          state.activeModal = null;
          state.modalData = {};
        }),

      // Sidebar Actions
      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebarOpen = open;
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        }),

      setSidebarTab: (tab) =>
        set((state) => {
          state.sidebarTab = tab;
        }),

      // Toast Actions
      addToast: (toast) =>
        set((state) => {
          const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          state.toasts.push({ ...toast, id });

          // Auto-remove after duration
          const duration = toast.duration ?? 5000;
          if (duration > 0) {
            setTimeout(() => {
              useUIStore.getState().removeToast(id);
            }, duration);
          }
        }),

      removeToast: (id) =>
        set((state) => {
          state.toasts = state.toasts.filter((t) => t.id !== id);
        }),

      clearToasts: () =>
        set((state) => {
          state.toasts = [];
        }),

      // Loading Actions
      setGlobalLoading: (loading) =>
        set((state) => {
          state.globalLoading = loading;
        }),

      startTask: (taskId, message) =>
        set((state) => {
          state.loadingTasks.set(taskId, message);
        }),

      endTask: (taskId) =>
        set((state) => {
          state.loadingTasks.delete(taskId);
        }),

      // Mobile Actions
      setMobileMenuOpen: (open) =>
        set((state) => {
          state.mobileMenuOpen = open;
        }),

      toggleMobileMenu: () =>
        set((state) => {
          state.mobileMenuOpen = !state.mobileMenuOpen;
        }),

      // Reset
      reset: () => set(initialState),
    })),
    { name: 'ui-store' }
  )
);

// Convenience hooks
export const useModal = () => {
  const { activeModal, modalData, openModal, closeModal } = useUIStore();
  return { activeModal, modalData, openModal, closeModal };
};

export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (message: string) => addToast({ type: 'success', message }),
    error: (message: string) => addToast({ type: 'error', message }),
    warning: (message: string) => addToast({ type: 'warning', message }),
    info: (message: string) => addToast({ type: 'info', message }),
  };
};

export const useIsLoading = () => {
  const { globalLoading, loadingTasks } = useUIStore();
  return globalLoading || loadingTasks.size > 0;
};
