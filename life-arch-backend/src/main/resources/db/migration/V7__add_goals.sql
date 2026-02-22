-- V7: Add the goals table for long-term goal tracking

CREATE TABLE goals
(
    id           UUID PRIMARY KEY,
    user_id      UUID         NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    target_date  DATE,
    is_completed BOOLEAN      NOT NULL DEFAULT FALSE,
    completed_at DATE,
    created_at   TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_goals_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
