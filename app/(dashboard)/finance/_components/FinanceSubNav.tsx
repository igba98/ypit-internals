'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FileText, Wallet, Users, Receipt, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Overview', href: '/finance', icon: LayoutGrid, exact: true },
  { label: 'Petty Cash', href: '/finance/petty-cash', icon: Wallet },
  { label: 'Invoices', href: '/finance/invoices', icon: FileText },
  { label: 'Payroll', href: '/finance/payroll', icon: Users },
  { label: 'Expenses', href: '/finance/expenses', icon: Receipt },
  { label: 'Student Payments', href: '/payments', icon: CreditCard, external: true },
];

export function FinanceSubNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white rounded-xl shadow-card border border-gray-100 p-1.5 flex items-center gap-1 overflow-x-auto custom-scrollbar">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap shrink-0',
              active
                ? 'bg-primary text-white shadow-primary-glow'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {tab.external && (
              <span className="text-[9px] uppercase tracking-wider opacity-70 ml-1">↗</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
