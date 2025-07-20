-- ParkEasy Database Setup Script
-- Run this script in your Supabase SQL editor to set up the complete database schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_type_enum AS ENUM ('customer', 'owner', 'admin');
CREATE TYPE space_type_enum AS ENUM ('car', 'bike', 'both');
CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE vehicle_type_enum AS ENUM ('car', 'bike');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'processed', 'failed');

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. USER PROFILES TABLE
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

-- Create policies for user_profiles
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

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. PARKING SPACES TABLE
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

-- Enable RLS
ALTER TABLE parking_spaces ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for updated_at
CREATE TRIGGER update_parking_spaces_updated_at
  BEFORE UPDATE ON parking_spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. PARKING AVAILABILITY TABLE
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
ALTER TABLE parking_availability ENABLE ROW LEVEL SECURITY;

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

-- 4. BOOKINGS TABLE
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

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. PAYMENTS TABLE
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

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. COMMISSION TRANSACTIONS TABLE
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
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;

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

-- 7. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  updated_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policies for admin_settings (admin only)
CREATE POLICY "Only admin can manage settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. PLATFORM STATISTICS TABLE
CREATE TABLE IF NOT EXISTS platform_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_users integer DEFAULT 0,
  total_owners integer DEFAULT 0,
  total_customers integer DEFAULT 0,
  total_parking_spaces integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_revenue decimal(15, 2) DEFAULT 0,
  total_commission decimal(15, 2) DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS
ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;

-- Policies for platform_statistics (admin only)
CREATE POLICY "Only admin can view statistics"
  ON platform_statistics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_parking_spaces_location ON parking_spaces(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_city ON parking_spaces(city);
CREATE INDEX IF NOT EXISTS idx_parking_spaces_owner ON parking_spaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_parking_availability_space_date ON parking_availability(parking_space_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parking_space ON bookings(parking_space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_commission_booking ON commission_transactions(booking_id);

-- INSERT DEFAULT ADMIN SETTINGS
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
  ('commission_rate', '0.05', 'Platform commission rate (5%)'),
  ('admin_upi_id', '', 'Admin UPI ID for commission payments'),
  ('admin_bank_account', '', 'Admin bank account for commission payments'),
  ('admin_bank_ifsc', '', 'Admin bank IFSC code'),
  ('admin_bank_holder_name', '', 'Admin bank account holder name'),
  ('platform_name', 'ParkEasy', 'Platform name'),
  ('support_email', 'support@parkeasy.com', 'Support email address'),
  ('support_phone', '+91-9999999999', 'Support phone number')
ON CONFLICT (setting_key) DO NOTHING;

-- CREATE FUNCTION TO UPDATE PLATFORM STATISTICS
CREATE OR REPLACE FUNCTION update_platform_statistics()
RETURNS void AS $$
BEGIN
  INSERT INTO platform_statistics (
    total_users,
    total_owners,
    total_customers,
    total_parking_spaces,
    total_bookings,
    total_revenue,
    total_commission,
    date
  )
  SELECT 
    (SELECT COUNT(*) FROM user_profiles),
    (SELECT COUNT(*) FROM user_profiles WHERE user_type = 'owner'),
    (SELECT COUNT(*) FROM user_profiles WHERE user_type = 'customer'),
    (SELECT COUNT(*) FROM parking_spaces WHERE is_active = true),
    (SELECT COUNT(*) FROM bookings),
    (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'paid'),
    (SELECT COALESCE(SUM(admin_commission), 0) FROM bookings WHERE payment_status = 'paid'),
    CURRENT_DATE
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    total_owners = EXCLUDED.total_owners,
    total_customers = EXCLUDED.total_customers,
    total_parking_spaces = EXCLUDED.total_parking_spaces,
    total_bookings = EXCLUDED.total_bookings,
    total_revenue = EXCLUDED.total_revenue,
    total_commission = EXCLUDED.total_commission;
END;
$$ LANGUAGE plpgsql;

-- CREATE SAMPLE DATA (OPTIONAL - FOR TESTING)
-- Uncomment the following lines to create sample data

/*
-- Create a sample admin user (you'll need to sign up with this email first)
INSERT INTO user_profiles (id, user_type, full_name, phone_number, is_verified) VALUES
  ((SELECT id FROM auth.users WHERE email = 'admin@parkeasy.com' LIMIT 1), 'admin', 'Admin User', '+91-9999999999', true)
ON CONFLICT (id) DO NOTHING;

-- Create sample parking spaces (you'll need to create owner accounts first)
INSERT INTO parking_spaces (owner_id, title, description, address, city, state, pincode, latitude, longitude, hourly_rate, space_type, total_slots, amenities) VALUES
  ((SELECT id FROM user_profiles WHERE user_type = 'owner' LIMIT 1), 'Secure Parking near Metro', 'Covered parking with CCTV security', '123 Main Street', 'Delhi', 'Delhi', '110001', 28.6139, 77.2090, 50, 'car', 10, ARRAY['CCTV Security', 'Covered Parking', 'Near Metro'])
ON CONFLICT DO NOTHING;
*/

-- GRANT NECESSARY PERMISSIONS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Database setup complete!
-- Next steps:
-- 1. Update your .env file with the Supabase credentials
-- 2. Run: npm install
-- 3. Run: npm run dev
-- 4. Sign up as different user types to test the functionality