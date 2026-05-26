'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { setUniversityStatus, setPackageStatus, duplicatePackage } from '@/lib/actions/catalogActions';
import { ActionResult, CatalogStatus } from '@/types';

interface Props {
  kind: 'university' | 'package';
  id: string;
  status: CatalogStatus;
}

export function ArchiveRestoreButton({ kind, id, status }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const nextStatus: CatalogStatus = status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
  const label = nextStatus === 'ARCHIVED' ? 'Archive' : 'Restore';

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const action = kind === 'university' ? setUniversityStatus : setPackageStatus;
          const result: ActionResult = await action(id, nextStatus);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
          router.refresh();
        });
      }}
      className="text-xs font-medium text-gray-600 hover:text-gray-900"
    >
      {pending ? '…' : label}
    </button>
  );
}

export function DuplicatePackageButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await duplicatePackage(id);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
          router.refresh();
        });
      }}
      className="text-xs font-medium text-gray-600 hover:text-gray-900"
    >
      {pending ? '…' : 'Duplicate'}
    </button>
  );
}
