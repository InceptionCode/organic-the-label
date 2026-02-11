/*
Query to update entitlements
insert into public.entitlements (
  user_id,
  product_gid,
  source,
  shopify_order_gid,
  shopify_customer_gid
)
values
  ($1, $2, 'order', $3, $4)
on conflict (user_id, product_gid)
do update set
  -- keep history stable; only ensure not revoked
  revoked_at = null;
