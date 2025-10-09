-- Table: clients
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE, -- Optional: FOREIGN KEY to users.id if every client is also a system user.
    client_first_name VARCHAR(255) NOT NULL,
    client_last_name VARCHAR(255) NOT NULL,
    status VARCHAR(50), -- e.g., 'Active', 'On Hold', 'Inactive'
    last_session_date DATE,
    risk_level VARCHAR(50), -- e.g., 'Low', 'Medium', 'High', 'Critical'
    phone VARCHAR(50),
    email VARCHAR(255),
    address VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);