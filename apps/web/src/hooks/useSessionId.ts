import { useSession } from '@/lib/providers/session-provider';

export const useSessionId = () => {
  const { sessionId, isLoaded } = useSession();

  return {
    sessionId,
    isLoaded,
    hasSessionId: sessionId !== null,
  };
};
