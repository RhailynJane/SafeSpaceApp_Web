-- Table: referrals
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    client_id INTEGER, -- Optional: FOREIGN KEY to clients.id if the referral is for an existing client.
    client_name VARCHAR(255) NOT NULL,
    age INTEGER,
    phone VARCHAR(50),
    address VARCHAR(255),
    email VARCHAR(255),
    emergency_contact VARCHAR(255),
    referral_source VARCHAR(255) NOT NULL,
    priority_level VARCHAR(50) NOT NULL,
    reason_for_referral TEXT NOT NULL,
    additional_notes TEXT,
    submitted_date DATE,
    status VARCHAR(50), -- e.g., 'pending', 'accepted', 'declined', 'more-info-requested', 'assigned', 'in-progress', 'completed'
    processed_date DATE,
    processed_by_user_id INTEGER, -- FOREIGN KEY to users.id for the user who processed it
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (processed_by_user_id) REFERENCES users(id)
);
