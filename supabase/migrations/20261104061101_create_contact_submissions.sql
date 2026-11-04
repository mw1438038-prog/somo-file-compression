/*
# Create contact_submissions table

1. New Tables
- `contact_submissions`
  - `id` (uuid, primary key)
  - `name` (text, 1–100 chars, not null) — sender's full name
  - `email` (text, 1–254 chars, not null) — sender's email address
  - `subject` (text, 3–200 chars, not null) — message subject line
  - `message` (text, 10–5000 chars, not null) — the message body
  - `created_at` (timestamptz, default now()) — submission timestamp

2. Security
- Enable RLS on `contact_submissions`.
- Grant INSERT only to `anon` + `authenticated` (no SELECT/UPDATE/DELETE):
  visitors can submit messages but cannot read, modify, or delete any
  submissions — this prevents data exfiltration of other people's messages.
- INSERT policy uses `WITH CHECK (true)` since any visitor may submit.
  No SELECT policy exists, so no rows are ever returned to the frontend.
- `service_role` is granted full access so edge functions / admin tooling
  can read submissions if needed later.

3. Important Notes
- The frontend uses the anon key, so inserts run as the `anon` role.
- Column length constraints act as server-side validation even if the
  client validation is bypassed.
- No `user_id` column — this app has no sign-in, so no ownership scoping.
*/

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 1 AND 254),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Only INSERT is granted to anon/authenticated. No SELECT = no data leaks.
GRANT INSERT ON contact_submissions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_submissions TO service_role;

DROP POLICY IF EXISTS "anon_insert_contact" ON contact_submissions;
CREATE POLICY "anon_insert_contact"
ON contact_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);
