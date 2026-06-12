'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/shared/Avatar';
import { Session } from '@/types';
import { changePassword, updateProfile } from '@/lib/actions/settingsActions';

export function SettingsForm({ session }: { session: Session }) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="flex border-b border-gray-100">
        <button
          className={`px-6 py-4 text-sm font-medium ${activeTab === 'profile' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}
          onClick={() => setActiveTab('profile')}
        >
          My Profile
        </button>
        <button
          className={`px-6 py-4 text-sm font-medium ${activeTab === 'security' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`px-6 py-4 text-sm font-medium ${activeTab === 'notifications' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-900'}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'profile' && <ProfileTab session={session} />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
}

function ProfileTab({ session }: { session: Session }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      router.refresh();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-6">
        <Avatar name={session.fullName} size="xl" className="w-20 h-20 text-2xl" />
        <p className="text-xs text-gray-500">
          Your avatar shows your initials, consistent across the whole system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={session.fullName}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {errors.fullName && <p className="text-xs text-red-600">{errors.fullName[0]}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            defaultValue={session.email}
            disabled
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+255 759 512 804"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone[0]}</p>}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Department</label>
          <input
            type="text"
            defaultValue={session.department}
            disabled
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

function SecurityTab() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(changePassword, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">Current Password</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
        <p className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3">
          Per-user notification preferences are coming with the in-app notification
          centre. Today, system emails (welcome credentials, pre-admission notices)
          and WhatsApp/SMS pipeline updates are always delivered.
        </p>
      </div>
    </div>
  );
}
