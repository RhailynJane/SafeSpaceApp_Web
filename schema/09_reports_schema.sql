-- Table: reports
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    report_date DATE,
    type VARCHAR(50), -- e.g., 'PDF', 'Excel', 'Caseload Summary', 'Session Reports'
    size_mb NUMERIC(5,2),
    generated_by_user_id INTEGER, -- Foreign Key to users table
    data_json JSONB, -- For storing structured report data
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    FOREIGN KEY (generated_by_user_id) REFERENCES users(id)
);
