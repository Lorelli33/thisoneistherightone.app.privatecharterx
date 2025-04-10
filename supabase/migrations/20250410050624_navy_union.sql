/*
  # Create partner and yacht listing tables

  1. New Tables
    - `partners`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_name` (text)
      - `contact_name` (text)
      - `email` (text)
      - `phone` (text)
      - `website` (text)
      - `description` (text)
      - `tier` (text)
      - `status` (text)
      - `subscription_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `expires_at` (timestamp)
    
    - `yacht_listings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `yacht_name` (text)
      - `yacht_size` (text)
      - `yacht_type` (text)
      - `yacht_year` (text)
      - `yacht_capacity` (text)
      - `yacht_location` (text)
      - `description` (text)
      - `contact_name` (text)
      - `email` (text)
      - `phone` (text)
      - `tier` (text)
      - `status` (text)
      - `subscription_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `expires_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create the partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  website text,
  description text,
  tier text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create the yacht_listings table
CREATE TABLE IF NOT EXISTS yacht_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  yacht_name text NOT NULL,
  yacht_size text NOT NULL,
  yacht_type text,
  yacht_year text,
  yacht_capacity text,
  yacht_location text,
  description text,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  tier text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_listings ENABLE ROW LEVEL SECURITY;

-- Create policies for partners table
CREATE POLICY "Allow users to view their own partner records"
  ON partners
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert their own partner records"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own partner records"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admins to view all partner records"
  ON partners
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "Allow admins to update all partner records"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Create policies for yacht_listings table
CREATE POLICY "Allow users to view their own yacht listings"
  ON yacht_listings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert their own yacht listings"
  ON yacht_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own yacht listings"
  ON yacht_listings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admins to view all yacht listings"
  ON yacht_listings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "Allow admins to update all yacht listings"
  ON yacht_listings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Create public policies for viewing active listings
CREATE POLICY "Allow public to view active partners"
  ON partners
  FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Allow public to view active yacht listings"
  ON yacht_listings
  FOR SELECT
  TO public
  USING (status = 'active');