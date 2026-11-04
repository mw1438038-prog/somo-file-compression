/*
# Rate limit buckets for the public PDF compression endpoint

1. New Tables
- `rate_limit_buckets`: one row per anonymous abuse-prevention key (a hashed client identifier).
  - `bucket_key` (text, primary key)
  - `window_start` (timestamptz): when the current counting window began
  - `hits` (integer): requests counted in the current window

2. New Functions
- `consume_rate_limit(p_key, p_limit, p_window_seconds)`: atomically counts one request for a key and reports whether it is within the limit, how many were counted, and how many seconds remain until the window resets. Runs with the owner's rights so the table never needs to be exposed.

3. Security
- Row level security is enabled on `rate_limit_buckets` with no policies, and no table privileges are granted to `anon` or `authenticated`. Clients cannot read or change counters.
- `consume_rate_limit` is executable only by `service_role`, which only the server-side edge function holds.

4. Notes
- Old windows are pruned opportunistically when a new window starts, so the table stays small.
- Limits are passed in by the caller, so they can be changed without a migration.
*/

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  bucket_key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_window_start_idx ON public.rate_limit_buckets (window_start);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS TABLE (is_allowed boolean, current_hits integer, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := now();
  v_window interval := make_interval(secs => p_window_seconds);
  v_start timestamptz;
  v_hits integer;
BEGIN
  INSERT INTO public.rate_limit_buckets AS b (bucket_key, window_start, hits)
  VALUES (p_key, v_now, 1)
  ON CONFLICT (bucket_key) DO UPDATE SET
    window_start = CASE WHEN b.window_start + v_window <= v_now THEN v_now ELSE b.window_start END,
    hits = CASE WHEN b.window_start + v_window <= v_now THEN 1 ELSE b.hits + 1 END
  RETURNING b.window_start, b.hits INTO v_start, v_hits;

  IF v_start = v_now THEN
    DELETE FROM public.rate_limit_buckets WHERE window_start < v_now - (v_window * 24);
  END IF;

  is_allowed := v_hits <= p_limit;
  current_hits := v_hits;
  retry_after_seconds := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_start + v_window - v_now)))::integer);
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;
