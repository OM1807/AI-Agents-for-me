'use client';

import { useEffect, useState, type ReactNode, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

interface AuthGuardProps {
  readonly children: ReactNode;
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

const LoadingSpinner = () => (
  <div
    className='flex h-screen w-full items-center justify-center'
    role='status'
    aria-label='Loading authentication...'
  >
    <div
      className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600'
      aria-hidden='true'
    />
    <span className='sr-only'>Loading authentication...</span>
  </div>
);

export const AuthGuard = memo<AuthGuardProps>(({ children }) => {
  const router = useRouter();
  const { accessToken, isHydrated } = useUser();
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    const checkAuth = (): void => {
      // Wait for store hydration before checking auth
      if (!isHydrated) {
        setAuthState('loading');
        return;
      }

      try {
        if (!accessToken?.trim()) {
          setAuthState('unauthenticated');
          router.push('/login');
          return;
        }

        setAuthState('authenticated');
      } catch (error) {
        console.error('Authentication check failed:', error);
        setAuthState('unauthenticated');
        router.push('/login');
      }
    };

    checkAuth();
  }, [accessToken, isHydrated, router]);

  if (authState === 'loading') {
    return <LoadingSpinner />;
  }

  if (authState === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
});

AuthGuard.displayName = 'AuthGuard';
