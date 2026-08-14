-- 00024_pgcrypto_secrets.sql
-- Encrypt therapist secrets (Stripe, Cal.com, Daily, Resend, MiroTalk keys) at rest.

create extension if not exists pgcrypto with schema extensions;

-- pgcrypto lives in the `extensions` schema on Supabase, not `public`, and
-- that schema is not on the search_path used to validate function bodies at
-- CREATE time. encrypt()/decrypt() are therefore qualified explicitly --
-- unqualified calls fail with 42883 "function encrypt(bytea, bytea, unknown)
-- does not exist". encode/decode/convert_to/convert_from are pg_catalog
-- builtins and need no qualification.

-- Encrypt a plaintext value with a key (key passed per-call from env THERAPIST_SECRET_KEY)
create or replace function encrypt_secret(plain text, key text)
returns text
language sql
as $$
  select encode(extensions.encrypt(convert_to(plain, 'utf8'), convert_to(key, 'utf8'), 'aes'), 'base64');
$$;

-- Decrypt a ciphertext value
create or replace function decrypt_secret(cipher text, key text)
returns text
language sql
as $$
  select convert_from(extensions.decrypt(decode(cipher, 'base64'), convert_to(key, 'utf8'), 'aes'), 'utf8');
$$;

-- Only service role can use these functions
revoke execute on function encrypt_secret(text, text) from anon, authenticated;
revoke execute on function decrypt_secret(text, text) from anon, authenticated;
grant execute on function encrypt_secret(text, text) to service_role;
grant execute on function decrypt_secret(text, text) to service_role;