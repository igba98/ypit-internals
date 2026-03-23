import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/contexts/SessionContext';
import { Toaster } from 'sonner';
import { cookies } from 'next/headers';

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
});

export const metadata: Metadata = {
  title: 'YPIT Consultancies Internal Operations System',
  description: 'A comprehensive, role-based internal office management system for YPIT Consultancies.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  let initialSession = null;
  if (sessionCookie) {
    try {
      initialSession = JSON.parse(sessionCookie.value);
    } catch (e) {}
  }

  return (
    <html lang="en" className={urbanist.variable}>
      <body suppressHydrationWarning>
        <SessionProvider initialSession={initialSession}>
          {children}
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
