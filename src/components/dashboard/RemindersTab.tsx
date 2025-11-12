import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { WebhookService } from '../../lib/webhook';
import { Plus, Check, AlertCircle } from 'lucide-react';

interface RemindersTabProps {
  user: any;
}

interface CareRecipient {
  id: string;
  full_name: string;
}

export default function RemindersTab({ user }: RemindersTabProps) {
  const [patients, setPatients] = useState<CareRecipient[]>([]);
  const [form, setForm] = useState({
    patient_id: '',
    title: '',
    description: '',
    frequency_unit: 'daily',
    frequency_value: 1,
    start_datetime: '',
    end_datetime: '',
    repeat_count: 0,
    notify_channel: 'call',
    remind_2days: false,
    remind_1hour: false,
    notify_sms: false,
    notify_call: false,
    notify_whatsapp: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('care_recipients')
      .select('id, full_name')
      .eq('owner_id', user.id)
      .order('full_name');

    if (error) {
      console.error('Error fetching patients:', error);
    } else {
      setPatients(data || []);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name } = target as any;
    if ((target as HTMLInputElement).type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      setForm(prev => ({ ...prev, [name]: checkbox.checked }));
      return;
    }
    const value = (target as any).value;
    if (name === 'frequency_value' || name === 'repeat_count') {
      setForm(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!form.patient_id || form.title === '') {
    setMessage({ type: 'error', text: 'Patient and title are required' });
    return;
  }

  setSubmitting(true);
  setMessage(null);

  supabase
    .from('general_reminders')
    .insert([
      {
        patient_id: form.patient_id,
        title: form.title,
        description: form.description,
        frequency_unit: form.frequency_unit,
        frequency_value: form.frequency_value,
        start_datetime: form.start_datetime || null,
        end_datetime: form.end_datetime || null,
        repeat_count: form.repeat_count,
        notify_channel: form.notify_channel,
        notify_sms: form.notify_sms,
        notify_call: form.notify_call,
        notify_whatsapp: form.notify_whatsapp,
        remind_2days: form.remind_2days,
        remind_1hour: form.remind_1hour,
        created_by: user.id,
      },
    ])
    .then((response) => {
      if (response.error) {
        setMessage({ type: 'error', text: response.error.message });
      } else {
        setMessage({ type: 'success', text: 'Reminder added successfully!' });
        
        // Send webhook notification
        WebhookService.sendReminderCreated({
          patient_id: form.patient_id,
          title: form.title,
          description: form.description,
          frequency_unit: form.frequency_unit,
          frequency_value: form.frequency_value,
          start_datetime: form.start_datetime,
          end_datetime: form.end_datetime,
          repeat_count: form.repeat_count,
          notify_channel: form.notify_channel,
          notify_sms: form.notify_sms,
          notify_call: form.notify_call,
          notify_whatsapp: form.notify_whatsapp,
          remind_2days: form.remind_2days,
          remind_1hour: form.remind_1hour,
          created_by: user.id,
        }, user.id);
        
        // Refresh patient data in PatientsTab if needed
        window.dispatchEvent(new CustomEvent('reminderAdded', { 
          detail: { patientId: form.patient_id } 
        }));
        
        setForm({
          patient_id: '',
          title: '',
          description: '',
          frequency_unit: 'daily',
          frequency_value: 1,
          start_datetime: '',
          end_datetime: '',
          repeat_count: 0,
          notify_channel: 'call',
          remind_2days: false,
          remind_1hour: false,
          notify_sms: false,
          notify_call: false,
          notify_whatsapp: false,
        });
      }
      setSubmitting(false);
    });
}




  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Plus className="w-6 h-6 text-yellow-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Reminder</h2>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Patient *
            </label>
            <select
              name="patient_id"
              value={form.patient_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            >
              <option value="">Select a patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>{patient.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
              placeholder="Enter reminder title"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            placeholder="Enter reminder description"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              name="start_datetime"
              value={form.start_datetime}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              name="end_datetime"
              value={form.end_datetime}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            />
          </div>
        </div>

        {/* Advance Reminder Toggles */}
        {/* Reminder Activation (grouped) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reminder Activation
          </label>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
              <label htmlFor="remind_2days" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Activate 2 days advance reminder
              </label>
              <input
                id="remind_2days"
                name="remind_2days"
                type="checkbox"
                checked={form.remind_2days}
                onChange={handleChange}
                className="h-5 w-5 accent-teal-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
              <label htmlFor="remind_1hour" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Activate 1 hour advance reminder
              </label>
              <input
                id="remind_1hour"
                name="remind_1hour"
                type="checkbox"
                checked={form.remind_1hour}
                onChange={handleChange}
                className="h-5 w-5 accent-teal-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
              <label htmlFor="notify_sms" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                SMS
              </label>
              <input
                id="notify_sms"
                name="notify_sms"
                type="checkbox"
                checked={form.notify_sms}
                onChange={handleChange}
                className="h-5 w-5 accent-teal-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
              <label htmlFor="notify_whatsapp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Whats-App
              </label>
              <input
                id="notify_whatsapp"
                name="notify_whatsapp"
                type="checkbox"
                checked={form.notify_whatsapp}
                onChange={handleChange}
                className="h-5 w-5 accent-teal-600"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !form.patient_id || !form.title.trim()}
          className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium transition-colors min-h-[44px]"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Adding Reminder...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </>
          )}
        </button>
      </form>
    </div>
  );
}
