/*
# Remove temporary email test log table

The email_test_log table was created during initial Resend email
integration testing. It is not used by any production code — the
contact edge function writes submissions to contact_submissions
and sends emails via Resend directly. This migration safely removes
the temporary table.
*/

DROP TABLE IF EXISTS email_test_log;
