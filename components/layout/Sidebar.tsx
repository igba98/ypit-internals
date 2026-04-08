'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { clearSession } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  FileText,
  Plane,
  Activity,
  CheckSquare,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function Sidebar({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const { session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggleCollapse = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    document.cookie = `ypit_sidebar_collapsed=${newVal}; path=/; max-age=31536000`;
  };

  if (!session) return null;

  const getNavItems = () => {
    const items = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
      { label: 'Students', href: '/students', icon: Users, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'FINANCE', 'ADMISSIONS', 'TRAVEL', 'OPERATIONS'] },
      { label: 'Leads', href: '/leads', icon: UserPlus, roles: ['MARKETING_MANAGER', 'MARKETING_STAFF', 'SUB_AGENT'] },
      { label: 'Subagents', href: '/subagents', icon: Users, roles: ['MARKETING_MANAGER', 'MANAGING_DIRECTOR'] },
      { label: 'Payments', href: '/payments', icon: CreditCard, roles: ['FINANCE', 'MANAGING_DIRECTOR'] },
      { label: 'Applications', href: '/applications', icon: FileText, roles: ['ADMISSIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Travel', href: '/travel', icon: Plane, roles: ['TRAVEL', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Monitoring', href: '/monitoring', icon: Activity, roles: ['OPERATIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['ALL'] },
      { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'FINANCE', 'ADMISSIONS', 'TRAVEL', 'OPERATIONS'] },
      { label: 'Staff', href: '/staff', icon: Users, roles: ['IT_ADMIN', 'MANAGING_DIRECTOR'] },
      { label: 'Audit Logs', href: '/audit', icon: Shield, roles: ['IT_ADMIN', 'MANAGING_DIRECTOR'] },
    ];

    return items.filter(item => item.roles.includes('ALL') || item.roles.includes(session.role));
  };

  const navItems = getNavItems();

  return (
    <div className={cn(
      "hidden lg:flex flex-col h-full bg-brand-black text-white transition-all duration-300",
      collapsed ? "w-[72px]" : "w-[260px]"
    )}>
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        {!collapsed && (
          <div className="flex flex-col">
            <div className="font-urbanist font-bold text-xl flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white text-sm">Y</div>
              YPIT
            </div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Fulfill Your Joy</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold mx-auto">Y</div>
        )}
      </div>

      <div className="p-4 border-b border-gray-800">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
          <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0">
            {session.avatar ? (
              <img src={session.avatar} alt={session.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">{session.fullName.charAt(0)}</div>
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{session.fullName}</span>
              <RoleBadge role={session.role} className="mt-1 scale-90 origin-left" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 py-4">
        {!collapsed && <div className="px-4 text-[10px] uppercase tracking-widest text-gray-500 mb-2">Main Menu</div>}
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white",
                  collapsed ? "justify-center" : ""
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="text-sm font-urbanist">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="my-4 border-t border-gray-800 mx-4" />
        
        {!collapsed && <div className="px-4 text-[10px] uppercase tracking-widest text-gray-500 mb-2">Settings</div>}
        <nav className="px-2 space-y-1">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              pathname.startsWith('/settings') ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white",
              collapsed ? "justify-center" : ""
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="text-sm font-urbanist">Settings</span>}
          </Link>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={clearSession}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full text-gray-400 hover:bg-gray-800 hover:text-white",
            collapsed ? "justify-center" : ""
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span className="text-sm font-urbanist">Logout</span>}
        </button>
      </div>
    </div>
  );
}
