'use client';

import { useSession } from '@/hooks/useSession';
import { Bell, Search, Menu, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { clearSession } from '@/lib/auth';
import { useState } from 'react';

export function Topbar() {
  const { session } = useSession();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getBreadcrumb = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Dashboard';
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ');
  };

  if (!session) return null;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-gray-500 hover:text-gray-900">
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-sm font-medium text-gray-500 hidden sm:block">
          {getBreadcrumb()}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-400 hover:bg-gray-100 transition-colors w-64">
          <Search className="w-4 h-4" />
          <span>Search students, leads...</span>
          <span className="ml-auto text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white">⌘K</span>
        </button>

        <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 p-1 pr-2 rounded-full transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
              {session.avatar ? (
                <img src={session.avatar} alt={session.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">{session.fullName.charAt(0)}</div>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{session.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{session.email}</p>
              </div>
              <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Settings</a>
              <button 
                onClick={clearSession}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
