'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@/types';

interface SessionContextValue {
  session: Session | null;
  setSession: (session: Session | null) => void;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children, initialSession = null }: { children: React.ReactNode, initialSession?: Session | null }) {
  const [session, setSessionState] = useState<Session | null>(initialSession);
  const [isLoading, setIsLoading] = useState(!initialSession);

  useEffect(() => {
    if (!initialSession) {
      const s = sessionStorage.getItem('ypit_session');
      if (s) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSessionState(JSON.parse(s));
        } catch (e) {
          console.error("Failed to parse session", e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(false);
  }, [initialSession]);

  const setSession = (newSession: Session | null) => {
    if (newSession) {
      sessionStorage.setItem('ypit_session', JSON.stringify(newSession));
    } else {
      sessionStorage.removeItem('ypit_session');
    }
    setSessionState(newSession);
  };

  return (
    <SessionContext.Provider value={{ session, setSession, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
