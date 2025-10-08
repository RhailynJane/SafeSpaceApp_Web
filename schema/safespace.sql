CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_user_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'team_leader', 'support_worker'))
);

CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  created_by TEXT, 
  assigned_to INTEGER REFERENCES users(id), -- assigned leader/worker
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined','needs_info')),
  created_at TIMESTAMP DEFAULT now()
);

