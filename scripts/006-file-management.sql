-- Add folder support and file metadata to uploaded_files
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending';
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS analysis_result JSONB;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for analytics
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for contract files if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-files', 'contract-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'contract-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (bucket_id = 'contract-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (bucket_id = 'contract-files' AND auth.uid()::text = (storage.foldername(name))[1]);
