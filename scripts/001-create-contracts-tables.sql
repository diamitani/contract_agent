-- Create contracts table to store generated contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  content TEXT NOT NULL,
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploaded_files table to store contract-related files
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts
CREATE POLICY "contracts_select_own" ON contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contracts_insert_own" ON contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contracts_update_own" ON contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "contracts_delete_own" ON contracts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for uploaded_files
CREATE POLICY "uploaded_files_select_own" ON uploaded_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "uploaded_files_insert_own" ON uploaded_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "uploaded_files_update_own" ON uploaded_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "uploaded_files_delete_own" ON uploaded_files
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS contracts_user_id_idx ON contracts(user_id);
CREATE INDEX IF NOT EXISTS contracts_created_at_idx ON contracts(created_at DESC);
CREATE INDEX IF NOT EXISTS uploaded_files_user_id_idx ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS uploaded_files_contract_id_idx ON uploaded_files(contract_id);
