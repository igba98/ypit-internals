'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { Avatar } from '@/components/shared/Avatar';
import { clearSession } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  Wallet,
  FileText,
  Plane,
  Activity,
  CheckSquare,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Laptop,
  FileSignature,
  Inbox,
  MessageSquare,
  GraduationCap,
  Gauge,
  KeyRound,
  Globe,
  ScrollText,
  Briefcase,
  School,
  Building2,
  Landmark,
  ListChecks,
  Boxes,
  FolderLock,
  HandCoins,
  FileCheck2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULES, isAssistant } from '@/lib/permissions';
import { useState, useEffect } from 'react';

const MODULE_ICONS: Record<string, typeof LayoutDashboard> = {
  students: Users,
  leads: UserPlus,
  enquiries: Inbox,
  communication: MessageSquare,
  'business-dev': Briefcase,
  subagents: Users,
  partners: School,
  mous: ScrollText,
  applications: FileText,
  travel: Plane,
  monitoring: Activity,
  tasks: CheckSquare,
  reports: BarChart3,
  staff: Users,
  equipment: Laptop,
  website: Globe,
  vault: KeyRound,
  audit: Shield,
  catalog: Landmark,
  letters: FileSignature,
  finance: Wallet,
  documents: FileCheck2,
  commissions: HandCoins,
  assets: Boxes,
  records: FolderLock,
};

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
    // Assistants / interns: the menu IS their permission matrix — a module
    // appears only when their manager granted at least View.
    if (isAssistant(session.role)) {
      const granted = session.permissions ?? {};
      const items: { label: string; href: string; icon: typeof LayoutDashboard }[] = [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ];
      for (const m of MODULES) {
        if (!granted[m.key]) continue;
        for (const h of m.hrefs) {
          items.push({ label: h.label, href: h.href, icon: MODULE_ICONS[m.key] ?? LayoutDashboard });
        }
      }
      return items;
    }

    // Relations Officer interface (system updates 2.0 §2-3). Each RO works
    // their own book; Travel was folded in, so the travel desk gets it too.
    if (session.role === 'MARKETING_STAFF' || session.role === 'TRAVEL') {
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Leads', href: '/student-leads', icon: GraduationCap },
        { label: 'My Students', href: '/students', icon: Users },
        { label: 'Follow-ups', href: '/follow-ups', icon: ListChecks },
        { label: 'Passport & Visa', href: '/travel', icon: Plane },
        ...(session.role === 'MARKETING_STAFF'
          ? [
              { label: 'Website Enquiries', href: '/enquiries', icon: Inbox },
              { label: 'Communication', href: '/communication', icon: MessageSquare },
            ]
          : [{ label: 'Applications', href: '/applications', icon: FileText }]),
        { label: 'My Performance', href: '/leads', icon: Gauge },
        { label: 'Tasks', href: '/tasks', icon: CheckSquare },
        { label: 'Reports', href: '/reports', icon: BarChart3 },
        { label: 'My Assistants', href: '/staff', icon: UserPlus },
      ];
    }

    // Administrator (formerly Operations) - company assets and records.
    if (session.role === 'OPERATIONS') {
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Company Assets', href: '/assets', icon: Boxes },
        { label: 'Company Records', href: '/records', icon: FolderLock },
        { label: 'IT Equipment', href: '/equipment', icon: Laptop },
        { label: 'Monitoring', href: '/monitoring', icon: Activity },
        { label: 'Tasks', href: '/tasks', icon: CheckSquare },
        { label: 'Reports', href: '/reports', icon: BarChart3 },
        { label: 'My Assistants', href: '/staff', icon: UserPlus },
      ];
    }

    // Business team: a separate interface from the RO one.
    if (session.role === 'BUSINESS_DEVELOPMENT') {
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Business Dev', href: '/business-development', icon: Briefcase },
        { label: 'Subagents', href: '/subagents', icon: Users },
        { label: 'Universities', href: '/universities', icon: Landmark },
        { label: 'Commissions', href: '/commissions', icon: HandCoins },
        { label: 'Schools & Contracts', href: '/schools', icon: School },
        { label: 'Company Collaborations', href: '/companies', icon: Building2 },
        { label: 'MOUs', href: '/mous', icon: ScrollText },
        { label: 'Tasks', href: '/tasks', icon: CheckSquare },
        { label: 'Reports', href: '/reports', icon: BarChart3 },
        { label: 'My Assistants', href: '/staff', icon: UserPlus },
      ];
    }

    // FINANCE role gets a focused sidebar: just the things relevant to them.
    if (session.role === 'FINANCE') {
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Students', href: '/students', icon: Users },
        { label: 'Finance Hub', href: '/finance', icon: Wallet },
        { label: 'Student Payments', href: '/payments', icon: CreditCard },
        { label: 'Commissions', href: '/commissions', icon: HandCoins },
        { label: 'MOUs', href: '/mous', icon: ScrollText },
        { label: 'Tasks', href: '/tasks', icon: CheckSquare },
        { label: 'Reports', href: '/reports', icon: BarChart3 },
        { label: 'My Assistants', href: '/staff', icon: UserPlus },
      ];
    }

    const items = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
      { label: 'Students', href: '/students', icon: Users, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'ADMISSIONS'] },
      { label: 'Student Leads', href: '/student-leads', icon: GraduationCap, roles: ['SUB_AGENT', 'MARKETING_MANAGER', 'MANAGING_DIRECTOR', 'IT_ADMIN'] },
      { label: 'RO Performance', href: '/leads', icon: Gauge, roles: ['MARKETING_MANAGER', 'SUB_AGENT', 'IT_ADMIN', 'MANAGING_DIRECTOR'] },
      { label: 'Enquiries', href: '/enquiries', icon: Inbox, roles: ['MARKETING_MANAGER', 'IT_ADMIN'] },
      { label: 'Communication', href: '/communication', icon: MessageSquare, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Business Dev', href: '/business-development', icon: Briefcase, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Schools & Contracts', href: '/schools', icon: School, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Universities', href: '/universities', icon: Landmark, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Commissions', href: '/commissions', icon: HandCoins, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Company Collaborations', href: '/companies', icon: Building2, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Subagents', href: '/subagents', icon: Users, roles: ['MARKETING_MANAGER', 'MANAGING_DIRECTOR'] },
      { label: 'Finance', href: '/finance', icon: Wallet, roles: ['MANAGING_DIRECTOR'] },
      { label: 'Payments', href: '/payments', icon: CreditCard, roles: ['MANAGING_DIRECTOR'] },
      { label: 'MOUs', href: '/mous', icon: ScrollText, roles: ['MANAGING_DIRECTOR'] },
      { label: 'Applications', href: '/applications', icon: FileText, roles: ['ADMISSIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Student Documents', href: '/documents', icon: FileCheck2, roles: ['ADMISSIONS', 'MANAGING_DIRECTOR'] },
      { label: 'Admission Letters', href: '/admission-letters', icon: FileSignature, roles: ['ADMISSIONS', 'MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Travel', href: '/travel', icon: Plane, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Monitoring', href: '/monitoring', icon: Activity, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Follow-ups', href: '/follow-ups', icon: ListChecks, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'ADMISSIONS'] },
      { label: 'Pipeline Health', href: '/pipeline-health', icon: Gauge, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER'] },
      { label: 'Company Assets', href: '/assets', icon: Boxes, roles: ['MANAGING_DIRECTOR', 'IT_ADMIN'] },
      { label: 'Company Records', href: '/records', icon: FolderLock, roles: ['MANAGING_DIRECTOR'] },
      { label: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['ALL'] },
      { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['ALL'] },
      { label: 'Staff', href: '/staff', icon: Users, roles: ['IT_ADMIN', 'MANAGING_DIRECTOR'] },
      { label: 'My Assistants', href: '/staff', icon: UserPlus, roles: ['MARKETING_MANAGER', 'ADMISSIONS'] },
      { label: 'Equipment', href: '/equipment', icon: Laptop, roles: ['IT_ADMIN', 'MANAGING_DIRECTOR'] },
      { label: 'Password Vault', href: '/it-vault', icon: KeyRound, roles: ['IT_ADMIN', 'MANAGING_DIRECTOR'] },
      { label: 'Website Content', href: '/website-cms', icon: Globe, roles: ['IT_ADMIN', 'MANAGING_DIRECTOR'] },
      { label: 'Audit Logs', href: '/audit-logs', icon: Shield, roles: ['IT_ADMIN', 'MANAGING_DIRECTOR'] },
    ];

    return items.filter(item => item.roles.includes('ALL') || item.roles.includes(session.role));
  };

  const navItems = getNavItems();

  return (
    <div className={cn(
      "hidden lg:flex flex-col h-full overflow-hidden bg-brand-black text-white transition-all duration-300 shrink-0",
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
          <Avatar name={session.fullName} size="lg" className="w-10 h-10" />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{session.fullName}</span>
              <RoleBadge role={session.role} className="mt-1 scale-90 origin-left" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-4">
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

      <div className="p-4 border-t border-gray-800 shrink-0">
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
