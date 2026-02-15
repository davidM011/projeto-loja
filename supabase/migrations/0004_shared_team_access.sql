-- Shared team access: all authenticated users can view/manage the same sales flow.

drop policy if exists "owner read sales" on public.sales;
drop policy if exists "owner insert sales" on public.sales;
drop policy if exists "owner update sales" on public.sales;
drop policy if exists "owner delete sales" on public.sales;

create policy "auth read sales" on public.sales
for select to authenticated
using (true);

create policy "auth write sales" on public.sales
for all to authenticated
using (true)
with check (true);

drop policy if exists "owner read sale_items" on public.sale_items;
drop policy if exists "owner write sale_items" on public.sale_items;

create policy "auth read sale_items" on public.sale_items
for select to authenticated
using (true);

create policy "auth write sale_items" on public.sale_items
for all to authenticated
using (true)
with check (true);

drop policy if exists "owner read payments" on public.payments;
drop policy if exists "owner insert payments" on public.payments;
drop policy if exists "owner update payments" on public.payments;
drop policy if exists "owner delete payments" on public.payments;

create policy "auth read payments" on public.payments
for select to authenticated
using (true);

create policy "auth write payments" on public.payments
for all to authenticated
using (true)
with check (true);
