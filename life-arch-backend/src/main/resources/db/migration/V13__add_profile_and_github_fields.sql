-- V13: Add profile and github fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_connected BOOLEAN DEFAULT FALSE;
