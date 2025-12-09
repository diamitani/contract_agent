-- Add column to track when the user last used their free monthly contract
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_free_contract_at TIMESTAMP WITH TIME ZONE;

-- Add column to track how many free contracts used this month (for analytics)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS free_contracts_used_this_month INTEGER DEFAULT 0;
