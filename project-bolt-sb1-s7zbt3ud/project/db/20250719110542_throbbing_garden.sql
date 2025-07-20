/*
  # Create Parking Spaces System

  1. New Tables
    - `parking_spaces`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references user_profiles)
      - `title` (text)
      - `description` (text)
      - `address` (text)
      - `city` (text)
      - `state` (text)
      - `pincode` (text)
      - `latitude` (decimal)
      - `longitude` (decimal)
      - `hourly_rate` (decimal)
      - `space_type` (enum: car, bike, both)
      - `total_slots` (integer)
      - `available_slots` (integer)
      - `amenities` (text array)
      - `images` (text array)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `parking_availability`
      - `id` (uuid, primary key)
      - `parking_space_id` (uuid, references parking_spaces)
      - `date` (date)
      - `start_time` (time)
      - `end_time` (time)
      - `available_slots` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for owners to manage their spaces
    - Add policies for customers to view available spaces
*/

-- Create enum for space types
CREATE TYPE space_type_enum AS ENUM ('car', 'bike', 'both');

-- Create parking spaces table
CREATE TABLE IF NOT EXISTS parking_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  hourly_rate decimal(10, 2) NOT NULL,
  space_type space_type_enum NOT NULL DEFAULT 'car',
  total_slots integer NOT NULL DEFAULT 1,
  available_slots integer NOT NULL DEFAULT 1,
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create parking availability table
CREATE TABLE IF NOT EXISTS parking_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_space_id uuid NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  available_slots integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parking_space_id, date, start_time, end_time)
);

-- Enable RLS
ALTER TABLE parking_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_availability ENABLE ROW LEVEL SECURITY;

-- Policies for parking_spaces
CREATE POLICY "Anyone can view active parking spaces"
  ON parking_spaces
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Owners can manage their parking spaces"
  ON parking_spaces
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Policies for parking_availability
CREATE POLICY "Anyone can view parking availability"
  ON parking_availability
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can manage their parking availability"
  ON parking_availability
  FOR ALL
  TO authenticated
  USING (
    parking_space_id IN (
      SELECT id FROM parking_spaces WHERE owner_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_parking_spaces_updated_at
  BEFORE UPDATE ON parking_spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parking_spaces_location ON parking_spaces(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_city ON parking_spaces(city);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_owner ON parking_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_parking_availability_space_date ON parking_availability(parking_space_id, date);