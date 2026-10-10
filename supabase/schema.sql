-- GreenMap database schema and verified aggregate inventory.
-- Run this file in the Supabase SQL Editor. The aggregate survey figures below
-- are verified project totals; individual tree IDs, conditions, and GPS points
-- have not been supplied and are intentionally not fabricated.

create table if not exists public.trees (
  id uuid primary key default gen_random_uuid(),
  tree_id text unique not null,
  common_name text not null,
  scientific_name text,
  family text,
  location_zone text,
  latitude double precision,
  longitude double precision,
  condition text,
  date_surveyed date,
  remarks text,
  photo_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trees alter column latitude drop not null;
alter table public.trees alter column longitude drop not null;
alter table public.trees drop constraint if exists trees_condition_check;
alter table public.trees add constraint trees_condition_check
  check (condition is null or condition in ('Healthy', 'Fair', 'Needs Attention', 'Damaged', 'Dead', 'Uncertain'));
alter table public.trees drop constraint if exists trees_coordinates_pair_check;
alter table public.trees add constraint trees_coordinates_pair_check
  check (
    (latitude is null and longitude is null)
    or (
      latitude between -90 and 90
      and longitude between -180 and 180
    )
  );

create table if not exists public.green_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  space_type text,
  location text,
  latitude double precision,
  longitude double precision,
  area numeric,
  condition text,
  description text,
  photo_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint green_spaces_coordinates_pair_check check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  )
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  age_group text,
  zone text,
  awareness text,
  green_space_importance integer check (green_space_importance between 1 and 5),
  tree_care_awareness text,
  participation_interest text,
  suggestions text,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  image_url text,
  location text,
  date_taken date,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- The aggregate inventory is kept separate from individual tree records because
-- the source survey only confirms totals by species/category, zone, and condition.
create table if not exists public.survey_inventory_summary (
  project_key text primary key,
  survey_date date not null,
  total_trees integer not null check (total_trees >= 0),
  species_counts jsonb not null,
  zone_counts jsonb not null,
  condition_counts jsonb not null,
  verified boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint inventory_species_json_check check (jsonb_typeof(species_counts) = 'object'),
  constraint inventory_zone_json_check check (jsonb_typeof(zone_counts) = 'object'),
  constraint inventory_condition_json_check check (jsonb_typeof(condition_counts) = 'object')
);

insert into public.survey_inventory_summary (
  project_key, survey_date, total_trees, species_counts, zone_counts, condition_counts, verified, updated_at
) values (
  'theem-campus-2026',
  '2026-09-20',
  38,
  '{"Neem":2,"Gulmohar":9,"Ashoka":1,"Bore":2,"Sitaphal":3,"Amrud":1,"Jamun":2,"Khajur":3,"Black Jamun":4,"White Jamun":2,"Badam":2,"Other / not identified":7}'::jsonb,
  '{"Main Ground":10,"Volleyball Ground":21,"Flower Garden":0,"Parking":7}'::jsonb,
  '{"Healthy":25,"Needs Attention":10,"Uncertain":3}'::jsonb,
  true,
  now()
)
on conflict (project_key) do update set
  survey_date = excluded.survey_date,
  total_trees = excluded.total_trees,
  species_counts = excluded.species_counts,
  zone_counts = excluded.zone_counts,
  condition_counts = excluded.condition_counts,
  verified = excluded.verified,
  updated_at = now();

create index if not exists trees_species_idx on public.trees (common_name);
create index if not exists trees_zone_idx on public.trees (location_zone);
create index if not exists trees_condition_idx on public.trees (condition);
create index if not exists trees_survey_date_idx on public.trees (date_surveyed);
create index if not exists survey_zone_idx on public.survey_responses (zone);
create index if not exists gallery_category_idx on public.gallery (category);

alter table public.trees enable row level security;
alter table public.green_spaces enable row level security;
alter table public.survey_responses enable row level security;
alter table public.gallery enable row level security;
alter table public.survey_inventory_summary enable row level security;

-- Only trusted Supabase app_metadata can grant this role. Do not set it from
-- the browser or allow ordinary users to edit their own app_metadata.
create or replace function public.is_greenmap_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant execute on function public.is_greenmap_admin() to authenticated;

-- Public visitors can read published (non-demo) records. Admins can also see
-- demo records while cleaning the dataset.
drop policy if exists "Public can read trees" on public.trees;
drop policy if exists "Public can read published trees" on public.trees;
create policy "Public can read published trees" on public.trees
  for select to anon, authenticated using (is_demo = false);
drop policy if exists "Admins can manage all trees" on public.trees;
create policy "Admins can manage all trees" on public.trees
  for all to authenticated
  using (public.is_greenmap_admin())
  with check (public.is_greenmap_admin());

drop policy if exists "Authenticated users can create trees" on public.trees;
drop policy if exists "Authenticated users can update trees" on public.trees;
drop policy if exists "Authenticated users can delete trees" on public.trees;

drop policy if exists "Public can read green spaces" on public.green_spaces;
create policy "Public can read green spaces" on public.green_spaces
  for select to anon, authenticated using (is_demo = false);
drop policy if exists "Admins can manage green spaces" on public.green_spaces;
create policy "Admins can manage green spaces" on public.green_spaces
  for all to authenticated
  using (public.is_greenmap_admin())
  with check (public.is_greenmap_admin());

drop policy if exists "Public can read gallery" on public.gallery;
create policy "Public can read gallery" on public.gallery
  for select to anon, authenticated using (is_demo = false);
drop policy if exists "Admins can manage gallery" on public.gallery;
create policy "Admins can manage gallery" on public.gallery
  for all to authenticated
  using (public.is_greenmap_admin())
  with check (public.is_greenmap_admin());

drop policy if exists "Public can submit survey responses" on public.survey_responses;
create policy "Public can submit survey responses" on public.survey_responses
  for insert to anon, authenticated with check (true);
drop policy if exists "Admins can read survey responses" on public.survey_responses;
create policy "Admins can read survey responses" on public.survey_responses
  for select to authenticated using (public.is_greenmap_admin());

drop policy if exists "Public can read verified inventory summary" on public.survey_inventory_summary;
create policy "Public can read verified inventory summary" on public.survey_inventory_summary
  for select to anon, authenticated using (verified = true);
drop policy if exists "Admins can manage inventory summary" on public.survey_inventory_summary;
create policy "Admins can manage inventory summary" on public.survey_inventory_summary
  for all to authenticated
  using (public.is_greenmap_admin())
  with check (public.is_greenmap_admin());

create or replace function public.get_survey_response_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from public.survey_responses;
$$;

revoke all on function public.get_survey_response_count() from public;
grant execute on function public.get_survey_response_count() to anon, authenticated;

grant select on public.trees, public.green_spaces, public.gallery, public.survey_inventory_summary to anon, authenticated;
grant insert on public.survey_responses to anon, authenticated;
grant select on public.survey_responses to authenticated;
grant insert, update, delete on public.trees, public.green_spaces, public.gallery, public.survey_inventory_summary to authenticated;

-- IMPORTANT: after creating the admin user, set app_metadata.role = "admin"
-- through a trusted server/admin workflow or Supabase dashboard. Never expose
-- the service-role key in VITE_* variables or browser code.
