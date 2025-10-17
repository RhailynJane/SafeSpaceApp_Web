-- Table: crisis_events
CREATE TABLE crisis_events (
    id SERIAL PRIMARY KEY,
    client_id INTEGER, -- Foreign Key to clients table, nullable if event is not client-specific
    initiator_user_id INTEGER, -- Foreign Key to users table for the person initiating the event
    event_type VARCHAR(100) NOT NULL, -- e.g., 'Emergency Call', 'Crisis Hotline', 'Safety Plan Activation', 'Supervisor Consultation', 'Client Contact', 'Risk Status Update'
    event_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    risk_level_at_event VARCHAR(50),
    intervention_details TEXT,
    contact_method VARCHAR(50), -- e.g., 'Phone Call', 'Text Message', 'Email'
    contact_purpose VARCHAR(100), -- e.g., 'Wellness Check', 'Crisis Check-in'
    urgency_level VARCHAR(50), -- e.g., 'Emergency', 'Urgent', 'Normal', 'Low'
    supervisor_contacted_user_id INTEGER, -- Foreign Key to users.id if a supervisor was contacted
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (initiator_user_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_contacted_user_id) REFERENCES users(id)
);
