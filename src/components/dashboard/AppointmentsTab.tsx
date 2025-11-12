import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { WebhookService } from '../../lib/webhook';
import { Plus, Check, AlertCircle } from 'lucide-react';

interface AppointmentsTabProps {
  user: any;
}

interface CareRecipient {
  id: string;
  full_name: string;
}

export default function AppointmentsTab({ user }: AppointmentsTabProps) {
  const [patients, setPatients] = useState<CareRecipient[]>([]);
  const [form, setForm] = useState({
    patient_id: '',
    doctor_name: '',
    specialization: '',
    hospital: '',
    address: '',
    phone: '',
    appointment_at: '',
    status: 'scheduled',
    notes: '',
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
    if ((target as HTMLInputElement).type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      setForm(prev => ({ ...prev, [checkbox.name]: checkbox.checked }));
    } else {
      setForm(prev => ({ ...prev, [target.name]: (target as any).value }));
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.patient_id || !form.doctor_name.trim()) {
    setMessage({ type: 'error', text: 'Patient and doctor name are required' });
    return;
  }

  setSubmitting(true);
  setMessage(null);

  try {
    const insertPayload = {
      ...form,
      created_by: user.id,
    };

    const response = await supabase.from('appointments').insert({
      ...insertPayload,
      remind_2days: form.remind_2days,
      remind_1hour: form.remind_1hour,
      notify_sms: form.notify_sms,
      notify_call: form.notify_call,
      notify_whatsapp: form.notify_whatsapp,
    });

    if (response.error) {
      setMessage({ type: 'error', text: response.error.message });
    } else {
      setMessage({ type: 'success', text: 'Appointment added successfully!' });
      
      // Send webhook notification
      WebhookService.sendAppointmentCreated({
        ...insertPayload,
        remind_2days: form.remind_2days,
        remind_1hour: form.remind_1hour,
        notify_sms: form.notify_sms,
        notify_call: form.notify_call,
        notify_whatsapp: form.notify_whatsapp,
      }, user.id);
      
      // Refresh patient data in PatientsTab if needed
      window.dispatchEvent(new CustomEvent('appointmentAdded', { 
        detail: { patientId: form.patient_id } 
      }));
      
      setForm({
        patient_id: '',
        doctor_name: '',
        specialization: '',
        hospital: '',
        address: '',
        phone: '',
        appointment_at: '',
        status: 'scheduled',
        notes: '',
        remind_2days: false,
        remind_1hour: false,
        notify_sms: false,
        notify_call: false,
        notify_whatsapp: false
      });
    }
  } catch (error) {
    setMessage({ type: 'error', text: 'Something went wrong while saving the appointment' });
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Plus className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Appointment</h2>
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
              Doctor Name *
            </label>
            <input
              type="text"
              name="doctor_name"
              value={form.doctor_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
              placeholder="Enter doctor's name"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Specialization
            </label>
            <input
              type="text"
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
              placeholder="e.g., Cardiologist, General Physician"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hospital/Clinic
            </label>
            <input
              type="text"
              name="hospital"
              value={form.hospital}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
              placeholder="Enter hospital or clinic name"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
              placeholder="Doctor's contact number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Appointment Date & Time
            </label>
            <input
              type="datetime-local"
              name="appointment_at"
              value={form.appointment_at}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            placeholder="Enter hospital/clinic address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
          >
            <option value="scheduled">Scheduled</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>

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
              <label htmlFor="notify_call" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Call
              </label>
              <input
                id="notify_call"
                name="notify_call"
                type="checkbox"
                checked={form.notify_call}
                onChange={handleChange}
                className="h-5 w-5 accent-teal-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
              <label htmlFor="notify_whatsapp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                WhatsApp
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
            placeholder="Additional notes about the appointment"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !form.patient_id || !form.doctor_name.trim()}
          className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium transition-colors min-h-[44px]"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Adding Appointment...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Appointment
            </>
          )}
        </button>
      </form>
    </div>
  );
}
