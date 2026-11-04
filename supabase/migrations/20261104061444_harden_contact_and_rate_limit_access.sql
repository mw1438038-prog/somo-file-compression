
/*
# Harden contact_submissions and rate_limit_buckets access

## contact_submissions
- Revoke all privileges from anon and authenticated.
- Allow service_role to manage submissions.
- Keep the INSERT policy for documentation. Client roles have no
  table privileges, so they cannot insert directly.

## rate_limit_buckets
- Revoke all privileges from anon and authenticated.
- Allow service_role to manage rate-limit records.

## consume_rate_limit
- Revoke function execution from PUBLIC, anon and authenticated.
- Allow execution only by service_role.
*/

-- contact_submissions: restrict access to service_role
REVOKE ALL PRIVILEGES ON TABLE public.contact_submissions
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.contact_submissions
TO service_role;

DROP POLICY IF EXISTS "anon_insert_contact"
ON public.contact_submissions;

CREATE POLICY "anon_insert_contact"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- rate_limit_buckets: restrict access to service_role
REVOKE ALL PRIVILEGES ON TABLE public.rate_limit_buckets
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.rate_limit_buckets
TO service_role;

-- consume_rate_limit: service_role only
REVOKE EXECUTE
ON FUNCTION public.consume_rate_limit(text, integer, integer)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.consume_rate_limit(text, integer, integer)
TO service_role;
