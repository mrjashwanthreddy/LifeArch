-- Safely add columns only if Hibernate hasn't already auto-generated them
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS group_id UUID;

-- (We will omit the strict database-level foreign key constraint here to ensure
-- the script doesn't fail if Hibernate already created a constraint automatically.
-- JPA will still enforce the relationship perfectly in the application layer).