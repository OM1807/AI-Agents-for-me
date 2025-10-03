import { useHeaderStore } from '@/store/header';

/**
 * Custom hook for managing header title
 *
 */
export const useHeader = () => {
  const {
    title,
    setTitle,
    resetTitle,
    isCollapsed,
    setIsCollapsed,
    resetIsCollapsed,
    resetAll,
  } = useHeaderStore();

  return {
    title,
    setTitle,
    resetTitle,
    isCollapsed,
    setIsCollapsed,
    resetIsCollapsed,
    resetAll,
  };
};
