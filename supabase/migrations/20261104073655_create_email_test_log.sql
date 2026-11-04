CREATE TABLE IF NOT EXISTS email_test_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE email_test_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON email_test_log FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_test_log TO service_role;
