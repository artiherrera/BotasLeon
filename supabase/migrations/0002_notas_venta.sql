-- ============================================================================
-- Notas de venta comerciales
--
-- Una nota de venta NO es una cotización con otro nombre, y por eso vive en su
-- propia tabla en vez de en una columna `tipo` sobre `quotes`:
--
--   cotización            nota de venta
--   ─────────────────     ─────────────────────────
--   propuesta             registro de algo vendido
--   vence                 no vence
--   se reedita (versión)  se congela al emitirse
--   sin dinero recibido   con anticipos y saldo
--
-- Mezclarlas obligaría a que la mitad de las columnas estén siempre en null y a
-- que cada consulta arrastre un `where tipo = ...`. Separadas, cada una puede
-- tener sus propias reglas de inmutabilidad, que es justo lo que las distingue.
--
-- Contexto del negocio: son dos vendedores tomando pedidos por WhatsApp con
-- precios que arman al momento, sobre botas hechas a pedido (25-35 días). De
-- ahí salen las dos decisiones de diseño principales: los pagos son PARCIALES
-- (anticipo al pedir, saldo al entregar) y hay que poder saber quién vendió qué.
-- ============================================================================

-- ── Folio por serie ─────────────────────────────────────────────────────────
-- La 0001 fija el prefijo 'COT-' dentro de next_folio(). Las notas necesitan su
-- propia serie y su propio consecutivo: NV-2026-0001 no debe consumir números
-- de COT-2026-xxxx. Se generaliza el contador por (serie, año) y next_folio()
-- se conserva delegando, para no romper el default de `quotes.folio`.
alter table folio_counters add column if not exists serie text not null default 'COT';

-- La PK pasa de (year) a (serie, year).
alter table folio_counters drop constraint if exists folio_counters_pkey;
alter table folio_counters add primary key (serie, year);

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

create or replace function next_folio() returns text
language plpgsql security definer set search_path = public as $$
begin
  return next_folio_serie('COT');
end $$;

-- ── sales_notes ─────────────────────────────────────────────────────────────
create table if not exists sales_notes (
  id           uuid primary key default gen_random_uuid(),
  folio        text unique not null default next_folio_serie('NV'),

  -- 'cancelada' en vez de DELETE: una nota emitida es el registro de que se
  -- cobró dinero. Borrarla deja un hueco en el consecutivo y nadie puede
  -- reconstruir qué pasó.
  estado       text not null default 'borrador'
               check (estado in ('borrador','emitida','pagada','entregada','cancelada')),

  -- De qué cotización nació, cuando nació de una. Nullable: la mayoría de las
  -- ventas por WhatsApp no pasan por cotización.
  quote_id     uuid references quotes(id) on delete set null,

  -- ── Partes ────────────────────────────────────────────────────────────────
  -- Una factura comercial de exportación debe identificar a AMBAS partes con
  -- domicilio completo: CBP lo exige y es el primer motivo de retención cuando
  -- falta. El vendedor casi siempre es el mismo, pero se guarda por documento
  -- para que una factura vieja siga imprimiendo el domicilio que llevaba.
  cliente             text not null default '',
  comprador_domicilio text not null default '',
  contacto            text not null default '',
  vendedor_nombre     text not null default '',
  vendedor_domicilio  text not null default '',
  entrega             text not null default '',   -- ship-to, si difiere del comprador

  -- ── Régimen ───────────────────────────────────────────────────────────────
  -- 'exportacion' activa en el PDF la fracción arancelaria, el país de origen y
  -- la declaración T-MEC. Una venta nacional no las lleva y meterlas sobraría.
  tipo         text not null default 'nacional'
               check (tipo in ('nacional','exportacion')),

  -- Quién paga aduana. La investigación de agosto 2026 concluyó que conviene
  -- DDP: aunque el arancel sea 0% por T-MEC, el cargo de despacho (~19.50 USD)
  -- se cobra igual, y bajo DAP le llega de sorpresa al comprador en su puerta.
  incoterm     text not null default 'DAP'
               check (incoterm in ('DDP','DAP','EXW')),

  -- ── Certificación de origen T-MEC ─────────────────────────────────────────
  -- Por debajo de 2,500 USD no se exige certificado formal (19 CFR 182.14),
  -- basta la leyenda en la factura — pero la leyenda tiene que ir FIRMADA por
  -- alguien con nombre y cargo. Certificar en falso ante CBP es sancionable, así
  -- que queda registrado quién firmó cada una.
  certifica_nombre text not null default '',
  certifica_cargo  text not null default '',

  vendedor_id  uuid references auth.users(id) default auth.uid(),
  atiende      text not null default '',   -- nombre visible en el PDF

  moneda       text not null default 'MXN' check (moneda in ('MXN','USD')),
  idioma       text not null default 'es'  check (idioma in ('es','en')),

  total        numeric(12,2) not null default 0,
  pares        int not null default 0,

  -- Fecha comprometida de entrega. Se guarda como date (no texto) para poder
  -- listar "lo que vence esta semana" sin parsear cadenas.
  entrega_estimada date,

  motivo_cancelacion text,

  data         jsonb not null,             -- el documento completo, mismo shape que Quote
  emitida_en   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists sales_notes_updated_idx  on sales_notes (updated_at desc);
create index if not exists sales_notes_estado_idx   on sales_notes (estado);
create index if not exists sales_notes_vendedor_idx on sales_notes (vendedor_id);
create index if not exists sales_notes_cliente_idx  on sales_notes (lower(cliente));
create index if not exists sales_notes_entrega_idx  on sales_notes (entrega_estimada)
  where estado in ('emitida','pagada');

drop trigger if exists sales_notes_touch on sales_notes;
create trigger sales_notes_touch before update on sales_notes
  for each row execute function touch_updated_at();

-- ── Inmutabilidad tras emitir ───────────────────────────────────────────────
-- Las cotizaciones resuelven esto versionando. Una nota de venta no: lo que se
-- emitió es lo que se cobró, y cambiarlo después es rehacer la historia. A
-- partir de 'emitida' se congelan los importes y el contenido; lo único que
-- puede moverse es el estado, la entrega y el motivo de cancelación.
create or replace function congelar_nota_emitida() returns trigger
language plpgsql as $$
begin
  if old.estado <> 'borrador' then
    if new.data is distinct from old.data
       or new.total is distinct from old.total
       or new.pares is distinct from old.pares
       or new.moneda is distinct from old.moneda
       or new.cliente is distinct from old.cliente
       or new.folio is distinct from old.folio then
      raise exception
        'La nota % ya fue emitida: sus importes y contenido no se pueden modificar. Cancélala y emite una nueva.',
        old.folio;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists sales_notes_congelar on sales_notes;
create trigger sales_notes_congelar before update on sales_notes
  for each row execute function congelar_nota_emitida();

create or replace function emitir_nota(p_id uuid) returns text
language plpgsql security invoker set search_path = public as $$
declare f text;
begin
  update sales_notes
     set estado = 'emitida', emitida_en = now()
   where id = p_id and estado = 'borrador'
   returning folio into f;
  if f is null then
    raise exception 'La nota % no existe o ya no está en borrador', p_id;
  end if;
  return f;
end $$;

-- ── Pagos parciales ─────────────────────────────────────────────────────────
-- Tabla aparte y no un par de columnas anticipo/saldo: la bota se hace a
-- pedido, así que entre el anticipo y la entrega puede haber más de un abono, y
-- cada uno tiene su fecha y su forma de pago. Con dos columnas, el segundo
-- abono no tiene dónde vivir.
create table if not exists sale_payments (
  id         uuid primary key default gen_random_uuid(),
  nota_id    uuid not null references sales_notes(id) on delete cascade,
  monto      numeric(12,2) not null check (monto > 0),
  forma      text not null default 'efectivo'
             check (forma in ('efectivo','transferencia','tarjeta','deposito','otro')),
  referencia text not null default '',
  pagado_en  timestamptz not null default now(),
  registro_por uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists sale_payments_nota_idx on sale_payments (nota_id, pagado_en);

-- Saldo pendiente. Vista y no columna: una columna se desincroniza en cuanto
-- alguien inserta un pago sin actualizarla.
create or replace view sales_notes_saldo as
select n.id,
       n.folio,
       n.total,
       coalesce(sum(p.monto), 0)            as pagado,
       n.total - coalesce(sum(p.monto), 0)  as saldo
  from sales_notes n
  left join sale_payments p on p.nota_id = n.id
 group by n.id, n.folio, n.total;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Mismo criterio que la 0001: sin sesión iniciada no se devuelve una sola fila.
-- IMPORTANTE: la anon key del bundle da el rol `anon`, NO `authenticated`. Para
-- que esto funcione el cotizador tiene que iniciar sesión de verdad con
-- Supabase Auth; sin eso, toda lectura devuelve vacío y toda escritura da 401.
alter table sales_notes   enable row level security;
alter table sale_payments enable row level security;

drop policy if exists sales_notes_rw on sales_notes;
create policy sales_notes_rw on sales_notes
  for all to authenticated using (true) with check (true);

-- Los pagos se registran y se consultan, nunca se editan ni se borran: son el
-- registro de dinero que entró. Un cobro mal capturado se corrige con un
-- movimiento nuevo, no reescribiendo el anterior.
drop policy if exists sale_payments_read on sale_payments;
create policy sale_payments_read on sale_payments
  for select to authenticated using (true);

drop policy if exists sale_payments_insert on sale_payments;
create policy sale_payments_insert on sale_payments
  for insert to authenticated with check (true);
