-- V1__init_schema.sql

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Auth
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Productivity Core: Projects & Groups
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_projects_user_id ON projects(user_id);

CREATE TABLE task_groups (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7)
);
CREATE INDEX idx_task_groups_user_id ON task_groups(user_id);

-- 3. Tasks & Recurrence
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    group_id UUID REFERENCES task_groups(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    priority VARCHAR(2), -- e.g., P1, P2
    due_datetime TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    rrule VARCHAR(255),
    reminder_offset_mins INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_datetime ON tasks(due_datetime);

CREATE TABLE task_occurrences (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    occurrence_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_task_occurrences_task_id ON task_occurrences(task_id);

CREATE TABLE subtasks (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);

CREATE TABLE task_comments (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

-- 4. Filters, Habits & Gamification
CREATE TABLE saved_filters (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    query_params JSONB NOT NULL
);
CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);

CREATE TABLE habits (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    frequency VARCHAR(20) NOT NULL, -- e.g., DAILY, WEEKLY
    target_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_habits_user_id ON habits(user_id);

CREATE TABLE habit_logs (
    id UUID PRIMARY KEY,
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    completed_count INTEGER DEFAULT 1,
    UNIQUE(habit_id, log_date)
);

CREATE TABLE user_points_ledger (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_points_ledger_user_id ON user_points_ledger(user_id);

-- 5. Integrations (GitHub)
CREATE TABLE github_accounts (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_username VARCHAR(100) NOT NULL,
    access_token VARCHAR(255) NOT NULL,
    repo_count INTEGER DEFAULT 0
);

CREATE TABLE github_daily_stats (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    commit_count INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    UNIQUE(user_id, stat_date)
);