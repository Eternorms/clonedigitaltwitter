-- Add preferred LLM model column to profiles
ALTER TABLE public.profiles
  ADD COLUMN preferred_model text NOT NULL DEFAULT 'gemini-2.0-flash';
