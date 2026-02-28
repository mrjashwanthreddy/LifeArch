-- Update the existing saved_filters table from V1 to match the new schema
DO $$ 
BEGIN
    -- Rename query_params to query_string if it exists and change type to TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_filters' AND column_name='query_params') THEN
        ALTER TABLE saved_filters RENAME COLUMN query_params TO query_string;
        ALTER TABLE saved_filters ALTER COLUMN query_string TYPE TEXT;
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_filters' AND column_name='color_hex') THEN
        ALTER TABLE saved_filters ADD COLUMN color_hex VARCHAR(7) DEFAULT '#85a3c2';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_filters' AND column_name='created_at') THEN
        ALTER TABLE saved_filters ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_filters' AND column_name='updated_at') THEN
        ALTER TABLE saved_filters ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Ensure name is VARCHAR(255)
    ALTER TABLE saved_filters ALTER COLUMN name TYPE VARCHAR(255);

END $$;
