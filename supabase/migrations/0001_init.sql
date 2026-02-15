-- Supabase / Postgres schema for MVP

create extension if not exists pgcrypto;

do $$ begin
  create type payment_method as enum ('PIX', 'CARTAO', 'MES_SEGUINTE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('PENDENTE', 'CONFIRMADO', 'ATRASADO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type sale_status as enum ('PENDENTE', 'PARCIAL', 'PAGA', 'ATRASADA', 'CANCELADA');
exception when duplicate_object then null;
end $$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  sale_price numeric(12,2) not null check (sale_price >= 0),
  cost_price numeric(12,2),
  stock integer,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id),
  sale_date date not null,
  total numeric(12,2) not null check (total >= 0),
  status sale_status not null default 'PENDENTE',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty integer not null check (qty > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  method payment_method not null,
  amount numeric(12,2) not null check (amount > 0),
  status payment_status not null,
  due_date date,
  paid_at timestamptz,
  card_installments integer,
  card_brand text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create or replace function public.next_month_day_10(sale_date date)
returns date
language sql
immutable
as $$
  select (date_trunc('month', sale_date) + interval '1 month' + interval '9 days')::date;
$$;

create or replace function public.payment_compute_status(p_due_date date, p_paid_at timestamptz)
returns payment_status
language plpgsql
stable
as $$
begin
  if p_paid_at is not null then
    return 'CONFIRMADO';
  end if;

  if p_due_date is not null and p_due_date < current_date then
    return 'ATRASADO';
  end if;

  return 'PENDENTE';
end;
$$;

create or replace function public.payments_before_write()
returns trigger
language plpgsql
as $$
declare
  v_sale_date date;
begin
  select sale_date into v_sale_date from public.sales where id = new.sale_id;

  if new.method = 'MES_SEGUINTE' then
    if new.due_date is null then
      new.due_date := public.next_month_day_10(v_sale_date);
    end if;
  else
    new.due_date := null;
  end if;

  if new.paid_at is null and new.method <> 'MES_SEGUINTE' and (new.status is null or new.status = 'CONFIRMADO') then
    new.paid_at := now();
  end if;

  new.status := public.payment_compute_status(new.due_date, new.paid_at);
  return new;
end;
$$;

drop trigger if exists trg_payments_before_write on public.payments;
create trigger trg_payments_before_write
before insert or update on public.payments
for each row execute function public.payments_before_write();

create or replace function public.sales_refresh_status(p_sale_id uuid)
returns void
language plpgsql
as $$
declare
  v_total numeric(12,2);
  v_confirmed numeric(12,2);
  v_has_overdue boolean;
begin
  select s.total into v_total from public.sales s where s.id = p_sale_id;

  select coalesce(sum(amount), 0)
  into v_confirmed
  from public.payments
  where sale_id = p_sale_id and status = 'CONFIRMADO';

  select exists(
    select 1
    from public.payments
    where sale_id = p_sale_id
      and status = 'ATRASADO'
  )
  into v_has_overdue;

  update public.sales
  set status = case
    when v_confirmed >= v_total then 'PAGA'
    when v_confirmed > 0 then case when v_has_overdue then 'ATRASADA' else 'PARCIAL' end
    else case when v_has_overdue then 'ATRASADA' else 'PENDENTE' end
  end
  where id = p_sale_id;
end;
$$;

create or replace function public.trg_payments_refresh_status()
returns trigger
language plpgsql
as $$
begin
  perform public.sales_refresh_status(coalesce(new.sale_id, old.sale_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_payments_refresh_status on public.payments;
create trigger trg_payments_refresh_status
after insert or update or delete on public.payments
for each row execute function public.trg_payments_refresh_status();

alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;

drop policy if exists "public read clients" on public.clients;
create policy "public read clients" on public.clients for select to anon, authenticated using (true);
drop policy if exists "public write clients" on public.clients;
create policy "public write clients" on public.clients for all to anon, authenticated using (true) with check (true);

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select to anon, authenticated using (true);
drop policy if exists "public write products" on public.products;
create policy "public write products" on public.products for all to anon, authenticated using (true) with check (true);

drop policy if exists "public read sales" on public.sales;
create policy "public read sales" on public.sales for select to anon, authenticated using (true);
drop policy if exists "public write sales" on public.sales;
create policy "public write sales" on public.sales for all to anon, authenticated using (true) with check (true);

drop policy if exists "public read sale_items" on public.sale_items;
create policy "public read sale_items" on public.sale_items for select to anon, authenticated using (true);
drop policy if exists "public write sale_items" on public.sale_items;
create policy "public write sale_items" on public.sale_items for all to anon, authenticated using (true) with check (true);

drop policy if exists "public read payments" on public.payments;
create policy "public read payments" on public.payments for select to anon, authenticated using (true);
drop policy if exists "public write payments" on public.payments;
create policy "public write payments" on public.payments for all to anon, authenticated using (true) with check (true);
