'use client';

import { useState } from 'react';
import { Student, Role } from '@/types';
import { cn } from '@/lib/utils';
import { User, CreditCard, FileText, Plane, File, Activity } from 'lucide-react';

interface StudentTabsProps {
  student: Student;
  userRole: Role;
}

export function StudentTabs({ student, userRole }: StudentTabsProps) {
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User, roles: ['ALL'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'FINANCE'] },
    { id: 'application', label: 'Application', icon: FileText, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'ADMISSIONS'] },
    { id: 'travel', label: 'Travel', icon: Plane, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'TRAVEL'] },
    { id: 'documents', label: 'Documents', icon: File, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'ADMISSIONS'] },
    { id: 'activity', label: 'Activity Log', icon: Activity, roles: ['MANAGING_DIRECTOR', 'MARKETING_MANAGER', 'OPERATIONS'] },
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes('ALL') || tab.roles.includes(userRole));

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="flex border-b border-gray-100 overflow-x-auto custom-scrollbar">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
              activeTab === tab.id 
                ? "border-primary text-primary bg-primary-muted" 
                : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="p-6">
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
              <p className="text-gray-900">{student.fullName}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Registration Number</h3>
              <p className="text-gray-900">{student.registrationNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
              <p className="text-gray-900">{student.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
              <p className="text-gray-900">{student.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
              <p className="text-gray-900">{student.dateOfBirth} ({student.age} years)</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Nationality</h3>
              <p className="text-gray-900">{student.nationality}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Target University</h3>
              <p className="text-gray-900">{student.targetUniversity}, {student.targetCountry}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Target Program</h3>
              <p className="text-gray-900">{student.targetProgram} ({student.targetIntake})</p>
            </div>
          </div>
        )}
        
        {activeTab === 'payments' && (
          <div className="text-center py-12 text-gray-500">
            Payment records will be displayed here.
          </div>
        )}
        
        {activeTab === 'application' && (
          <div className="text-center py-12 text-gray-500">
            Application details will be displayed here.
          </div>
        )}
        
        {activeTab === 'travel' && (
          <div className="text-center py-12 text-gray-500">
            Travel details will be displayed here.
          </div>
        )}
        
        {activeTab === 'documents' && (
          <div className="text-center py-12 text-gray-500">
            Documents will be displayed here.
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="text-center py-12 text-gray-500">
            Activity log will be displayed here.
          </div>
        )}
      </div>
    </div>
  );
}
