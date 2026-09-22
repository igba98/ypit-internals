'use client';

import { useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import { toast } from 'sonner';

const WEBSITE = (process.env.NEXT_PUBLIC_WEBSITE_URL ?? 'https://www.ypitconsultancies.com').replace(/\/$/, '');

/** Sub-agent's code + the website application link that pre-fills it. */
export function agentApplyUrl(code: string): string {
  return `${WEBSITE}/apply?agent=${encodeURIComponent(code)}`;
}

export function AgentLink({ code, compact = false }: { code?: string | null; compact?: boolean }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  if (!code) return <span className="text-xs text-gray-400">No code</span>;
  const copy = async (what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(what === 'code' ? code : agentApplyUrl(code));
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('Unable to copy.');
    }
  };
  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'flex-wrap'}`}>
      <button onClick={() => copy('code')} title="Copy agent code" className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-900 text-white font-mono text-xs tracking-wider hover:bg-gray-700">
        {code} {copied === 'code' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-60" />}
      </button>
      <button onClick={() => copy('link')} title={agentApplyUrl(code)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
        {copied === 'link' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
        {copied === 'link' ? 'Copied' : 'Application link'}
      </button>
    </div>
  );
}
