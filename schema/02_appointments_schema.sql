-- Table: appointments
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL, -- Foreign Key to clients table
    scheduled_by_user_id INTEGER, -- Foreign Key to users table for the support worker/therapist
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    type VARCHAR(100), -- e.g., 'Individual Session', 'Group Therapy', 'Assessment'
    duration VARCHAR(50), -- e.g., '50 min', '90 min'
    details TEXT,
    status VARCHAR(50), -- e.g., 'scheduled', 'completed', 'cancelled', 'rescheduled'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (scheduled_by_user_id) REFERENCES users(id)
);
