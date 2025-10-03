'use client';

import { SessionProvider } from './session-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    // Add other providers here
    <SessionProvider>{children}</SessionProvider>
  );
};
