/*
  # Fix RLS Policies for Active Issues Table

  1. Security Changes
    - Add RLS policy to allow anonymous users to read from Active Issues table
    - Add RLS policy to allow anonymous users to insert into Active Issues table
    - Add RLS policy to allow anonymous users to update Active Issues table
  
  2. Notes
    - These policies allow public access to the Active Issues table
    - In production, you may want to restrict these policies based on authentication
    - The table already has RLS enabled, so we just need to add the policies
*/

-- Allow anonymous users to read all tickets
CREATE POLICY "Allow anonymous read access"
  ON "Active Issues"
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to insert new tickets
CREATE POLICY "Allow anonymous insert access"
  ON "Active Issues"
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update tickets
CREATE POLICY "Allow anonymous update access"
  ON "Active Issues"
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read all tickets
CREATE POLICY "Allow authenticated read access"
  ON "Active Issues"
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert new tickets
CREATE POLICY "Allow authenticated insert access"
  ON "Active Issues"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update tickets
CREATE POLICY "Allow authenticated update access"
  ON "Active Issues"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);