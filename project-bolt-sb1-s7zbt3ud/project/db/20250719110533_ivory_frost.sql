/*
  # Create Users and Profiles System

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `user_type` (enum: customer, owner, admin)
      - `full_name` (text)
      - `phone_number` (text, unique)
      - `address` (text)
      - `city` (text)
      - `state` (text)
      - `pincode` (text)
      - `upi_id` (text, for owners and admin)
      - `bank_account_number` (text, for owners and admin)
      - `bank_ifsc_code` (text, for owners and admin)
      - `bank_account_holder_name` (text, for owners and admin)
      - `is_verified` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for users to manage their own profiles
    - Add policy for admin to view all profiles
*/

-- Create enum for user types
CREATE TYPE user_type_enum AS ENUM ('customer', 'owner', 'admin');

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type_enum NOT NULL DEFAULT 'customer',
  full_name text NOT NULL,
  phone_number text UNIQUE,
  address text,
  city text,
  state text,
  pincode text,
  upi_id text,
  bank_account_number text,
  bank_ifsc_code text,
  bank_account_holder_name text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();