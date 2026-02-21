-- Add the required project_id foreign key to the task_groups table
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS project_id UUID;

-- (Optional) Add the foreign key constraint
ALTER TABLE task_groups
    ADD CONSTRAINT fk_task_groups_project_id
        FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE;