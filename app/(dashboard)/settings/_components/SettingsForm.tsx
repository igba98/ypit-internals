'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

export function SettingsForm() {
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
        {activeTab === 'profile' && (
          <form className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                <img src="https://i.pravatar.cc/150?u=current_user" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button type="button" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Change Avatar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" defaultValue="Admin User" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" defaultValue="admin@ypit.com" disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" placeholder="+1 (555) 000-0000" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Department</label>
                <input type="text" defaultValue="Management" disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="button" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="button" className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                <Save className="w-4 h-4" />
                Update Password
              </button>
            </div>
          </form>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">New Task Assigned</p>
                  <p className="text-sm text-gray-500">Receive an email when a task is assigned to you.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Lead Status Changes</p>
                  <p className="text-sm text-gray-500">Receive an email when a lead you manage changes status.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Daily Digest</p>
                  <p className="text-sm text-gray-500">Receive a daily summary of activities and pending tasks.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
