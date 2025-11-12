import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { WebhookService } from '../../lib/webhook';
import { Plus, Check, AlertCircle, Search, Edit, Trash2, X, ChevronDown, ChevronUp, Calendar, Pill, Bell, Clock, User, Phone, MapPin } from 'lucide-react';

interface PatientsTabProps {
  user: any;
}

interface CareRecipient {
  id: string;
  full_name: string;
  primary_contact: string | null;
  secondary_contact: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

interface Medication {
  id: string;
  medicine_name: string;
  dosage: string;
  form: string;
  frequency_unit: string;
  frequency_value: number;
  times_per_day: number;
  dose_times: string[] | string | null;
  food_timing: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  frequency_unit: string;
  frequency_value: number;
  start_datetime: string | null;
  end_datetime: string | null;
  repeat_count: number;
  notify_channel: string;
  created_at: string;
}

interface Appointment {
  id: string;
  doctor_name: string;
  specialization: string;
  hospital: string;
  address: string | null;
  phone: string | null;
  appointment_at: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
}

interface PatientData {
  medications: Medication[];
  reminders: Reminder[];
  appointments: Appointment[];
}

export default function PatientsTab({ user }: PatientsTabProps) {
  const [patients, setPatients] = useState<CareRecipient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<CareRecipient[]>([]);
  const [patientData, setPatientData] = useState<Record<string, PatientData>>({});
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Record<string, 'medications' | 'reminders' | 'appointments'>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingPatient, setEditingPatient] = useState<CareRecipient | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const [phoneNumberError, setPhoneNumberError] = useState('');
  
  const [form, setForm] = useState({
    full_name: '',
    primary_contact: '',
    secondary_contact: '',
    date_of_birth: '',
    gender: '',
    address: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [user]);

  useEffect(() => {
    // Filter patients based on search term
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => 
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.primary_contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.secondary_contact?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('care_recipients')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
      
      // Fetch data for all patients
      if (data && data.length > 0) {
        await fetchAllPatientData(data.map(p => p.id));
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      setMessage({ type: 'error', text: 'Failed to load patients' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPatientData = async (patientIds: string[]) => {
    try {
      const [medicationsRes, remindersRes, appointmentsRes] = await Promise.all([
        supabase
          .from('medication_plans')
          .select('*')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('general_reminders')
          .select('*')
          .in('patient_id', patientIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('appointments')
          .select('*')
          .in('patient_id', patientIds)
          .order('appointment_at', { ascending: false })
      ]);

      const newPatientData: Record<string, PatientData> = {};
      
      patientIds.forEach(patientId => {
        newPatientData[patientId] = {
          medications: medicationsRes.data?.filter(m => m.patient_id === patientId) || [],
          reminders: remindersRes.data?.filter(r => r.patient_id === patientId) || [],
          appointments: appointmentsRes.data?.filter(a => a.patient_id === patientId) || []
        };
      });

      setPatientData(newPatientData);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  const fetchPatientData = async (patientId: string) => {
    try {
      const [medicationsRes, remindersRes, appointmentsRes] = await Promise.all([
        supabase
          .from('medication_plans')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('general_reminders')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientId)
          .order('appointment_at', { ascending: false })
      ]);

      setPatientData(prev => ({
        ...prev,
        [patientId]: {
          medications: medicationsRes.data || [],
          reminders: remindersRes.data || [],
          appointments: appointmentsRes.data || []
        }
      }));
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  const togglePatientExpansion = async (patientId: string) => {
    const newExpanded = new Set(expandedPatients);
    if (newExpanded.has(patientId)) {
      newExpanded.delete(patientId);
    } else {
      newExpanded.add(patientId);
      // Set default tab if not set
      if (!activeTab[patientId]) {
        setActiveTab(prev => ({ ...prev, [patientId]: 'medications' }));
      }
      // Fetch fresh data when expanding
      await fetchPatientData(patientId);
    }
    setExpandedPatients(newExpanded);
  };

  const setPatientTab = (patientId: string, tab: 'medications' | 'reminders' | 'appointments') => {
    setActiveTab(prev => ({ ...prev, [patientId]: tab }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Phone number validation for primary_contact
    if (name === 'primary_contact') {
      const phoneRegex = /^\+\d{10,15}$/;
      if (value === '' || phoneRegex.test(value)) {
        setPhoneNumberError('');
      } else {
        setPhoneNumberError('Please enter a valid phone number starting with \'+\' and only digits, e.g., +919999888877');
      }
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.primary_contact.trim()) {
      setMessage({ type: 'error', text: 'Full name and phone number are required' });
      return;
    }
    
    if (phoneNumberError) {
      setMessage({ type: 'error', text: 'Please fix the phone number format before submitting' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // Trim and normalize data for duplicate checking
      const trimmedName = form.full_name.trim();
      const trimmedContact = form.primary_contact.trim();

      // Check for existing care recipient with same owner_id, full_name, and primary_contact
      let duplicateQuery = supabase
        .from('care_recipients')
        .select('id')
        .eq('owner_id', user.id)
        .ilike('full_name', trimmedName); // Case-insensitive comparison

      // Only add primary_contact filter if it's not empty
      if (trimmedContact) {
        duplicateQuery = duplicateQuery.eq('primary_contact', trimmedContact);
      } else {
        // If current contact is empty, check for records with null or empty contact
        duplicateQuery = duplicateQuery.or('primary_contact.is.null,primary_contact.eq.');
      }

      const { data: existingRecords, error: checkError } = await duplicateQuery;

      if (checkError) {
        throw checkError;
      }

      if (existingRecords && existingRecords.length > 0) {
        setMessage({ 
          type: 'error', 
          text: 'This patient already exists in your records. Please avoid duplicate entries.' 
        });
        setSubmitting(false);
        return;
      }

      // Proceed with insertion if no duplicates found
      const { data: newPatient, error } = await supabase
        .from('care_recipients')
        .insert({
          ...form,
          full_name: trimmedName,
          primary_contact: trimmedContact || null,
          owner_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Patient added successfully!' });
      
      // Send webhook notification
      WebhookService.sendPatientCreated({
        ...form,
        full_name: trimmedName,
        primary_contact: trimmedContact || null,
        owner_id: user.id
      }, user.id);
      
      setForm({
        full_name: '',
        primary_contact: '',
        secondary_contact: '',
        date_of_birth: '',
        gender: '',
        address: '',
        notes: ''
      });
      
      // Add new patient to the list immediately
      if (newPatient) {
        setPatients(prev => [newPatient, ...prev]);
        // Initialize empty data for the new patient
        setPatientData(prev => ({
          ...prev,
          [newPatient.id]: {
            medications: [],
            reminders: [],
            appointments: []
          }
        }));
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add patient' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (patient: CareRecipient) => {
    setEditingPatient(patient);
    setPhoneNumberError(''); // Clear any existing phone error when editing
    setForm({
      full_name: patient.full_name,
      primary_contact: patient.primary_contact || '',
      secondary_contact: patient.secondary_contact || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || '',
      address: patient.address || '',
      notes: patient.notes || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient || !form.full_name.trim() || !form.primary_contact.trim()) {
      setMessage({ type: 'error', text: 'Full name and phone number are required' });
      return;
    }
    
    if (phoneNumberError) {
      setMessage({ type: 'error', text: 'Please fix the phone number format before submitting' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const trimmedName = form.full_name.trim();
      const trimmedContact = form.primary_contact.trim();

      const { error } = await supabase
        .from('care_recipients')
        .update({
          ...form,
          full_name: trimmedName,
          primary_contact: trimmedContact || null,
        })
        .eq('id', editingPatient.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Patient updated successfully!' });
      
      // Send webhook notification
      WebhookService.sendPatientUpdated({
        id: editingPatient.id,
        ...form,
        full_name: trimmedName,
        primary_contact: trimmedContact || null,
      }, user.id);
      
      setEditingPatient(null);
      setForm({
        full_name: '',
        primary_contact: '',
        secondary_contact: '',
        date_of_birth: '',
        gender: '',
        address: '',
        notes: ''
      });
      
      // Update patient in the list immediately
      setPatients(prev => prev.map(p => 
        p.id === editingPatient.id 
          ? { ...p, ...form, full_name: trimmedName, primary_contact: trimmedContact || null }
          : p
      ));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update patient' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('care_recipients')
        .delete()
        .eq('id', patientId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Patient deleted successfully!' });
      
      // Send webhook notification
      WebhookService.sendPatientDeleted(patientId, user.id);
      
      setShowDeleteConfirm(null);
      
      // Remove patient from the list immediately
      setPatients(prev => prev.filter(p => p.id !== patientId));
      setPatientData(prev => {
        const newData = { ...prev };
        delete newData[patientId];
        return newData;
      });
      setExpandedPatients(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(patientId);
        return newExpanded;
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete patient' });
    }
  };

  const cancelEdit = () => {
    setEditingPatient(null);
    setPhoneNumberError(''); // Clear phone error when canceling edit
    setForm({
      full_name: '',
      primary_contact: '',
      secondary_contact: '',
      date_of_birth: '',
      gender: '',
      address: '',
      notes: ''
    });
  };

  const handleDeleteMedication = async (patientId: string, medicationId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this medication plan?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('medication_plans')
        .delete()
        .eq('id', medicationId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Medication plan deleted successfully!' });

      setPatientData(prev => {
        const patientEntry = prev[patientId];
        if (!patientEntry) return prev;

        const updatedMedications = patientEntry.medications.filter(med => med.id !== medicationId);

        return {
          ...prev,
          [patientId]: {
            ...patientEntry,
            medications: updatedMedications,
          },
        };
      });
    } catch (error: any) {
      console.error('Error deleting medication:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete medication plan' });
    }
  };

  const handleDeleteReminder = async (patientId: string, reminderId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this reminder?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('general_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Reminder deleted successfully!' });

      setPatientData(prev => {
        const patientEntry = prev[patientId];
        if (!patientEntry) return prev;

        const updatedReminders = patientEntry.reminders.filter(reminder => reminder.id !== reminderId);

        return {
          ...prev,
          [patientId]: {
            ...patientEntry,
            reminders: updatedReminders,
          },
        };
      });
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete reminder' });
    }
  };

  const handleDeleteAppointment = async (patientId: string, appointmentId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this appointment?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Appointment deleted successfully!' });

      setPatientData(prev => {
        const patientEntry = prev[patientId];
        if (!patientEntry) return prev;

        const updatedAppointments = patientEntry.appointments.filter(appointment => appointment.id !== appointmentId);

        return {
          ...prev,
          [patientId]: {
            ...patientEntry,
            appointments: updatedAppointments,
          },
        };
      });
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete appointment' });
    }
  };

  const getUpcomingItems = (items: any[], dateField: string, limit: number = 5) => {
    const now = new Date();
    return items
      .filter(item => {
        if (!item[dateField]) return true; // Include items without dates
        const itemDate = new Date(item[dateField]);
        return itemDate >= now || (dateField === 'created_at'); // Include future dates or recent items
      })
      .slice(0, limit);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const normalizeDoseTimes = (doseTimes: string[] | string | null): string[] => {
    if (Array.isArray(doseTimes)) return doseTimes;
    if (typeof doseTimes === 'string' && doseTimes.trim()) {
      try {
        const parsed = JSON.parse(doseTimes);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.warn('Failed to parse dose_times:', error);
      }
    }
    return [];
  };

  const renderMedications = (patientId: string) => {
    const medications = patientData[patientId]?.medications || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeMedications = medications.filter((med) => {
      if (!med.end_date) return true;
      const medEndDate = new Date(med.end_date);
      medEndDate.setHours(0, 0, 0, 0);
      return medEndDate >= today;
    });

    const pastMedications = medications.filter((med) => {
      if (!med.end_date) return false;
      const medEndDate = new Date(med.end_date);
      medEndDate.setHours(0, 0, 0, 0);
      return medEndDate < today;
    });

    const sortByStartDateDesc = (list: Medication[]) =>
      [...list].sort((a, b) => {
        const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
        const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
        return bDate - aDate;
      });

    const renderMedicationCard = (med: Medication, variant: 'active' | 'past') => {
      const doseTimes = normalizeDoseTimes(med.dose_times);
      const containerStyles =
        variant === 'active'
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 opacity-80';

      return (
        <div key={med.id} className={`${containerStyles} rounded-lg p-4`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-green-800 dark:text-green-200">{med.medicine_name}</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                {med.dosage} • {med.form} • {med.frequency_value} {med.frequency_unit}
              </p>
              <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                {formatDate(med.start_date)} - {formatDate(med.end_date)}
              </p>
              <div className="text-xs text-green-500 dark:text-green-300 mt-2 space-y-1">
                <p>Times per day: {med.times_per_day ?? 'Not set'}</p>
                {doseTimes.length > 0 && (
                  <p>Dose times: {doseTimes.join(', ')}</p>
                )}
                {med.food_timing && <p>Food timing: {med.food_timing}</p>}
                {med.notes && <p className="italic">Notes: {med.notes}</p>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
              <button
                onClick={() => handleDeleteMedication(patientId, med.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-3">
        {medications.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No medication plans found for this patient.
          </p>
        )}

        {activeMedications.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
              Active plans
            </h4>
            {sortByStartDateDesc(activeMedications).map((med) => renderMedicationCard(med, 'active'))}
          </div>
        )}

        {pastMedications.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-dashed border-green-200 dark:border-green-800">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Past plans
            </h4>
            {sortByStartDateDesc(pastMedications).map((med) => renderMedicationCard(med, 'past'))}
          </div>
        )}
      </div>
    );
  };

  const renderReminders = (patientId: string) => {
    const reminders = patientData[patientId]?.reminders || [];
    const upcomingReminders = getUpcomingItems(reminders, 'start_datetime');

    return (
      <div className="space-y-3">
        {upcomingReminders.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No reminders added yet</p>
        ) : (
          upcomingReminders.map((reminder) => (
            <div key={reminder.id} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">{reminder.title}</h4>
                  {reminder.description && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">{reminder.description}</p>
                  )}
                  <div className="mt-2 space-y-1 text-xs text-yellow-600 dark:text-yellow-300">
                    <p>
                      Frequency: {reminder.frequency_value} {reminder.frequency_unit}
                    </p>
                    <p>Notifications: {reminder.notify_channel}</p>
                    <p>
                      Starts: {formatDateTime(reminder.start_datetime)}
                    </p>
                    <p>
                      Ends: {formatDateTime(reminder.end_datetime)}
                    </p>
                    {typeof reminder.repeat_count === 'number' && reminder.repeat_count > 0 && (
                      <p>Repeat count: {reminder.repeat_count}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <button
                    onClick={() => handleDeleteReminder(patientId, reminder.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {reminders.length > 5 && (
          <button className="w-full text-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium py-2">
            View All ({reminders.length} total)
          </button>
        )}
      </div>
    );
  };

  const renderAppointments = (patientId: string) => {
    const appointments = patientData[patientId]?.appointments || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    type RGB = [number, number, number];

    const red: RGB = [239, 68, 68];
    const yellow: RGB = [250, 204, 21];
    const green: RGB = [34, 197, 94];

    const interpolateColor = (from: RGB, to: RGB, factor: number): RGB => {
      const clamped = Math.min(Math.max(factor, 0), 1);
      return [
        Math.round(from[0] + (to[0] - from[0]) * clamped),
        Math.round(from[1] + (to[1] - from[1]) * clamped),
        Math.round(from[2] + (to[2] - from[2]) * clamped),
      ];
    };

    const lightenColor = (color: RGB, amount: number): RGB => {
      const clamped = Math.min(Math.max(amount, 0), 1);
      return [
        Math.round(color[0] + (255 - color[0]) * clamped),
        Math.round(color[1] + (255 - color[1]) * clamped),
        Math.round(color[2] + (255 - color[2]) * clamped),
      ];
    };

    const rgbToRgba = (color: RGB, alpha: number) => {
      const clamped = Math.min(Math.max(alpha, 0), 1);
      return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${clamped})`;
    };

    const blendRedYellowGreen = (progress: number): RGB => {
      const clamped = Math.min(Math.max(progress, 0), 1);
      if (clamped >= 0.5) {
        const ratio = (clamped - 0.5) / 0.5;
        return interpolateColor(yellow, red, ratio);
      }
      const ratio = clamped / 0.5;
      return interpolateColor(green, yellow, ratio);
    };

    const validAppointments = appointments.filter((appointment) => appointment.appointment_at);

    const sortedAppointments = validAppointments.sort((a, b) => {
      const aTime = a.appointment_at ? new Date(a.appointment_at).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.appointment_at ? new Date(b.appointment_at).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

    const upcomingAppointments = sortedAppointments.filter((appointment) => {
      if (!appointment.appointment_at) return false;
      const appointmentDate = new Date(appointment.appointment_at);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate >= today;
    });

    const pastAppointments = sortedAppointments.filter((appointment) => {
      if (!appointment.appointment_at) return true;
      const appointmentDate = new Date(appointment.appointment_at);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate < today;
    });

    const getGradientStyle = (index: number, total: number) => {
      const denominator = Math.max(total - 1, 1);
      const progress = total <= 1 ? 1 : 1 - index / denominator;
      const baseColor = blendRedYellowGreen(progress);
      const lightColor = lightenColor(baseColor, 0.45);
      return {
        background: `linear-gradient(135deg, ${rgbToRgba(lightColor, 0.9)}, ${rgbToRgba(baseColor, 0.85)})`,
        borderColor: rgbToRgba(baseColor, 0.7),
      };
    };

    return (
      <div className="space-y-3">
        {sortedAppointments.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No appointments scheduled yet</p>
        )}

        {upcomingAppointments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
              Upcoming appointments
            </h4>
            {upcomingAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                className="rounded-lg p-4 border shadow-sm"
                style={getGradientStyle(index, upcomingAppointments.length)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 text-gray-900 dark:text-gray-100">
                    <h4 className="font-semibold">Dr. {appointment.doctor_name}</h4>
                    <p className="text-sm text-gray-800/90 dark:text-gray-200/90">{appointment.specialization}</p>
                    <p className="text-xs text-gray-800/80 dark:text-gray-200/80 mt-1">
                      {formatDateTime(appointment.appointment_at)}
                    </p>
                    {appointment.hospital && (
                      <p className="text-xs text-gray-800/80 dark:text-gray-200/80 mt-1">Hospital: {appointment.hospital}</p>
                    )}
                    {appointment.address && (
                      <p className="text-xs text-gray-800/80 dark:text-gray-200/80">Address: {appointment.address}</p>
                    )}
                    {appointment.phone && (
                      <p className="text-xs text-gray-800/80 dark:text-gray-200/80">Contact: {appointment.phone}</p>
                    )}
                    {appointment.notes && (
                      <p className="text-xs italic text-gray-800/80 dark:text-gray-200/80 mt-1">Notes: {appointment.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Calendar className="w-5 h-5 text-gray-900 dark:text-gray-100 opacity-80" />
                    <button
                      onClick={() => handleDeleteAppointment(patientId, appointment.id)}
                      className="p-2 text-gray-900 dark:text-gray-100 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg transition-colors text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pastAppointments.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-dashed border-purple-200 dark:border-purple-800">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Past appointments
            </h4>
            {pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800 opacity-80"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 text-purple-900 dark:text-purple-200">
                    <h4 className="font-semibold">Dr. {appointment.doctor_name}</h4>
                    <p className="text-sm">{appointment.specialization}</p>
                    <p className="text-xs mt-1">
                      {formatDateTime(appointment.appointment_at)}
                    </p>
                    {appointment.notes && (
                      <p className="text-xs italic mt-1">Notes: {appointment.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <button
                      onClick={() => handleDeleteAppointment(patientId, appointment.id)}
                      className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <User className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {editingPatient ? 'Edit Patient' : 'Manage Patients'}
        </h2>
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

      {/* Search Bar */}
      {!editingPatient && (
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or contact"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            />
          </div>
        </div>
      )}

      {/* Patient List */}
      {!editingPatient && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Patients ({filteredPatients.length})
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-gray-600 dark:text-gray-300">
                {searchTerm ? 'No patients found matching your search.' : 'No patients added yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  {/* Patient Header */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {patient.full_name}
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                          {patient.primary_contact && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{patient.primary_contact}</span>
                            </div>
                          )}
                          {patient.date_of_birth && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>DOB: {formatDate(patient.date_of_birth)}</span>
                            </div>
                          )}
                          {patient.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{patient.address}</span>
                            </div>
                          )}
                          {patient.gender && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{patient.gender}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit patient"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(patient.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete patient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => togglePatientExpansion(patient.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title={expandedPatients.has(patient.id) ? "Collapse details" : "Expand details"}
                        >
                          {expandedPatients.has(patient.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedPatients.has(patient.id) && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {/* Tab Navigation */}
                      {(() => {
                        const currentTab = activeTab[patient.id] ?? 'medications';
                        return (
                          <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setPatientTab(patient.id, 'medications')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                            currentTab === 'medications'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-b-2 border-green-500'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Pill className="w-4 h-4" />
                          Medications ({patientData[patient.id]?.medications?.length || 0})
                        </button>
                        <button
                          onClick={() => setPatientTab(patient.id, 'reminders')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                            currentTab === 'reminders'
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                          Reminders ({patientData[patient.id]?.reminders?.length || 0})
                        </button>
                        <button
                          onClick={() => setPatientTab(patient.id, 'appointments')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                            currentTab === 'appointments'
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          Appointments ({patientData[patient.id]?.appointments?.length || 0})
                        </button>
                          </div>
                        );
                      })()}

                      {/* Tab Content */}
                      <div className="p-6">
                        {(() => {
                          const currentTab = activeTab[patient.id] ?? 'medications';
                          return (
                            <>
                              {currentTab === 'medications' && renderMedications(patient.id)}
                              {currentTab === 'reminders' && renderReminders(patient.id)}
                              {currentTab === 'appointments' && renderAppointments(patient.id)}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {editingPatient ? 'Edit Patient Details' : 'Add New Patient'}
        </h3>

        <form onSubmit={editingPatient ? handleUpdate : handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                placeholder="Enter patient's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="primary_contact"
                value={form.primary_contact}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border ${
                  phoneNumberError 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-700'
                } text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]`}
                placeholder="e.g., +919999888877"
              />
              {phoneNumberError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {phoneNumberError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secondary Contact
              </label>
              <input
                type="text"
                name="secondary_contact"
                value={form.secondary_contact}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                placeholder="Emergency contact"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
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
              placeholder="Enter complete address"
            />
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
              placeholder="Additional notes about the patient"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || !form.full_name.trim() || !form.primary_contact.trim() || phoneNumberError !== ''}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium transition-colors min-h-[44px]"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {editingPatient ? 'Updating...' : 'Adding Patient...'}
                </>
              ) : (
                <>
                  {editingPatient ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {editingPatient ? 'Update Patient' : 'Add Patient'}
                </>
              )}
            </button>
            
            {editingPatient && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-3 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-medium transition-colors min-h-[44px]"
              >
                <X className="w-4 h-4 mr-2 inline" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this patient? This action cannot be undone and will also remove all associated medication plans, reminders and appointments.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors min-h-[44px]"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
