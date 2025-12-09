-- Create table for template download submissions
CREATE TABLE IF NOT EXISTS template_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contract_name TEXT NOT NULL,
  contract_slug TEXT NOT NULL,
  app_id TEXT DEFAULT 'contract_agent',
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  webhook_sent BOOLEAN DEFAULT FALSE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_template_downloads_email ON template_downloads(email);
CREATE INDEX IF NOT EXISTS idx_template_downloads_contract ON template_downloads(contract_slug);

-- Enable RLS
ALTER TABLE template_downloads ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon/authenticated users
CREATE POLICY "Allow inserts for template downloads" ON template_downloads
  FOR INSERT WITH CHECK (true);

-- Only allow service role to read all records
CREATE POLICY "Service role can read all downloads" ON template_downloads
  FOR SELECT USING (auth.role() = 'service_role');
