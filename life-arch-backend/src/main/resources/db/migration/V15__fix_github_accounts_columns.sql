-- V15: Correctly migrate pre-existing github_accounts table (from V1 or V14)
-- 1. Add missing github_id column
ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS github_id BIGINT;

-- 2. Add missing audit columns required by BaseEntity and GitHubAccount entity
ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE github_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. Ensure access_token is TEXT to handle modern OAuth tokens
ALTER TABLE github_accounts ALTER COLUMN access_token TYPE TEXT;
