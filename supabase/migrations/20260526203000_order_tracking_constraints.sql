alter table orders
  add constraint orders_stripe_checkout_session_id_key unique (stripe_checkout_session_id);

alter table affiliate_commissions
  add constraint affiliate_commissions_affiliate_order_key unique (affiliate_id, order_id);
