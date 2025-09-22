-- Custom ENUM type for mood options
CREATE TYPE public.mood_enum AS ENUM (
    'very-sad',
    'sad',
    'neutral',
    'happy',
    'very-happy'
);

-- Journal Entries Table (Related to moods)
CREATE TABLE public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id INTEGER NOT NULL, -- Changed from uuid to INTEGER
    title character varying(255) NOT NULL,
    content text NOT NULL,
    mood_type public.mood_enum,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
    CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- Updated reference
);

-- Mood Entries Table (Core of the feature)
CREATE TABLE public.mood_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id INTEGER NOT NULL, -- Changed from uuid to INTEGER
    mood_type public.mood_enum NOT NULL,
    intensity smallint NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mood_entries_pkey PRIMARY KEY (id),
    CONSTRAINT mood_entries_intensity_check CHECK (((intensity >= 1) AND (intensity <= 5))),
    CONSTRAINT mood_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- Updated reference
);

-- Mood Factors Table (Adds context to a mood entry)
CREATE TABLE public.mood_factors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entry_id uuid NOT NULL,
    factor character varying(100) NOT NULL,
    CONSTRAINT mood_factors_pkey PRIMARY KEY (id),
    CONSTRAINT mood_factors_entry_id_factor_key UNIQUE (entry_id, factor),
    CONSTRAINT mood_factors_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.mood_entries(id) ON DELETE CASCADE
);

-- Indexes for performance on frequently queried columns
CREATE INDEX idx_journal_entries_user_id ON public.journal_entries USING btree (user_id);
CREATE INDEX idx_mood_entries_user_id ON public.mood_entries USING btree (user_id);
CREATE INDEX idx_mood_factors_entry_id ON public.mood_factors USING btree (entry_id);