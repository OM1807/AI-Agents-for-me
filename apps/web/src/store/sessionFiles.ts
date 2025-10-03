import { create } from 'zustand';

interface SessionFilesState {
  prdfiles: {
    files: Array<{ name: string; uploadedAt: string }>;
    selectedFiles: string[];
  };
  docsfiles: {
    files: Array<{ name: string; uploadedAt: string }>;
    selectedFiles: string[];
  };
  userFilesConnection: {
    isConnected: boolean;
  };
  setPrdfiles: (prdfiles: {
    files: Array<{ name: string; uploadedAt: string }>;
    selectedFiles: string[];
  }) => void;
  setDocsfiles: (docsfiles: {
    files: Array<{ name: string; uploadedAt: string }>;
    selectedFiles: string[];
  }) => void;
  setUserFilesConnection: (connection: { isConnected: boolean }) => void;
  resetPrdfiles: () => void;
  resetDocsfiles: () => void;
  resetUserFilesConnection: () => void;
  resetAll: () => void;
}

// Initial state for session files
const initialState = {
  prdfiles: { files: [], selectedFiles: [] },
  docsfiles: { files: [], selectedFiles: [] },
  userFilesConnection: { isConnected: false },
};

// Non-persistent store for session-only files
export const useSessionFilesStore = create<SessionFilesState>(set => ({
  ...initialState,
  setPrdfiles: prdfiles => set(() => ({ prdfiles })),
  setDocsfiles: docsfiles => set(() => ({ docsfiles })),
  setUserFilesConnection: connection =>
    set(() => ({ userFilesConnection: connection })),
  resetPrdfiles: () => set(() => ({ prdfiles: initialState.prdfiles })),
  resetDocsfiles: () => set(() => ({ docsfiles: initialState.docsfiles })),
  resetUserFilesConnection: () =>
    set(() => ({ userFilesConnection: initialState.userFilesConnection })),
  resetAll: () => set(() => ({ ...initialState })),
}));
