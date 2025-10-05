-- Table: audit_logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    user_id INTEGER, -- Foreign Key to users table
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details TEXT
    FOREIGN KEY (user_id) REFERENCES users(id)
);
