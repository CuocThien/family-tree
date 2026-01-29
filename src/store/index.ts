export {
  useTreeBoardStore,
  useSelectedPerson,
  useRootPerson,
  usePersonById,
  useVisiblePersons,
} from './treeBoardStore';
export { useUIStore, useModal, useToast, useIsLoading } from './uiStore';
export { usePreferencesStore, useThemeEffect } from './preferencesStore';

import { useUIStore } from './uiStore';
import { usePreferencesStore } from './preferencesStore';
import { useTreeBoardStore } from './treeBoardStore';

// Combined selector for common patterns
export const useAppState = () => ({
  isLoading: useUIStore((s) => s.globalLoading),
  activeModal: useUIStore((s) => s.activeModal),
  theme: usePreferencesStore((s) => s.theme),
  treeId: useTreeBoardStore((s) => s.treeId),
});
