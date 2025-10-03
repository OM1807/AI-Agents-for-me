import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UserState {
  name: string | null;
  email: string | null;
  accessToken: string | null;
  isHydrated: boolean;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setAccessToken: (accessToken: string) => void;
  setHydrated: (hydrated: boolean) => void;
  resetUser: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      set => ({
        name: null,
        email: null,
        accessToken: null,
        isHydrated: false,
        setName: (name: string) => set(() => ({ name })),
        setEmail: (email: string) => set(() => ({ email })),
        setAccessToken: (accessToken: string) => set(() => ({ accessToken })),
        setHydrated: (hydrated: boolean) =>
          set(() => ({ isHydrated: hydrated })),
        resetUser: () =>
          set(() => ({ name: null, email: null, accessToken: null })),
      }),
      {
        name: 'user-storage',
        onRehydrateStorage: () => state => {
          state?.setHydrated(true);
        },
      }
    ),
    {
      name: 'user-store',
    }
  )
);
