import { useSession as useSessionContext } from '@/contexts/SessionContext';

export function useSession() {
  return useSessionContext();
}
