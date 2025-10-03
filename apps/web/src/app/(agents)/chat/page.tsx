'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

import { Chat } from '@/components/features/chat';
import { useAgentSession } from '@/hooks/useAgentSession';

export default function ChatPage() {
  const { createSession, isCreatingSession } = useAgentSession();

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize session on page load
  useEffect(() => {
    const initializeSession = async () => {
      const newSessionId = await createSession();
      if (newSessionId) {
        setSessionId(newSessionId);
      }
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Common function for session regeneration
  const generateSession = useCallback(async () => {
    setSessionId(null); // Clear current session to show loading

    const newSessionId = await createSession();
    if (newSessionId) {
      setSessionId(newSessionId);
    }
  }, [createSession]);

  // Handle session regeneration
  const handleRegenerate = async () => {
    await generateSession();
  };

  // Show loading state while creating session or no session
  if (isCreatingSession || !sessionId) {
    return (
      <div className='flex h-[calc(100vh-120px)] w-full gap-4 p-4'>
        <div className='w-3/4'>
          <Skeleton className='h-full w-full rounded-xl' />
        </div>
        <div className='w-1/4'>
          <Skeleton className='h-full w-full rounded-xl' />
        </div>
      </div>
    );
  }

  return <Chat sessionID={sessionId} regenerate={handleRegenerate} />;
}
