-- Drop old admin views replaced by SECURITY DEFINER RPCs
DROP VIEW IF EXISTS public.admin_users_list;
DROP VIEW IF EXISTS public.admin_platform_stats;