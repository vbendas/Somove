-- 00024_pgcrypto_secrets.sql
-- Encrypt therapist secrets (Stripe, Cal.com, Daily, Resend, MiroTalk keys) at rest.

create extension if not exists pgcrypto;

-- Encrypt a plaintext value with a key (key passed per-call from env THERAPIST_SECRET_KEY)
create or replace function encrypt_secret(plain text, key text)
returns text
language sql
as $$
  select encode(encrypt(convert_to(plain, 'utf8'), convert_to(key, 'utf8'), 'aes'), 'base64');
$$;

-- Decrypt a ciphertext value
create or replace function decrypt_secret(cipher text, key text)
returns text
language sql
as $$
  select convert_from(decrypt(decode(cipher, 'base64'), convert_to(key, 'utf8'), 'aes'), 'utf8');
$$;

-- Only service role can use these functions
revoke execute on function encrypt_secret(text, text) from anon, authenticated;
revoke execute on function decrypt_secret(text, text) from anon, authenticated;
grant execute on function encrypt_secret(text, text) to service_role;
grant execute on function decrypt_secret(text, text) to service_role;