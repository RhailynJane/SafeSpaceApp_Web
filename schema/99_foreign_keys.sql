-- This file contains all foreign key constraints to be applied after table creation.

-- Foreign keys for mood_journal.sql
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.mood_entries ADD CONSTRAINT mood_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.mood_factors ADD CONSTRAINT mood_factors_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.mood_entries(id) ON DELETE CASCADE;

-- Foreign keys for 01_clients_schema.sql
ALTER TABLE clients ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Foreign keys for 02_appointments_schema.sql
ALTER TABLE appointments ADD CONSTRAINT appointments_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
ALTER TABLE appointments ADD CONSTRAINT appointments_scheduled_by_user_id_fkey FOREIGN KEY (scheduled_by_user_id) REFERENCES users(id);

-- Foreign keys for 03_notes_schema.sql
ALTER TABLE notes ADD CONSTRAINT notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
ALTER TABLE notes ADD CONSTRAINT notes_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES users(id);

-- Foreign keys for 04_crisis_events_schema.sql
ALTER TABLE crisis_events ADD CONSTRAINT crisis_events_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
ALTER TABLE crisis_events ADD CONSTRAINT crisis_events_initiator_user_id_fkey FOREIGN KEY (initiator_user_id) REFERENCES users(id);
ALTER TABLE crisis_events ADD CONSTRAINT crisis_events_supervisor_contacted_user_id_fkey FOREIGN KEY (supervisor_contacted_user_id) REFERENCES users(id);

-- Foreign keys for 05_referrals_schema.sql
ALTER TABLE referrals ADD CONSTRAINT referrals_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
ALTER TABLE referrals ADD CONSTRAINT referrals_processed_by_user_id_fkey FOREIGN KEY (processed_by_user_id) REFERENCES users(id);

-- Foreign keys for 07_audit_logs_schema.sql
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
