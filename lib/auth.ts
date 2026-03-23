import { Session, User, Role, ROLES } from '@/types';

export function getSession(): Session | null {
  if (typeof window !== 'undefined') {
    const s = sessionStorage.getItem('ypit_session');
    if (s) return JSON.parse(s);
  }
  return null;
}

export function setSession(user: User): void {
  const session: Session = {
    userId: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    department: user.department,
    avatar: user.avatar,
  };
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('ypit_session', JSON.stringify(session));
    document.cookie = `ypit_session=${JSON.stringify(session)}; path=/; max-age=86400`;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('ypit_session');
    document.cookie = 'ypit_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  }
}

export function hasRole(session: Session | null, roles: Role[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

export function hasAnyRole(session: Session | null, ...roles: Role[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

export function getRedirectPath(role: Role): string {
  return '/dashboard';
}
