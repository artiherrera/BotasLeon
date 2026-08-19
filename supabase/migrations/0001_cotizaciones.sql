-- ============================================================================
-- Cotizaciones de mayoreo — esquema inicial
--
-- Contexto: el cotizador vive entero en el navegador (el storefront es estático
-- porque Amplify da 500 en rutas dinámicas de Next 16). Por eso el cliente habla
-- directo con PostgREST y TODA la autorización tiene que vivir aquí, en RLS.
--
-- Decisión central: `quotes` es el documento vivo y `quote_versions` guarda una
-- copia congelada de cada emisión. Editar una cotización ya enviada NO reescribe
-- lo que el cliente recibió: suma una versión.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Folio consecutivo por año ───────────────────────────────────────────────
-- Hoy el folio es texto libre en el formulario y dos vendedores pueden repetirlo
-- el mismo día. Que lo genere la base elimina el problema de raíz.
create table if not exists folio_counters (
  year  int primary key,
  last  int not null default 0
);

create or replace function next_folio() returns text
language plpgsql security definer set search_path = public as $$
declare
  y int := extract(year from now())::int;
  n int;
begin
  insert into folio_counters (year, last) values (y, 1)
    on conflict (year) do update set last = folio_counters.last + 1
    returning last into n;
  return 'COT-' || y || '-' || lpad(n::text, 4, '0');
end $$;

-- ── quotes: el documento vivo ───────────────────────────────────────────────
create table if not exists quotes (
  id             uuid primary key default gen_random_uuid(),
  folio          text unique not null default next_folio(),
  estado         text not null default 'borrador'
                 check (estado in ('borrador','enviada','aceptada','rechazada')),
  cliente        text not null default '',
  atiende        text not null default '',          -- compat con el cotizador actual
  vendedor_id    uuid references auth.users(id) default auth.uid(),
  moneda         text not null default 'MXN' check (moneda in ('MXN','USD')),
  idioma         text not null default 'es' check (idioma in ('es','en')),
  total          numeric(12,2) not null default 0,
  pares          int not null default 0,
  -- Fecha REAL de vigencia: permite calcular "vencida" sin que nadie la teclee.
  -- El texto legible que sale en el PDF sigue viviendo dentro de `data`.
  vigencia_hasta date,
  version_actual int not null default 0,            -- 0 = nunca emitida
  data           jsonb not null,                    -- el Quote completo (ítems, líneas, precios)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists quotes_updated_idx  on quotes (updated_at desc);
create index if not exists quotes_estado_idx   on quotes (estado);
create index if not exists quotes_vendedor_idx on quotes (vendedor_id);
create index if not exists quotes_cliente_idx  on quotes (lower(cliente));

-- `updated_at` lo pone la base, no el cliente: es la referencia del bloqueo
-- optimista (el PATCH viaja condicionado al valor que se leyó).
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists quotes_touch on quotes;
create trigger quotes_touch before update on quotes
  for each row execute function touch_updated_at();

-- ── quote_versions: lo que el cliente realmente recibió ─────────────────────
create table if not exists quote_versions (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references quotes(id) on delete cascade,
  version_no  int not null,
  data        jsonb not null,
  emitida_por uuid references auth.users(id) default auth.uid(),
  emitida_en  timestamptz not null default now(),
  unique (quote_id, version_no)
);

create index if not exists quote_versions_quote_idx on quote_versions (quote_id, version_no desc);

-- Emitir = congelar. Devuelve el número de versión recién creado.
create or replace function emitir_quote(p_quote_id uuid) returns int
language plpgsql security invoker set search_path = public as $$
declare
  v int;
  d jsonb;
begin
  select data, version_actual + 1 into d, v from quotes where id = p_quote_id;
  if d is null then raise exception 'Cotización % no existe', p_quote_id; end if;
  insert into quote_versions (quote_id, version_no, data) values (p_quote_id, v, d);
  update quotes set version_actual = v, estado = 'enviada' where id = p_quote_id;
  return v;
end $$;

-- ── RLS: sin sesión iniciada no se devuelve una sola fila ───────────────────
-- La anon key viaja en el bundle público por diseño. Lo que impide que
-- cualquiera lea clientes y precios de mayoreo es exclusivamente esto.
alter table quotes         enable row level security;
alter table quote_versions enable row level security;
alter table folio_counters enable row level security;

drop policy if exists quotes_rw on quotes;
create policy quotes_rw on quotes
  for all to authenticated using (true) with check (true);

-- Las versiones se leen y se crean, nunca se editan ni se borran: son el
-- registro de lo que se prometió.
drop policy if exists versions_read on quote_versions;
create policy versions_read on quote_versions
  for select to authenticated using (true);

drop policy if exists versions_insert on quote_versions;
create policy versions_insert on quote_versions
  for insert to authenticated with check (true);

-- Nadie toca el contador directamente; solo la función next_folio().
revoke all on folio_counters from anon, authenticated;
