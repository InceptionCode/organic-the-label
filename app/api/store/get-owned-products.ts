/*
Query to get all products that a user has access to or owns
select product_gid
from public.entitlements
where user_id = $1
  and revoked_at is null
  and (expires_at is null or expires_at > now())
  and product_gid = any($2::text[]);

*/