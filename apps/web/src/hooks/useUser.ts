import { useUserStore } from '@/store/user';

/**
 * Custom hook for managing user information
 *
 */
export const useUser = () => {
  const {
    name,
    email,
    accessToken,
    isHydrated,
    setName,
    setEmail,
    setAccessToken,
    setHydrated,
    resetUser,
  } = useUserStore();

  return {
    name,
    email,
    accessToken,
    isHydrated,
    setName,
    setEmail,
    setAccessToken,
    setHydrated,
    resetUser,
  };
};
