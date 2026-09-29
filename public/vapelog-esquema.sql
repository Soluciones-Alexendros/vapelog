-- Vapelog — modelo Postgres 16 objetivo.
-- No lo ejecuta la demo. La lógica equivalente de cruce, Ohm y nicokit
-- vive en src/data/logic.ts.
--
-- Desvíos conscientes respecto al encargo original:
--   * sin pgvector, pg_cron ni usuarios/roles de escritura
--   * la compatibilidad no es una matriz N:M inventada
--   * device_platform distingue plataforma nativa y atomizador de kit
--   * las características de ficha salen de spec_def. Marca, país y plataformas
--     no se copian ahí: viven en brand y en las tablas de relación.
--   * compat_exclusion bloquea un cruce de plataforma cuando la fuente no lo lista.

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists ltree;
create extension if not exists pg_trgm;

create type archivo_domain as enum ('device', 'coil', 'liquid', 'part', 'flavor');
create type archivo_confidence as enum ('fabricante', 'ficha', 'distribuidor');
create type archivo_tpd as enum ('si', 'parcial', 'no', 'no-aplica');
create type archivo_connector as enum ('510', 'propietario');
create type archivo_platform_role as enum ('nativa', 'kit');
create type archivo_draw as enum ('MTL', 'RDL', 'DL');

create table brand (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name citext not null,
  country text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table taxon (
  id uuid primary key default gen_random_uuid(),
  domain archivo_domain not null,
  path ltree not null,
  parent_path ltree,
  label_es text not null,
  label_en text not null,
  unique (domain, path)
);

create table platform (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  connector archivo_connector not null
);

create table device (
  id uuid primary key default gen_random_uuid(),
  archive_id citext not null unique,
  slug citext not null unique,
  brand_id uuid not null references brand (id),
  taxon_path ltree not null,
  name text not null,
  summary text not null,
  confidence archivo_confidence not null,
  tpd archivo_tpd not null,
  status text not null check (status in ('referenciado', 'historico')),
  connector archivo_connector not null,
  draws archivo_draw[] not null default '{}',
  power_min_w numeric(6, 1),
  power_max_w numeric(6, 1),
  ohm_min numeric(6, 2),
  ohm_max numeric(6, 2),
  capacity_ml numeric(6, 1),
  capacity_tpd_ml numeric(6, 1),
  height_mm numeric(6, 1),
  width_mm numeric(6, 1),
  depth_mm numeric(6, 1),
  weight_g numeric(6, 1),
  display_kind text,
  display_size_in numeric(3, 2),
  battery_kind text not null check (battery_kind in ('integrada', 'externa')),
  battery_mah numeric(6, 1),
  cell_count integer,
  cell_type text check (cell_type is null or cell_type in ('18650', '21700')),
  charge_port text check (charge_port is null or charge_port in ('USB-C', 'Micro-USB')),
  charge_amps numeric(4, 2),
  charge_volts numeric(4, 1),
  search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(summary, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_ohm_window check (
    ohm_min is null or ohm_max is null or ohm_min <= ohm_max
  ),
  constraint device_power_window check (
    power_min_w is null or power_max_w is null or power_min_w <= power_max_w
  )
);

create table device_platform (
  device_id uuid not null references device (id) on delete cascade,
  platform_id uuid not null references platform (id),
  role archivo_platform_role not null,
  primary key (device_id, platform_id, role)
);

create table coil (
  id uuid primary key default gen_random_uuid(),
  archive_id citext not null unique,
  slug citext not null unique,
  brand_id uuid not null references brand (id),
  taxon_path ltree not null,
  name text not null,
  summary text not null,
  confidence archivo_confidence not null,
  ohms numeric(6, 2) not null check (ohms > 0),
  watt_min numeric(6, 1),
  watt_max numeric(6, 1),
  draws archivo_draw[] not null default '{}',
  connector archivo_connector not null,
  refillable boolean not null,
  wire_kind text check (wire_kind is null or wire_kind in ('malla', 'doble-malla', 'alambre')),
  wire_material text,
  build text check (build is null or build in ('malla', 'doble-malla', 'capsula')),
  search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(summary, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coil_watt_window check (
    watt_min is null or watt_max is null or watt_min <= watt_max
  )
);

create table coil_platform (
  coil_id uuid not null references coil (id) on delete cascade,
  platform_id uuid not null references platform (id),
  primary key (coil_id, platform_id)
);

create table coil_variant (
  id uuid primary key default gen_random_uuid(),
  coil_id uuid not null references coil (id) on delete cascade,
  pack_count integer check (pack_count is null or pack_count > 0),
  market text,
  note text
);

create table compat_exclusion (
  device_slug citext not null,
  coil_slug citext not null,
  blocked_kind text not null check (blocked_kind in ('nativa', 'kit')),
  reason text not null,
  primary key (device_slug, coil_slug, blocked_kind)
);

insert into compat_exclusion (device_slug, coil_slug, blocked_kind, reason) values
  (
    'geekvape-aegis-legend-2',
    'geekvape-z-0-15',
    'kit',
    'Comparten la plataforma Z, pero el PDF de Geekvape no lista el L200 en la fila de la Z 0,15 Ω. No es el tanque del kit.'
  ),
  (
    'geekvape-aegis-legend-2',
    'geekvape-z-0-15-xm',
    'kit',
    'Comparten la plataforma Z, pero el PDF no nombra el L200 para la Z 0,15 Ω XM. No es el tanque del kit.'
  );

create table liquid (
  id uuid primary key default gen_random_uuid(),
  archive_id citext not null unique,
  slug citext not null unique,
  brand_id uuid not null references brand (id),
  genre text not null check (genre in ('sales', 'freebase', 'shortfill', 'aroma')),
  name text not null,
  summary text not null,
  confidence archivo_confidence not null,
  tpd archivo_tpd not null,
  draws archivo_draw[] not null default '{}',
  search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(summary, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cada ficha agrupa variaciones (volumen × nicotina) del mismo género.
-- Una fila por variación; has_nicotine decide si nicotine_mg_ml se publica.
create table liquid_variation (
  id uuid primary key default gen_random_uuid(),
  liquid_id uuid not null references liquid (id) on delete cascade,
  slug citext not null,
  label text not null,
  volume_ml numeric(7, 2) not null check (volume_ml > 0),
  has_nicotine boolean not null default false,
  nicotine_mg_ml numeric(6, 2) check (nicotine_mg_ml >= 0 and nicotine_mg_ml <= 20),
  ratio text check (ratio in ('50/50', '70/30')),
  bottle text,
  assumed_bottle_ml numeric(7, 2) check (assumed_bottle_ml is null or assumed_bottle_ml > 0),
  tpd archivo_tpd,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (liquid_id, slug),
  constraint liquid_variation_nicotine check (
    (not has_nicotine and nicotine_mg_ml is null)
    or (has_nicotine and nicotine_mg_ml is not null and nicotine_mg_ml > 0)
  )
);

create table liquid_flavor (
  liquid_id uuid not null references liquid (id) on delete cascade,
  taxon_path ltree not null,
  primary key (liquid_id, taxon_path)
);

create table part (
  id uuid primary key default gen_random_uuid(),
  archive_id citext not null unique,
  slug citext not null unique,
  brand_id uuid not null references brand (id),
  taxon_path ltree not null,
  name text not null,
  summary text not null,
  confidence archivo_confidence not null,
  status text not null check (status in ('referenciado', 'historico')),
  spec text not null,
  quantity_note text not null,
  fits_battery text check (fits_battery in ('18650')),
  fits_connector archivo_connector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table part_platform (
  part_id uuid not null references part (id) on delete cascade,
  platform_id uuid not null references platform (id),
  primary key (part_id, platform_id)
);

-- Plantilla de ficha. La misma clave en todas las piezas de un dominio.
-- value_kind dice cómo leer item_spec: number → value_num, text|enum → value_text.
create table spec_def (
  domain archivo_domain not null check (domain in ('device', 'coil', 'liquid', 'part')),
  slug citext not null,
  group_slug text not null,
  group_label text not null,
  label text not null,
  unit text,
  value_kind text not null check (value_kind in ('number', 'text', 'enum')),
  filterable boolean not null default false,
  sort_order smallint not null,
  primary key (domain, slug)
);

create table source_citation (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references device (id) on delete cascade,
  coil_id uuid references coil (id) on delete cascade,
  liquid_id uuid references liquid (id) on delete cascade,
  part_id uuid references part (id) on delete cascade,
  domain archivo_domain not null check (domain in ('device', 'coil', 'liquid', 'part')),
  spec_slug citext,
  label text not null,
  url text not null,
  constraint source_one_owner check (num_nonnulls(device_id, coil_id, liquid_id, part_id) = 1),
  constraint source_domain_owner check (
    (domain = 'device' and device_id is not null)
    or (domain = 'coil' and coil_id is not null)
    or (domain = 'liquid' and liquid_id is not null)
    or (domain = 'part' and part_id is not null)
  ),
  constraint source_spec_fk foreign key (domain, spec_slug) references spec_def (domain, slug)
);

-- Un hecho publicado. La fila que no existe es «Sin dato publicado».
-- El cruce (archivo_compatibility) no lee esta tabla: usa ohms, vatios,
-- conector y las plataformas tipadas.
create table item_spec (
  id uuid primary key default gen_random_uuid(),
  domain archivo_domain not null check (domain in ('device', 'coil', 'liquid', 'part')),
  spec_slug citext not null,
  device_id uuid references device (id) on delete cascade,
  coil_id uuid references coil (id) on delete cascade,
  liquid_id uuid references liquid (id) on delete cascade,
  part_id uuid references part (id) on delete cascade,
  value_num numeric,
  value_text text,
  confidence archivo_confidence,
  constraint item_spec_def_fk foreign key (domain, spec_slug) references spec_def (domain, slug),
  constraint item_spec_one_owner check (num_nonnulls(device_id, coil_id, liquid_id, part_id) = 1),
  constraint item_spec_one_value check (num_nonnulls(value_num, value_text) = 1),
  constraint item_spec_domain_owner check (
    (domain = 'device' and device_id is not null and coil_id is null and liquid_id is null and part_id is null)
    or (domain = 'coil' and coil_id is not null and device_id is null and liquid_id is null and part_id is null)
    or (domain = 'liquid' and liquid_id is not null and device_id is null and coil_id is null and part_id is null)
    or (domain = 'part' and part_id is not null and device_id is null and coil_id is null and liquid_id is null)
  )
);

create unique index item_spec_device_uq on item_spec (device_id, spec_slug) where device_id is not null;
create unique index item_spec_coil_uq on item_spec (coil_id, spec_slug) where coil_id is not null;
create unique index item_spec_liquid_uq on item_spec (liquid_id, spec_slug) where liquid_id is not null;
create unique index item_spec_part_uq on item_spec (part_id, spec_slug) where part_id is not null;

insert into spec_def (domain, slug, group_slug, group_label, label, unit, value_kind, filterable, sort_order) values
  ('device', 'family', 'cuerpo', 'Cuerpo', 'Familia', null, 'text', true, 10),
  ('device', 'series', 'cuerpo', 'Cuerpo', 'Serie', null, 'text', true, 20),
  ('device', 'year', 'cuerpo', 'Cuerpo', 'Año', null, 'number', false, 30),
  ('device', 'materials', 'cuerpo', 'Cuerpo', 'Materiales', null, 'text', false, 40),
  ('device', 'height_mm', 'cuerpo', 'Cuerpo', 'Alto', 'mm', 'number', false, 50),
  ('device', 'width_mm', 'cuerpo', 'Cuerpo', 'Ancho', 'mm', 'number', false, 60),
  ('device', 'depth_mm', 'cuerpo', 'Cuerpo', 'Fondo', 'mm', 'number', false, 70),
  ('device', 'weight_g', 'cuerpo', 'Cuerpo', 'Peso', 'g', 'number', false, 80),
  ('device', 'display', 'cuerpo', 'Cuerpo', 'Pantalla', null, 'text', false, 90),
  ('device', 'chipset', 'cuerpo', 'Cuerpo', 'Chip', null, 'text', false, 100),
  ('device', 'modes', 'cuerpo', 'Cuerpo', 'Modos', null, 'text', false, 110),
  ('device', 'battery_kind', 'alimentacion', 'Alimentación', 'Tipo de batería', null, 'enum', true, 120),
  ('device', 'battery_mah', 'alimentacion', 'Alimentación', 'Capacidad de batería', 'mAh', 'number', true, 130),
  ('device', 'cell', 'alimentacion', 'Alimentación', 'Celda', null, 'enum', true, 140),
  ('device', 'charge_rate', 'alimentacion', 'Alimentación', 'Carga', null, 'text', false, 160),
  ('device', 'power_min_w', 'alimentacion', 'Alimentación', 'Potencia mínima', 'W', 'number', true, 190),
  ('device', 'power_max_w', 'alimentacion', 'Alimentación', 'Potencia máxima', 'W', 'number', true, 200),
  ('device', 'ohm_min', 'electrico', 'Ventana eléctrica', 'Ohmios mínimos', 'Ω', 'number', true, 210),
  ('device', 'ohm_max', 'electrico', 'Ventana eléctrica', 'Ohmios máximos', 'Ω', 'number', true, 220),
  ('device', 'connector', 'electrico', 'Ventana eléctrica', 'Conector de la pieza', null, 'enum', true, 230),
  ('device', 'capacity_ml', 'atomizador', 'Atomizador', 'Depósito', 'ml', 'number', true, 240),
  ('device', 'capacity_tpd_ml', 'atomizador', 'Atomizador', 'Depósito TPD', 'ml', 'number', true, 250),
  ('device', 'airflow', 'atomizador', 'Atomizador', 'Aire', null, 'text', false, 260),
  ('device', 'draw', 'atomizador', 'Atomizador', 'Calada', null, 'enum', true, 270),
  ('device', 'tpd', 'regimen', 'Fuente', 'TPD', null, 'enum', true, 280),
  ('coil', 'family', 'construccion', 'Construcción', 'Montaje', null, 'text', true, 10),
  ('coil', 'series', 'construccion', 'Construcción', 'Serie', null, 'text', true, 20),
  ('coil', 'wire_kind', 'construccion', 'Construcción', 'Hilo', null, 'enum', true, 30),
  ('coil', 'build', 'construccion', 'Construcción', 'Construcción', null, 'text', false, 50),
  ('coil', 'draw', 'construccion', 'Construcción', 'Calada', null, 'enum', true, 60),
  ('coil', 'connector', 'construccion', 'Construcción', 'Conector de la pieza', null, 'enum', true, 70),
  ('coil', 'refillable', 'construccion', 'Construcción', 'Rellenable', null, 'enum', true, 80),
  ('coil', 'pack_count', 'variante', 'Variante de empaque', 'Unidades', null, 'number', false, 90),
  ('coil', 'ohms', 'electrico', 'Eléctrico', 'Resistencia', 'Ω', 'number', true, 110),
  ('coil', 'watt_min', 'electrico', 'Eléctrico', 'Vatios mínimos', 'W', 'number', true, 120),
  ('coil', 'watt_max', 'electrico', 'Eléctrico', 'Vatios máximos', 'W', 'number', true, 130),
  ('liquid', 'line', 'formato', 'Formato', 'Línea', null, 'text', false, 10),
  ('liquid', 'genre', 'formato', 'Formato', 'Género', null, 'enum', true, 20),
  ('liquid', 'volume_ml', 'formato', 'Formato', 'Cantidad', 'ml', 'number', true, 30),
  ('liquid', 'ratio', 'formato', 'Formato', 'VG/PG', null, 'text', false, 40),
  ('liquid', 'has_nicotine', 'nicotina', 'Nicotina', 'Nicotina', null, 'enum', true, 60),
  ('liquid', 'nicotine_mg', 'nicotina', 'Nicotina', 'Cantidad de nicotina', 'mg/ml', 'number', true, 70),
  ('liquid', 'draw', 'uso', 'Uso', 'Calada recomendada', null, 'enum', true, 100),
  ('liquid', 'flavors', 'uso', 'Uso', 'Perfil', null, 'text', false, 110),
  ('liquid', 'tpd', 'regimen', 'Fuente', 'TPD', null, 'enum', true, 120),
  ('part', 'family', 'encaje', 'Encaje', 'Familia', null, 'text', true, 10),
  ('part', 'series', 'encaje', 'Encaje', 'Serie', null, 'text', true, 15),
  ('part', 'spec', 'encaje', 'Encaje', 'Especificación publicada', null, 'text', false, 20),
  ('part', 'quantity', 'encaje', 'Encaje', 'Cantidad', null, 'text', false, 30),
  ('part', 'drip_mm', 'encaje', 'Encaje', 'Diámetro de boquilla', 'mm', 'number', false, 40),
  ('part', 'chemistry', 'encaje', 'Encaje', 'Química de la celda', null, 'text', false, 50),
  ('part', 'amps', 'encaje', 'Encaje', 'Amperaje continuo', 'A', 'number', false, 60),
  ('part', 'fits_battery', 'encaje', 'Encaje', 'Pide celda', null, 'enum', true, 70),
  ('part', 'fits_connector', 'encaje', 'Encaje', 'Pide conector', null, 'enum', true, 80);

create index device_search_idx on device using gin (search_vector);
create index coil_search_idx on coil using gin (search_vector);
create index liquid_search_idx on liquid using gin (search_vector);
create index device_name_trgm on device using gin (name gin_trgm_ops);
create index taxon_path_idx on taxon using gist (path);

create or replace function archivo_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger device_updated before update on device
  for each row execute function archivo_set_updated_at();
create trigger coil_updated before update on coil
  for each row execute function archivo_set_updated_at();
create trigger liquid_updated before update on liquid
  for each row execute function archivo_set_updated_at();
create trigger liquid_variation_updated before update on liquid_variation
  for each row execute function archivo_set_updated_at();
create trigger brand_updated before update on brand
  for each row execute function archivo_set_updated_at();

-- kind: nativa | kit | electrica | no
create or replace function archivo_compatibility(p_device uuid, p_coil uuid)
returns table (kind text, reason text)
language plpgsql
stable
as $$
declare
  d device%rowtype;
  c coil%rowtype;
  native_hit boolean;
  kit_hit boolean;
  blocked text;
begin
  select * into d from device where id = p_device;
  select * into c from coil where id = p_coil;
  if d.id is null or c.id is null then
    kind := 'no';
    reason := 'Ficha inexistente';
    return next;
    return;
  end if;

  select exists (
    select 1
    from device_platform dp
    join coil_platform cp on cp.platform_id = dp.platform_id
    where dp.device_id = d.id and cp.coil_id = c.id and dp.role = 'nativa'
  ) into native_hit;

  if native_hit then
    select x.reason into blocked
    from compat_exclusion x
    where x.device_slug = d.slug and x.coil_slug = c.slug and x.blocked_kind = 'nativa';
    if blocked is null then
      if (d.power_max_w is not null and c.watt_min is not null and c.watt_min > d.power_max_w)
         or (d.power_min_w is not null and c.watt_max is not null and c.watt_max < d.power_min_w) then
        kind := 'no';
        reason := 'La plataforma coincide, pero la ventana de potencia no cuadra';
        return next;
        return;
      end if;
      if (d.ohm_min is not null and c.ohms < d.ohm_min)
         or (d.ohm_max is not null and c.ohms > d.ohm_max) then
        kind := 'no';
        reason := 'La plataforma coincide, pero la resistencia queda fuera de la ventana publicada';
        return next;
        return;
      end if;
      kind := 'nativa';
      reason := 'Comparten plataforma de cápsula';
      return next;
      return;
    end if;
  end if;

  select exists (
    select 1
    from device_platform dp
    join coil_platform cp on cp.platform_id = dp.platform_id
    where dp.device_id = d.id and cp.coil_id = c.id and dp.role = 'kit'
  ) into kit_hit;

  if kit_hit then
    select x.reason into blocked
    from compat_exclusion x
    where x.device_slug = d.slug and x.coil_slug = c.slug and x.blocked_kind = 'kit';
    if blocked is null then
      if (d.power_max_w is not null and c.watt_min is not null and c.watt_min > d.power_max_w)
         or (d.power_min_w is not null and c.watt_max is not null and c.watt_max < d.power_min_w) then
        kind := 'no';
        reason := 'El kit trae el atomizador, pero la ventana de potencia no cuadra';
        return next;
        return;
      end if;
      if (d.ohm_min is not null and c.ohms < d.ohm_min)
         or (d.ohm_max is not null and c.ohms > d.ohm_max) then
        kind := 'no';
        reason := 'El kit trae el atomizador, pero la resistencia queda fuera de la ventana publicada';
        return next;
        return;
      end if;
      kind := 'kit';
      reason := 'La coil es del atomizador incluido en el kit';
      return next;
      return;
    end if;
  end if;

  if d.connector = '510' and c.connector = '510' then
    if (d.ohm_min is not null and c.ohms < d.ohm_min)
       or (d.ohm_max is not null and c.ohms > d.ohm_max) then
      kind := 'no';
      reason := 'Fuera de la ventana de ohmios';
      return next;
      return;
    end if;
    if (d.power_max_w is not null and c.watt_min is not null and c.watt_min > d.power_max_w)
       or (d.power_min_w is not null and c.watt_max is not null and c.watt_max < d.power_min_w) then
      kind := 'no';
      reason := 'La ventana de potencia no cuadra con la publicada por el dispositivo';
      return next;
      return;
    end if;
    kind := 'electrica';
    reason := coalesce(blocked, 'Rosca 510 y ventana eléctrica compatible; confirmar el atomizador montado');
    return next;
    return;
  end if;

  kind := 'no';
  reason := 'Plataforma y conector distintos';
  return next;
end;
$$;

alter table brand enable row level security;
alter table taxon enable row level security;
alter table platform enable row level security;
alter table device enable row level security;
alter table device_platform enable row level security;
alter table coil enable row level security;
alter table coil_platform enable row level security;
alter table liquid enable row level security;
alter table liquid_flavor enable row level security;
alter table liquid_variation enable row level security;
alter table part enable row level security;
alter table part_platform enable row level security;
alter table source_citation enable row level security;
alter table coil_variant enable row level security;
alter table compat_exclusion enable row level security;
alter table spec_def enable row level security;
alter table item_spec enable row level security;

create policy brand_read on brand for select using (true);
create policy taxon_read on taxon for select using (true);
create policy platform_read on platform for select using (true);
create policy device_read on device for select using (true);
create policy device_platform_read on device_platform for select using (true);
create policy coil_read on coil for select using (true);
create policy coil_platform_read on coil_platform for select using (true);
create policy liquid_read on liquid for select using (true);
create policy liquid_flavor_read on liquid_flavor for select using (true);
create policy liquid_variation_read on liquid_variation for select using (true);
create policy part_read on part for select using (true);
create policy part_platform_read on part_platform for select using (true);
create policy source_read on source_citation for select using (true);
create policy coil_variant_read on coil_variant for select using (true);
create policy compat_exclusion_read on compat_exclusion for select using (true);
create policy spec_def_read on spec_def for select using (true);
create policy item_spec_read on item_spec for select using (true);

comment on function archivo_compatibility is
  'Cruce honesto: plataforma nativa, atomizador de kit, electricidad 510 o incompatibilidad.';
comment on table liquid is
  'Ficha de líquido: identidad (nombre, marca, género) sin sufijos de formato. Las variaciones viven en liquid_variation.';
comment on table liquid_variation is
  'Una fila por combinación volumen × nicotina del mismo género. has_nicotine decide si nicotine_mg_ml está publicado.';
comment on table spec_def is
  'Diccionario plano de la ficha. Añadir una característica es una fila, no un alter ni un jsonb.';
comment on table item_spec is
  'Un valor por clave y pieza. Sin fila, el dato no está publicado. El cruce no depende de esta tabla.';
