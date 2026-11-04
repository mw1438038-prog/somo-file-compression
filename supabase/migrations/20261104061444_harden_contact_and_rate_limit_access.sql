/*
# Harden contact_submissions and rate_limit_buckets access

## Problem
The initial migration for contact_submissions granted only INSERT to
anon/authenticated, but the table's effective grants (visible in the
security posture) include SELECT, UPDATE, and DELETE for both anon and
authenticated. This means any anonymous visitor can read, modify, or
delete every contact submission through the Data API — a serious data
leak. The rate_limit_buckets table has the same over-broad grants.

## Changes

### contact_submissions
1. REVOKE all privileges from anon and authenticated.
2. Re-create the INSERT-only policy (already present, dropped + recreated
   for idempotency) — but since we now revoke all table access from
   anon/authenticated, this policy is inert for those roles. The edge
   function inserts using the service_role key, which bypasses RLS.
3. Grant SELECT, INSERT, UPDATE, DELETE to service_role so the edge
   function (and future admin tooling) can manage submissions.

### rate_limit_buckets
1. REVOKE all privileges from anon and authenticated.
2. Grant SELECT, INSERT, UPDATE, DELETE to service_role only.
   The consume_rate_limit() function is SECURITY DEFINER and handles
   all rate-limit operations internally, so anon/authenticated do not
   need direct table access.

### consume_rate_limit function
1. REVOKE EXECUTE from PUBLIC and anon so only authenticated/service_role
   can call it. The edge function uses the service_role key.
2. GRANT EXECUTE to authenticated (covers service_role which
   authenticates as the service role).

## Security Impact
- Anonymous visitors can NO LONGER read, update, or delete contact
  submissions through the Data API.
- Contact submissions are now written only by the edge function using
  the service_role key (which bypasses RLS safely on the server side).
- Rate limit buckets are no longer directly accessible to anon/authenticated.
- The consume_rate_limit RPC is no longer callable by anonymous clients.
*/

-- ---------------------------------------------------------------
-- contact_submissions: lock down to service_role only
-- ---------------------------------------------------------------
REVOKE SELECT, INSERT, UPDATE, DELETE ON contact_submissions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_submissions TO service_role;

-- Keep the INSERT policy for documentation/idempotency, but it is now
-- inert for anon/authenticated since table-level INSERT was revoked.
DROP POLICY IF EXISTS "anon_insert_contact" ON contact_submissions;
CREATE POLICY "anon_insert_contact"
ON contact_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ---------------------------------------------------------------
-- rate_limit_buckets: lock down to service_role only
-- ---------------------------------------------------------------
REVOKE SELECT, INSERT, UPDATE, DELETE ON rate_limit_buckets FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limit_buckets TO service_role;

-- ---------------------------------------------------------------
-- consume_rate_limit: restrict EXECUTE to authenticated+ only
-- ---------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION consume_rate_limit(text, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION consume_rate_limit(text, integer, integer) TO authenticated;
