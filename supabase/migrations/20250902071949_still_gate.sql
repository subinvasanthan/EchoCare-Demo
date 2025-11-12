/*
  # Update profiles table RLS policies

  1. Security Updates
    - Add RLS policy for authenticated users to insert their own profile
    - Add RLS policy for authenticated users to update their own profile
    - Add RLS policy for authenticated users to read their own profile

  2. Notes
    - Policies use auth.uid() to ensure users can only access their own data
    - Insert policy allows creating new profile records
    - Update policy allows modifying existing profile records
    - Select policy allows reading profile data
*/

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create policies for authenticated users to manage their own profiles
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);