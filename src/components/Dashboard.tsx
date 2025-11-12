import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, Users, Pill, Bell, Calendar, ArrowLeft, FileText } from 'lucide-react';
import PatientsTab from './dashboard/PatientsTab';
import MedicationTab from './dashboard/MedicationTab';
import RemindersTab from './dashboard/RemindersTab';
import AppointmentsTab from './dashboard/AppointmentsTab';
import MedicalReportsTab from './dashboard/MedicalReportsTab';

type Tab = 'patients' | 'medication' | 'reminders' | 'appointments' | 'medical-reports';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('patients');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth error:', error);
        window.location.href = '/';
        return;
      }
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  const go = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const tabs = [
    { id: 'patients' as Tab, label: 'Patients', icon: Users, color: 'text-blue-600' },
    { id: 'medication' as Tab, label: 'Medication', icon: Pill, color: 'text-green-600' },
    { id: 'reminders' as Tab, label: 'Reminders', icon: Bell, color: 'text-yellow-600' },
    { id: 'appointments' as Tab, label: 'Appointments', icon: Calendar, color: 'text-purple-600' },
    { id: 'medical-reports' as Tab, label: 'Medical Reports', icon: FileText, color: 'text-teal-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Please sign in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => go('/')}
            className="text-left"
            aria-label="Back to Home"
            title="Back to Home"
          >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white hover:underline">
              EchoCare Caregiver Console
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
          </button>

          <div className="flex items-center gap-2">
            {/* Back to Home */}
            <button
              onClick={() => go('/')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-8 overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full sm:flex-1 flex items-center justify-center gap-3 px-5 py-3 text-sm font-medium transition-colors min-h-[44px] border-b-2 ${
                  activeTab === tab.id
                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          {activeTab === 'patients' && <PatientsTab user={user} />}
          {activeTab === 'medication' && <MedicationTab user={user} />}
          {activeTab === 'reminders' && <RemindersTab user={user} />}
          {activeTab === 'appointments' && <AppointmentsTab user={user} />}
          {activeTab === 'medical-reports' && <MedicalReportsTab user={user} />}
        </div>
      </div>
    </div>
  );
}
