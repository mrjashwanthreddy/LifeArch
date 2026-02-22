-- Clean up auto-generated tables if Hibernate created them first
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS habits CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;

-- 1. Create the Habits table
CREATE TABLE habits
(
    id            UUID PRIMARY KEY,
    user_id       UUID         NOT NULL,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    frequency     VARCHAR(50)  NOT NULL DEFAULT 'DAILY',
    points_reward INTEGER      NOT NULL DEFAULT 10,
    is_archived   BOOLEAN               DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_habits_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 2. Create the Habit Logs table (records daily check-ins)
CREATE TABLE habit_logs
(
    id             UUID PRIMARY KEY,
    habit_id       UUID NOT NULL,
    completed_date DATE NOT NULL,
    logged_at      TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_habit_logs_habit_id FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
);

-- 3. Create the Point Transactions table (the ledger)
CREATE TABLE point_transactions
(
    id          UUID PRIMARY KEY,
    user_id     UUID         NOT NULL,
    amount      INTEGER      NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_point_transactions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);