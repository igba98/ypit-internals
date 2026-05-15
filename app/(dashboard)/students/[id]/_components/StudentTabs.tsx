'use client';

import { useState } from 'react';
import { Role } from '@/types';
import { StudentDetail } from '@/lib/studentDetail';
import { cn } from '@/lib/utils';
import { User, CreditCard, FileText, Plane, File, Activity } from 'lucide-react';
import { PersonalInfoTab } from './PersonalInfoTab';
import { PaymentsTab } from './PaymentsTab';
import { ApplicationTab } from './ApplicationTab';
import { TravelTab } from './TravelTab';
import { DocumentsTab } from './DocumentsTab';
import { ActivityLogTab } from './ActivityLogTab';

interface StudentTabsProps {
  detail: StudentDetail;
  userRole: Role;
}

type TabId = 'personal' | 'payments' | 'application' | 'travel' | 'documents' | 'activity';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ElementType;
  count?: number;
  badge?: string;
  roles: readonly (Role | 'ALL')[];
}

export function StudentTabs({ detail, userRole }: StudentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('personal');

  const tabs: TabDef[] = [
    { id: 'personal', label: 'Personal Info', icon: User, roles: ['ALL'] },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      badge: detail.payment?.status === 'OVERDUE' ? 'Overdue' : detail.payment?.status === 'CLEARED' ? 'Cleared' : undefined,
      roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'FINANCE', 'MARKETING_STAFF', 'SUB_AGENT'],
    },
    {
      id: 'application',
      label: 'Application',
      icon: FileText,
      badge: detail.application?.status === 'ACCEPTED' ? 'Accepted' : undefined,
      roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'ADMISSIONS', 'MARKETING_STAFF', 'SUB_AGENT'],
    },
    {
      id: 'travel',
      label: 'Travel',
      icon: Plane,
      badge: detail.travel?.travelStatus === 'TRAVELLED' ? 'Travelled' : detail.travel?.travelStatus === 'READY' ? 'Ready' : undefined,
      roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'TRAVEL', 'MARKETING_STAFF', 'SUB_AGENT'],
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: File,
      count: detail.documents.length || undefined,
      roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'ADMISSIONS', 'TRAVEL', 'MARKETING_STAFF', 'SUB_AGENT'],
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: Activity,
      count: detail.activity.length || undefined,
      roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'OPERATIONS', 'MARKETING_STAFF', 'SUB_AGENT', 'ADMISSIONS', 'FINANCE', 'TRAVEL'],
    },
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes('ALL') || tab.roles.includes(userRole));

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="flex border-b border-gray-100 overflow-x-auto custom-scrollbar">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2',
                isActive
                  ? 'border-primary text-primary bg-primary-muted'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50',
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={cn(
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full',
                  isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600',
                )}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className={cn(
                  'inline-flex items-center px-1.5 h-5 text-[10px] font-semibold rounded-full',
                  tab.badge === 'Overdue' ? 'bg-red-100 text-red-700' :
                    tab.badge === 'Accepted' || tab.badge === 'Cleared' || tab.badge === 'Travelled' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700',
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-6 md:p-8">
        {activeTab === 'personal' && <PersonalInfoTab student={detail.student} />}
        {activeTab === 'payments' && <PaymentsTab payment={detail.payment} userRole={userRole} />}
        {activeTab === 'application' && <ApplicationTab application={detail.application} userRole={userRole} />}
        {activeTab === 'travel' && <TravelTab travel={detail.travel} userRole={userRole} />}
        {activeTab === 'documents' && <DocumentsTab documents={detail.documents} userRole={userRole} />}
        {activeTab === 'activity' && <ActivityLogTab events={detail.activity} />}
      </div>
    </div>
  );
}
