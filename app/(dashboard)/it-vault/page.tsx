import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { pageAllowed } from '@/lib/permissions';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { backendFetch } from '@/lib/backend';
import { CompanyCredential, Session } from '@/types';
import { KeyRound, Shield, Globe, AlertTriangle } from 'lucide-react';
import { VaultTable } from './_components/VaultTable';
import { AddCredentialButton } from './_components/CredentialForm';

const ALLOWED = ['IT_ADMIN', 'MANAGING_DIRECTOR'];

async function load(): Promise<{
  items: CompanyCredential[];
  configured: boolean;
  error: string | null;
}> {
  try {
    const res = await backendFetch('/vault');
    if (!res.ok)
      return {
        items: [],
        configured: true,
        error: `Failed to load the vault (HTTP ${res.status}).`,
      };
    const body = (await res.json()) as {
      items: CompanyCredential[];
      configured: boolean;
    };
    return { items: body.items ?? [], configured: body.configured, error: null };
  } catch {
    return { items: [], configured: true, error: 'Unable to reach the backend.' };
  }
}

export default async function ItVaultPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ypit_session');
  if (!sessionCookie) redirect('/login');
  const session = JSON.parse(sessionCookie.value) as Session;
  if (!pageAllowed(session, 'vault', ALLOWED)) redirect('/dashboard');

  const { items, configured, error } = await load();
  const categories = new Set(items.map((c) => c.category)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Password Vault"
        description="Company account credentials - encrypted at rest, visible to IT and the CEO only. Every reveal is logged."
        actions={<AddCredentialButton />}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
          {error}
        </p>
      )}

      {!configured && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          The vault encryption key (<code>VAULT_ENCRYPTION_KEY</code>) is not set
          on the server - saving and revealing secrets is disabled until IT
          configures it.
        </p>
      )}

      <div className="grid grid-cols-3 gap-4">
        <KPICard label="Stored Credentials" value={items.length} icon={KeyRound} />
        <KPICard label="Categories" value={categories} icon={Globe} />
        <KPICard label="Access" value={'IT + CEO'} icon={Shield} />
      </div>

      <VaultTable items={items} />
    </div>
  );
}
