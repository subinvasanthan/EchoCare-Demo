/*
  # Create caregiver console tables

  1. New Tables
    - `care_recipients` - Patient information managed by caregivers
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users)
      - `full_name` (text, required)
      - `primary_contact` (text)
      - `secondary_contact` (text)
      - `date_of_birth` (date)
      - `gender` (text)
      - `address` (text)
      - `notes` (text)
      - `created_at` (timestamp)

    - `medication_plans` - Medication schedules for patients
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references care_recipients)
      - `created_by` (uuid, references auth.users)
      - `medicine_name` (text, required)
      - `dosage` (text)
      - `form` (text)
      - `frequency_unit` (text)
      - `frequency_value` (integer)
      - `times_per_day` (integer)
      - `dose_times` (jsonb)
      - `food_timing` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `notes` (text)
      - `created_at` (timestamp)

    - `general_reminders` - General reminders for patients
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references care_recipients)
      - `created_by` (uuid, references auth.users)
      - `title` (text, required)
      - `description` (text)
      - `frequency_unit` (text)
      - `frequency_value` (integer)
      - `start_datetime` (timestamp)
      - `end_datetime` (timestamp)
      - `repeat_count` (integer)
      - `notify_channel` (text)
      - `created_at` (timestamp)

    - `appointments` - Medical appointments for patients
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references care_recipients)
      - `created_by` (uuid, references auth.users)
      - `doctor_name` (text, required)
      - `specialization` (text)
      - `hospital` (text)
      - `address` (text)
      - `phone` (text)
      - `appointment_at` (timestamp)
      - `status` (text)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Foreign key constraints for data integrity
</sql>

-- Create care_recipients table
CREATE TABLE IF NOT EXISTS care_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  primary_contact text,
  secondary_contact text,
  date_of_birth date,
  gender text,
  address text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE care_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own care recipients"
  ON care_recipients
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Create medication_plans table
CREATE TABLE IF NOT EXISTS medication_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dosage text,
  form text DEFAULT 'tablet',
  frequency_unit text DEFAULT 'daily',
  frequency_value integer DEFAULT 1,
  times_per_day integer DEFAULT 1 CHECK (times_per_day >= 1 AND times_per_day <= 4),
  dose_times jsonb DEFAULT '[]'::jsonb,
  food_timing text DEFAULT 'no_pref',
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medication_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage medication plans for their patients"
  ON medication_plans
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM care_recipients WHERE id = patient_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM care_recipients WHERE id = patient_id AND owner_id = auth.uid())
  );

-- Create general_reminders table
CREATE TABLE IF NOT EXISTS general_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  frequency_unit text DEFAULT 'daily',
  frequency_value integer DEFAULT 1,
  start_datetime timestamptz DEFAULT now(),
  end_datetime timestamptz,
  repeat_count integer,
  notify_channel text DEFAULT 'call',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE general_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage reminders for their patients"
  ON general_reminders
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM care_recipients WHERE id = patient_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM care_recipients WHERE id = patient_id AND owner_id = auth.uid())
  );

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  specialization text,
  hospital text,
  address text,
  phone text,
  appointment_at timestamptz,
  status text DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage appointments for their patients"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM care_recipients WHERE id = patient_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM care_recipients WHERE id = patient_id AND owner_id = auth.uid())
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS care_recipients_owner_id_idx ON care_recipients(owner_id);
CREATE INDEX IF NOT EXISTS medication_plans_patient_id_idx ON medication_plans(patient_id);
CREATE INDEX IF NOT EXISTS medication_plans_created_by_idx ON medication_plans(created_by);
CREATE INDEX IF NOT EXISTS general_reminders_patient_id_idx ON general_reminders(patient_id);
CREATE INDEX IF NOT EXISTS general_reminders_created_by_idx ON general_reminders(created_by);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_created_by_idx ON appointments(created_by);