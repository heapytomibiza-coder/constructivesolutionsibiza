-- Backfill missing profiles for existing auth users (older accounts can predate the trigger)
INSERT INTO public.profiles (user_id, phone)
SELECT
  u.id,
  NULLIF(u.raw_user_meta_data->>'phone', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;