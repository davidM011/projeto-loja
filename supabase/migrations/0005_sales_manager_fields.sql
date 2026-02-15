-- Extra fields for simplified 2-user sales manager.

do $$ begin
  alter type payment_method add value 'DINHEIRO';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type payment_method add value 'TRANSFERENCIA';
exception when duplicate_object then null;
end $$;

alter table public.clients
  add column if not exists is_active boolean not null default true;

alter table public.products
  add column if not exists category text,
  add column if not exists min_stock integer not null default 0;

alter table public.sales
  add column if not exists responsible text not null default 'USUARIO_1';

alter table public.payments
  add column if not exists notes text;
