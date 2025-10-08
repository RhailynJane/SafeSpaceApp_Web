-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    clerk_user_id VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL, -- e.g., 'admin', 'team-leader', 'support-worker', 'patient'
    password_hash VARCHAR(255), -- For storing hashed passwords
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Table: priority_levels
CREATE TABLE priority_levels (
    id SERIAL PRIMARY KEY,
    level_name VARCHAR(50) UNIQUE NOT NULL,
    order_rank INTEGER
);

-- Table: referral_statuses
CREATE TABLE referral_statuses (
    id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Table: session_types
CREATE TABLE session_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) UNIQUE NOT NULL
);

-- Table: risk_levels
CREATE TABLE risk_levels (
    id SERIAL PRIMARY KEY,
    level_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
