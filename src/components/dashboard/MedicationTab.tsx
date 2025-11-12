import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { WebhookService } from '../../lib/webhook';
import { Plus, Check, AlertCircle } from 'lucide-react';

interface MedicationTabProps {
  user: any;
}

interface CareRecipient {
  id: string;
  full_name: string;
}

export default function MedicationTab({ user }: MedicationTabProps) {
  const [patients, setPatients] = useState<CareRecipient[]>([]);
  const [form, setForm] = useState({
    patient_id: '',
    medicine_name: '',
    dosage: '',
    form: 'tablet',
    frequency_unit: 'daily',
    frequency_value: 1,
    times_per_day: 1,
    dose_times: [''],
    food_timing: 'no_pref',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
    remind_weekly: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Summary modal state
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string>('');

  useEffect(() => {
    fetchPatients();
  }, [user]);

  useEffect(() => {
    // Update dose_times array when times_per_day changes
    const newDoseTimes = Array(form.times_per_day).fill('').map((_, i) => form.dose_times[i] || '');
    setForm(prev => ({ ...prev, dose_times: newDoseTimes }));
  }, [form.times_per_day]);

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
    if (name === 'times_per_day') {
      setForm(prev => ({ ...prev, [name]: parseInt(value) }));
    } else if (name === 'frequency_value') {
      setForm(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDoseTimeChange = (index: number, value: string) => {
    const newDoseTimes = [...form.dose_times];
    newDoseTimes[index] = value;
    setForm(prev => ({ ...prev, dose_times: newDoseTimes }));
  };

  // Request medication summary from n8n webhook
  const handleSummaryRequest = async () => {
    setSummaryError(null);
    setSummaryText('');

    if (!form.medicine_name.trim()) {
      setSummaryError('Please enter a medicine name first.');
      setSummaryOpen(true);
      return;
    }

    const payload = {
      medicine_name: form.medicine_name,
      dosage: form.dosage,
      frequency_unit: form.frequency_unit,
      frequency_value: form.frequency_value,
      times_per_day: form.times_per_day,
    };

    const url = import.meta.env.VITE_N8N_MED_SUMMARY_WEBHOOK_URL as string | undefined;
    
    // Debug logging (remove in production if needed)
    console.log('Summary webhook URL check:', {
      hasUrl: !!url,
      urlLength: url?.length,
      envKeys: Object.keys(import.meta.env).filter(k => k.includes('WEBHOOK') || k.includes('N8N')),
    });
    
    if (!url) {
      setSummaryError('Summary webhook URL is not configured. Please check Vercel environment variables.');
      setSummaryOpen(true);
      return;
    }

    try {
      setSummaryLoading(true);
      setSummaryOpen(true);

      console.log('Sending summary request to:', url);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          event: 'medication.summary.request',
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });

      console.log('Summary response status:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('Summary request failed:', res.status, errorText);
        setSummaryError(`Summary request failed: ${res.status} ${res.statusText}. ${errorText.substring(0, 100)}`);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setSummaryText(json.summary || JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setSummaryText(text);
      }
    } catch (_err) {
      setSummaryError('Network error while requesting summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.patient_id || !form.medicine_name.trim()) {
    setMessage({ type: 'error', text: 'Patient and medicine names are required' });
    return;
  }

  setSubmitting(true);
  setMessage(null);

  try {
    const insertPayload = {
      ...form,
      dose_times: JSON.stringify(form.dose_times.filter((time) => time.trim())),
      created_by: user.id,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };

    const response = await supabase.from('medication_plans').insert({
      ...insertPayload,
      remind_weekly: form.remind_weekly,
    });

    if (response.error) {
      setMessage({ type: 'error', text: response.error.message });
    } else {
      setMessage({ type: 'success', text: 'Medication plan added successfully!' });
      
      // Send webhook notification
      WebhookService.sendMedicationCreated({
        ...insertPayload,
        dose_times: form.dose_times.filter((time) => time.trim()),
        remind_weekly: form.remind_weekly,
      }, user.id);
      
      // Refresh patient data in PatientsTab if needed
      window.dispatchEvent(new CustomEvent('medicationAdded', { 
        detail: { patientId: form.patient_id } 
      }));
      
      setForm({
        patient_id: '',
        medicine_name: '',
        dosage: '',
        form: 'tablet',
        frequency_unit: 'daily',
        frequency_value: 1,
        times_per_day: 1,
        dose_times: [''],
        food_timing: 'no_pref',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: '',
        remind_weekly: false
      });
    }
  } catch (error) {
    setMessage({ type: 'error', text: 'Something went wrong while saving the medication plan' });
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Plus className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Medication Plan</h2>
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
              Medicine Name *
            </label>
            <div className="relative">
              <input
                type="text"
                name="medicine_name"
                value={form.medicine_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 pr-28 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                placeholder="Enter medicine name"
              />
              <button
                type="button"
                onClick={handleSummaryRequest}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Summary
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dosage
            </label>
            <input
              type="text"
              name="dosage"
              value={form.dosage}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
              placeholder="e.g., 500mg, 2 tablets"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Form
            </label>
            <select
              name="form"
              value={form.form}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            >
              <option value="tablet">Tablet</option>
              <option value="syrup">Syrup</option>
              <option value="injection">Injection</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequency Unit
            </label>
            <select
              name="frequency_unit"
              value={form.frequency_unit}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            >
              <option value="once">Once</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequency Value
            </label>
            <input
              type="number"
              name="frequency_value"
              value={form.frequency_value}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Times Per Day
            </label>
            <select
              name="times_per_day"
              value={form.times_per_day}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            >
              <option value={1}>1 time</option>
              <option value={2}>2 times</option>
              <option value={3}>3 times</option>
              <option value={4}>4 times</option>
            </select>
          </div>
        </div>

        {/* Dose Times */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dose Times
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {form.dose_times.map((time, index) => (
              <input
                key={index}
                type="time"
                value={time}
                onChange={(e) => handleDoseTimeChange(index, e.target.value)}
                className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                placeholder={`Time ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Weekly Reminder Toggle */}
        <div className="grid md:grid-cols-1 gap-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
            <label htmlFor="remind_weekly" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Activate weekly Reminder
            </label>
            <input
              id="remind_weekly"
              name="remind_weekly"
              type="checkbox"
              checked={form.remind_weekly}
              onChange={handleChange}
              className="h-5 w-5 accent-teal-600"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Food Timing
            </label>
            <select
              name="food_timing"
              value={form.food_timing}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            >
              <option value="no_pref">No preference</option>
              <option value="before_food">Before food</option>
              <option value="after_food">After food</option>
              <option value="with_food">With food</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            placeholder="Additional notes about the medication"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !form.patient_id || !form.medicine_name.trim()}
          className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium transition-colors min-h-[44px]"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Adding Medication...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Medication Plan
            </>
          )}
        </button>
      </form>
      {/* Summary Modal */}
      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Medication Summary</h3>
              <button
                onClick={() => setSummaryOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {summaryLoading && (
                <div className="flex items-center text-gray-700 dark:text-gray-200">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500 mr-3" />
                  Getting summary...
                </div>
              )}

              {!summaryLoading && summaryError && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                  {summaryError}
                </div>
              )}

              {!summaryLoading && !summaryError && (
                <div className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed space-y-2">
                  {(() => {
                    const lines = (summaryText || 'No summary available.').split(/\r?\n/);
                    return lines.map((line, idx) => {
                      // Match cases like: **Use:** text  OR  **Use**: text  OR  **Use** text
                      const boldAny = line.match(/^\s*\*\*([^*]+?)\*\*\s*(.*)$/);
                      if (boldAny) {
                        const rawTitle = boldAny[1].trim();
                        const rest = boldAny[2].trim();
                        const title = rawTitle.replace(/:$/, '').trim();
                        if (title) {
                          return (
                            <p key={idx}>
                              <span className="font-semibold">{title}:</span> {rest}
                            </p>
                          );
                        }
                      }
                      // Fallback: match Title: text without bold
                      const colon = line.match(/^\s*([^:]+):\s*(.*)$/);
                      if (colon) {
                        return (
                          <p key={idx}>
                            <span className="font-semibold">{colon[1].trim()}:</span> {colon[2]}
                          </p>
                        );
                      }
                      return <p key={idx}>{line}</p>;
                    });
                  })()}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setSummaryOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
