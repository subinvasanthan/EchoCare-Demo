import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { WebhookService } from '../../lib/webhook';
import { Plus, Check, AlertCircle, Search, Edit, Trash2, X, ChevronDown, ChevronUp, Calendar, Pill, Bell, Clock, User, Phone, MapPin, FileText } from 'lucide-react';

interface PatientsTabProps {
  user: any;
}

interface CareRecipient {
  id: string;
  full_name: string;
  primary_contact: string;
  secondary_contact: string;
  date_of_birth: string;
  gender: string;
  address: string;
  notes: string;
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
  dose_times: string[];
  food_timing: string;
  start_date: string;
  end_date: string;
  notes: string;
  created_at: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  frequency_unit: string;
  frequency_value: number;
  start_datetime: string;
  end_datetime: string;
  repeat_count: number;
  notify_channel: string;
  created_at: string;
}

interface Appointment {
  id: string;
  doctor_name: string;
  specialization: string;
  hospital: string;
  address: string;
  phone: string;
  appointment_at: string;
  status: string;
  notes: string;
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString();
  };

  const renderMedications = (patientId: string) => {
    const medications = patientData[patientId]?.medications || [];
    const upcomingMedications = getUpcomingItems(medications, 'start_date');

    return (
      <div className="space-y-3">
        {upcomingMedications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No medications added yet</p>
        ) : (
          upcomingMedications.map((med) => (
            <div key={med.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">{med.medicine_name}</h4>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {med.dosage} • {med.form} • {med.frequency_value} {med.frequency_unit}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                    {formatDate(med.start_date)} - {formatDate(med.end_date)}
                  </p>
                </div>
                <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          ))
        )}
        {medications.length > 5 && (
          <button className="w-full text-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium py-2">
            View All ({medications.length} total)
          </button>
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
                  <p className="text-sm text-yellow-600 dark:text-yellow-300">{reminder.description}</p>
                  <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">
                    {reminder.frequency_value} {reminder.frequency_unit} • {reminder.notify_channel}
                  </p>
                </div>
                <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
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
    const upcomingAppointments = getUpcomingItems(appointments, 'appointment_at');

    return (
      <div className="space-y-3">
        {upcomingAppointments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No appointments scheduled yet</p>
        ) : (
          upcomingAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200">Dr. {appointment.doctor_name}</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-300">{appointment.specialization}</p>
                  <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                    {formatDateTime(appointment.appointment_at)} • {appointment.status}
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          ))
        )}
        {appointments.length > 5 && (
          <button className="w-full text-center text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium py-2">
            View All ({appointments.length} total)
          </button>
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
                      <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setPatientTab(patient.id, 'medications')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                            activeTab[patient.id] === 'medications'
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
                            activeTab[patient.id] === 'reminders'
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
                            activeTab[patient.id] === 'appointments'
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          Appointments ({patientData[patient.id]?.appointments?.length || 0})
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="p-6">
                        {activeTab[patient.id] === 'medications' && renderMedications(patient.id)}
                        {activeTab[patient.id] === 'reminders' && renderReminders(patient.id)}
                        {activeTab[patient.id] === 'appointments' && renderAppointments(patient.id)}
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
