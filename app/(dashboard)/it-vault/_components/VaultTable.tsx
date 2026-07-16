'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Copy,
  Eye,
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  EyeOff,
} from 'lucide-react';
import { SlideInPanel } from '@/components/shared/SlideInPanel';
import { CompanyCredential, CredentialCategory } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  deleteCredential,
  revealCredential,
} from '@/lib/actions/vaultActions';
import { CredentialForm } from './CredentialForm';

const CATEGORY_BADGE: Record<CredentialCategory, string> = {
  EMAIL: 'bg-blue-50 text-blue-700',
  HOSTING: 'bg-purple-50 text-purple-700',
  DOMAIN: 'bg-indigo-50 text-indigo-700',
  SAAS: 'bg-emerald-50 text-emerald-700',
  WIFI: 'bg-amber-50 text-amber-700',
  SOCIAL_MEDIA: 'bg-pink-50 text-pink-700',
  OTHER: 'bg-gray-100 text-gray-600',
};

export function VaultTable({ items }: { items: CompanyCredential[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [editing, setEditing] = useState<CompanyCredential | null>(null);
  const [revealed, setRevealed] = useState<{ id: string; secret: string } | null>(
    null,
  );
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const onReveal = (c: CompanyCredential) => {
    if (revealed?.id === c.id) {
      setRevealed(null);
      return;
    }
    setRevealingId(c.id);
    startTransition(async () => {
      const res = await revealCredential(c.id);
      if (res.success && res.password !== undefined) {
        setRevealed({ id: c.id, secret: res.password });
      } else {
        toast.error(res.message);
      }
      setRevealingId(null);
    });
  };

  const onCopy = async (secret: string) => {
    await navigator.clipboard.writeText(secret);
    toast.success('Copied - clipboard holds it until you copy something else.');
  };

  const onDelete = (c: CompanyCredential) => {
    if (!confirm(`Delete the "${c.service}" credential? This cannot be undone.`))
      return;
    startTransition(async () => {
      const res = await deleteCredential(c.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Password</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((c) => {
              const isRevealed = revealed?.id === c.id;
              return (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{c.service}</p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${CATEGORY_BADGE[c.category]}`}
                        >
                          {c.category.replace('_', ' ')}
                        </span>
                      </div>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-primary"
                          title={c.url}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-700">
                    {c.username}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-700">
                        {isRevealed ? revealed.secret : '••••••••'}
                      </span>
                      <button
                        onClick={() => onReveal(c)}
                        disabled={busy && revealingId === c.id}
                        className="text-gray-400 hover:text-primary"
                        title={isRevealed ? 'Hide' : 'Reveal (logged)'}
                      >
                        {busy && revealingId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isRevealed ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {isRevealed && (
                        <button
                          onClick={() => onCopy(revealed.secret)}
                          className="text-gray-400 hover:text-primary"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(c.updatedAt)}
                    <p className="text-[11px] text-gray-400">
                      by {c.updatedByName ?? c.createdByName}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditing(c)}
                        className="text-gray-400 hover:text-primary p-1.5 rounded-md hover:bg-gray-100"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">
                  No credentials stored yet. Use “Add Credential” to start the
                  register.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideInPanel
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit · ${editing.service}` : 'Edit'}
        description="Leave the password blank to keep the stored secret."
      >
        {editing && (
          <CredentialForm existing={editing} onDone={() => setEditing(null)} />
        )}
      </SlideInPanel>
    </div>
  );
}
