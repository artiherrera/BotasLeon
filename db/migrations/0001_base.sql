-- ============================================================================
-- Cotizaciones y notas de venta — esquema base (Postgres en RDS)
--
-- Reescrito desde la versión de Supabase. Aquellas migraciones colgaban de
-- `auth.users`, `auth.uid()` y de roles de RLS que solo existen dentro de
-- Supabase. Aquí el único cliente de la base es la Lambda: la autorización se
-- resuelve ahí verificando el token de Cognito, y la base concede permisos a un
-- rol de aplicación en vez de a `authenticated`.
--
-- Idempotente a propósito: la corre una Lambda de migración que puede
-- reejecutarse sin romper nada.
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Vendedores ──────────────────────────────────────────────────────────────
-- Espejo local de los usuarios de Cognito. Existe para poder poner una llave
-- foránea de verdad y para mostrar el nombre en los documentos sin llamar a
-- Cognito en cada consulta. `cognito_sub` es el identificador estable del token.
create table if not exists vendedores (
  id          uuid primary key default gen_random_uuid(),
  cognito_sub text unique not null,
  email       text not null,
  nombre      text not null default '',
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Folio consecutivo por serie y año ───────────────────────────────────────
-- Que lo genere la base y no el formulario: dos vendedores capturando el mismo
-- día se pisarían el número, y un consecutivo con huecos o repetidos no hay
-- forma de explicarlo después.
create table if not exists folio_counters (
  serie text not null,
  year  int  not null,
  last  int  not null default 0,
  primary key (serie, year)
);

create or replace function next_folio_serie(p_serie text) returns text
language plpgsql security definer set search_path = public as $$
declare
  y int := extract(year from now())::int;
  n int;
begin
  insert into folio_counters (serie, year, last) values (p_serie, y, 1)
    on conflict (serie, year) do update set last = folio_counters.last + 1
    returning last into n;
  return p_serie || '-' || y || '-' || lpad(n::text, 4, '0');
end $$;

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ── quotes: el documento vivo ───────────────────────────────────────────────
create table if not exists quotes (
  id             uuid primary key default gen_random_uuid(),
  folio          text unique not null default next_folio_serie('COT'),
  estado         text not null default 'borrador'
                 check (estado in ('borrador','enviada','aceptada','rechazada')),
  cliente        text not null default '',
  atiende        text not null default '',
  vendedor_id    uuid references vendedores(id),
  moneda         text not null default 'MXN' check (moneda in ('MXN','USD')),
  idioma         text not null default 'es'  check (idioma in ('es','en')),
  total          numeric(12,2) not null default 0,
  pares          int not null default 0,
  vigencia_hasta date,
  version_actual int not null default 0,
  data           jsonb not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists quotes_updated_idx  on quotes (updated_at desc);
create index if not exists quotes_estado_idx   on quotes (estado);
create index if not exists quotes_vendedor_idx on quotes (vendedor_id);
create index if not exists quotes_cliente_idx  on quotes (lower(cliente));

drop trigger if exists quotes_touch on quotes;
create trigger quotes_touch before update on quotes
  for each row execute function touch_updated_at();

-- ── quote_versions: lo que el cliente realmente recibió ─────────────────────
-- Editar una cotización ya enviada NO reescribe lo que se prometió: suma una
-- versión congelada.
create table if not exists quote_versions (
  id          uuid primary key default gen_random_uuid(),
  quote_id    uuid not null references quotes(id) on delete cascade,
  version_no  int not null,
  data        jsonb not null,
  emitida_por uuid references vendedores(id),
  emitida_en  timestamptz not null default now(),
  unique (quote_id, version_no)
);

create index if not exists quote_versions_quote_idx
  on quote_versions (quote_id, version_no desc);

create or replace function emitir_quote(p_quote_id uuid, p_vendedor uuid default null)
returns int language plpgsql set search_path = public as $$
declare v int; d jsonb;
begin
  select data, version_actual + 1 into d, v from quotes where id = p_quote_id;
  if d is null then raise exception 'Cotización % no existe', p_quote_id; end if;
  insert into quote_versions (quote_id, version_no, data, emitida_por)
    values (p_quote_id, v, d, p_vendedor);
  update quotes set version_actual = v, estado = 'enviada' where id = p_quote_id;
  return v;
end $$;
