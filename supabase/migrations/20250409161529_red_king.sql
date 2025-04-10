-- Create the payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id text NOT NULL,
  offer_type text NOT NULL,
  user_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to insert payment_requests"
  ON payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to view their own payment_requests"
  ON payment_requests
  FOR SELECT
  TO authenticated
  USING (user_email = auth.email());

CREATE POLICY "Allow admins to view all payment_requests"
  ON payment_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY "Allow admins to update payment_requests"
  ON payment_requests
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