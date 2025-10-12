-- Table: referrals
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    client_id INTEGER,                              -- Foreign key to clients.id
    client_first_name VARCHAR(255) NOT NULL,
    client_last_name VARCHAR(255) NOT NULL,
    age INTEGER,
    phone VARCHAR(50),
    address VARCHAR(255),
    email VARCHAR(255),
    emergency_first_name VARCHAR(255),
    emergency_last_name VARCHAR(255),
    emergency_phone VARCHAR(255),
    referral_source VARCHAR(255) NOT NULL,
    reason_for_referral TEXT NOT NULL,
    additional_notes TEXT,
    submitted_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending',
    processed_date TIMESTAMP,
    processed_by_user_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Table: referral_timeline
CREATE TABLE referral_timeline (
    id SERIAL PRIMARY KEY,
    referral_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
);
