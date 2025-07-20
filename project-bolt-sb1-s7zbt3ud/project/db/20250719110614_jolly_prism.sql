/*
  # Create Admin Settings and Configuration

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique)
      - `setting_value` (text)
      - `description` (text)
      - `updated_by` (uuid, references user_profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `platform_statistics`
      - `id` (uuid, primary key)
      - `total_users` (integer)
      - `total_owners` (integer)
      - `total_customers` (integer)
      - `total_parking_spaces` (integer)
      - `total_bookings` (integer)
      - `total_revenue` (decimal)
      - `total_commission` (decimal)
      - `date` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access only
    
  3. Initial Data
    - Insert default admin settings
*/

-- Create admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  updated_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create platform statistics table
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
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;

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

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin settings
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

-- Create function to update platform statistics
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