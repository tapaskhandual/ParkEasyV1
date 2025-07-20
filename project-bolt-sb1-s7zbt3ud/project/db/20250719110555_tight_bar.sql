/*
  # Create Bookings and Payments System

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references user_profiles)
      - `parking_space_id` (uuid, references parking_spaces)
      - `booking_date` (date)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `duration_hours` (integer)
      - `total_amount` (decimal)
      - `admin_commission` (decimal)
      - `owner_amount` (decimal)
      - `payment_gateway_fee` (decimal)
      - `vehicle_number` (text)
      - `vehicle_type` (enum: car, bike)
      - `status` (enum: pending, confirmed, completed, cancelled)
      - `payment_status` (enum: pending, paid, failed, refunded)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `payments`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `payment_id` (text, instamojo payment id)
      - `payment_request_id` (text, instamojo payment request id)
      - `amount` (decimal)
      - `status` (enum: pending, success, failed, refunded)
      - `payment_method` (text)
      - `gateway_response` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `commission_transactions`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `admin_commission` (decimal)
      - `owner_amount` (decimal)
      - `payment_gateway_fee` (decimal)
      - `status` (enum: pending, processed, failed)
      - `processed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each user type
*/

-- Create enums
CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE vehicle_type_enum AS ENUM ('car', 'bike');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'processed', 'failed');

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parking_space_id uuid NOT NULL REFERENCES parking_spaces(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_hours integer NOT NULL,
  total_amount decimal(10, 2) NOT NULL,
  admin_commission decimal(10, 2) NOT NULL DEFAULT 0,
  owner_amount decimal(10, 2) NOT NULL DEFAULT 0,
  payment_gateway_fee decimal(10, 2) NOT NULL DEFAULT 0,
  vehicle_number text NOT NULL,
  vehicle_type vehicle_type_enum NOT NULL,
  status booking_status_enum NOT NULL DEFAULT 'pending',
  payment_status payment_status_enum NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_id text,
  payment_request_id text,
  amount decimal(10, 2) NOT NULL,
  status payment_status_enum NOT NULL DEFAULT 'pending',
  payment_method text,
  gateway_response jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create commission transactions table
CREATE TABLE IF NOT EXISTS commission_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  admin_commission decimal(10, 2) NOT NULL,
  owner_amount decimal(10, 2) NOT NULL,
  payment_gateway_fee decimal(10, 2) NOT NULL DEFAULT 0,
  status transaction_status_enum NOT NULL DEFAULT 'pending',
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for bookings
CREATE POLICY "Customers can view their bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Owners can view bookings for their spaces"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    parking_space_id IN (
      SELECT id FROM parking_spaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

-- Policies for payments
CREATE POLICY "Users can view their payment records"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE customer_id = auth.uid()
    )
  );

CREATE POLICY "System can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for commission transactions
CREATE POLICY "Owners can view their commission transactions"
  ON commission_transactions
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN parking_spaces ps ON b.parking_space_id = ps.id
      WHERE ps.owner_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parking_space ON bookings(parking_space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_commission_booking ON commission_transactions(booking_id);