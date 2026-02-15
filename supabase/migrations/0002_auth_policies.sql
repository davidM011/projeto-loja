-- Restrict access to authenticated users and owner-scoped sales/payments.

alter table public.sales alter column created_by set default auth.uid();
alter table public.payments alter column created_by set default auth.uid();

drop policy if exists "public read clients" on public.clients;
drop policy if exists "public write clients" on public.clients;
create policy "auth read clients" on public.clients for select to authenticated using (true);
create policy "auth write clients" on public.clients for all to authenticated using (true) with check (true);

drop policy if exists "public read products" on public.products;
drop policy if exists "public write products" on public.products;
create policy "auth read products" on public.products for select to authenticated using (true);
create policy "auth write products" on public.products for all to authenticated using (true) with check (true);

drop policy if exists "public read sales" on public.sales;
drop policy if exists "public write sales" on public.sales;
create policy "owner read sales" on public.sales for select to authenticated using (created_by = auth.uid());
create policy "owner insert sales" on public.sales for insert to authenticated with check (created_by = auth.uid());
create policy "owner update sales" on public.sales for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "owner delete sales" on public.sales for delete to authenticated using (created_by = auth.uid());

drop policy if exists "public read sale_items" on public.sale_items;
drop policy if exists "public write sale_items" on public.sale_items;
create policy "owner read sale_items" on public.sale_items
for select to authenticated
using (
  exists (
    select 1 from public.sales s where s.id = sale_items.sale_id and s.created_by = auth.uid()
  )
);
create policy "owner write sale_items" on public.sale_items
for all to authenticated
using (
  exists (
    select 1 from public.sales s where s.id = sale_items.sale_id and s.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.sales s where s.id = sale_items.sale_id and s.created_by = auth.uid()
  )
);

drop policy if exists "public read payments" on public.payments;
drop policy if exists "public write payments" on public.payments;
create policy "owner read payments" on public.payments for select to authenticated using (created_by = auth.uid());
create policy "owner insert payments" on public.payments for insert to authenticated with check (created_by = auth.uid());
create policy "owner update payments" on public.payments for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "owner delete payments" on public.payments for delete to authenticated using (created_by = auth.uid());
