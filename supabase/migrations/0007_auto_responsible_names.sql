-- Remove fixed user roles and normalize sale responsible names.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  drop column if exists role;

alter table public.sales
  alter column responsible drop default;

update public.sales s
set responsible = p.full_name
from public.profiles p
where s.created_by = p.id
  and p.full_name is not null
  and btrim(p.full_name) <> ''
  and (
    s.responsible is null
    or btrim(s.responsible) = ''
    or s.responsible in ('USUARIO_1', 'USUARIO_2')
  );
