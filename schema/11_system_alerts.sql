-- Table: system_alerts
CREATE TABLE system_alerts (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) NOT NULL, -- e.g., 'success', 'warning', 'error'
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

