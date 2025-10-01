-- Table: safety_plans
CREATE TABLE safety_plans (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL, -- Foreign Key to clients table
    created_by_user_id INTEGER NOT NULL, -- Foreign Key to users table
    warning_signs TEXT,
    coping_strategies TEXT,
    social_supports TEXT,
    people_for_help TEXT,
    professional_contacts TEXT,
    environment_safety TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);
