/*
  # Create booking_user_info table

  1. New Tables
    - `booking_user_info`
      - `id` (uuid, primary key)
      - `offer_id` (text, not null)
      - `offer_type` (text, not null)
      - `name` (text, not null)
      - `email` (text, not null)
      - `phone` (text, not null)
      - `birthdate` (date, nullable)
      - `additional_services` (jsonb, default '{}')
      - `special_requests` (text, nullable)
      - `created_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on booking_user_info table
    - Add policies for authenticated users
*/

-- Create the booking_user_info table
CREATE TABLE IF NOT EXISTS booking_user_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id text NOT NULL,
  offer_type text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  birthdate date,
  additional_services jsonb DEFAULT '{}'::jsonb,
  special_requests text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE booking_user_info ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to insert booking_user_info"
  ON booking_user_info
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to view their own booking_user_info"
  ON booking_user_info
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

CREATE POLICY "Allow admins to view all booking_user_info"
  ON booking_user_info
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );