-- Performance indexes for common dashboard and receivables queries.

create index if not exists idx_sales_created_by_sale_date on public.sales (created_by, sale_date desc);
create index if not exists idx_sales_client_id on public.sales (client_id);
create index if not exists idx_sales_created_at on public.sales (created_at desc);

create index if not exists idx_payments_created_by_status_due_date on public.payments (created_by, status, due_date);
create index if not exists idx_payments_sale_id on public.payments (sale_id);
create index if not exists idx_payments_created_at on public.payments (created_at desc);
create index if not exists idx_payments_method_due_date on public.payments (method, due_date);

create index if not exists idx_sale_items_sale_id on public.sale_items (sale_id);
