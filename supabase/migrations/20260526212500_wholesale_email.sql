alter table wholesale_accounts
  add column if not exists email text;

create index if not exists wholesale_accounts_email_idx on wholesale_accounts (email);
