'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createNewSessionId } from '@/lib/session';

interface SessionContextType {
  sessionId: string;
  isLoaded: boolean;
}

const SessionContext = createContext<SessionContextType>({
  sessionId: '',
  isLoaded: false,
});

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Generate a new session ID on every refresh
    const id = createNewSessionId();
    setSessionId(id);
    setIsLoaded(true);
  }, []);

  return (
    <SessionContext.Provider value={{ sessionId, isLoaded }}>
      {children}
    </SessionContext.Provider>
  );
};
