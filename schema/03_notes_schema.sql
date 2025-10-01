-- Table: notes
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL, -- Foreign Key to clients table
    author_user_id INTEGER NOT NULL, -- Foreign Key to users table for the note author
    note_date DATE NOT NULL,
    session_type VARCHAR(100), -- e.g., 'Individual Session', 'Group Therapy', 'Assessment', 'Crisis Intervention'
    duration_minutes INTEGER,
    summary TEXT,
    detailed_notes TEXT,
    next_steps TEXT,
    risk_assessment VARCHAR(50), -- e.g., 'Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (author_user_id) REFERENCES users(id)
);
