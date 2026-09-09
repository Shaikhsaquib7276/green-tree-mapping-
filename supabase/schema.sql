-- GreenMap database schema
-- Run in Supabase SQL editor when a project is available.
-- The UI currently uses clearly labelled local demo records until this is connected.

create table if not exists public.trees (
  id uuid primary key default gen_random_uuid(),
  tree_id text unique not null,
  common_name text not null,
  scientific_name text,
  family text,
  location_zone text,
  latitude double precision,
  longitude double precision,
  condition text check (condition in ('Healthy', 'Fair', 'Needs Attention', 'Damaged', 'Dead')),
  date_surveyed date,
  remarks text,
  photo_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  updated_at timestamptz not null default now()
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

create index if not exists trees_species_idx on public.trees (scientific_name);
create index if not exists trees_zone_idx on public.trees (location_zone);
create index if not exists trees_condition_idx on public.trees (condition);
create index if not exists trees_survey_date_idx on public.trees (date_surveyed);
create index if not exists survey_zone_idx on public.survey_responses (zone);
create index if not exists gallery_category_idx on public.gallery (category);

-- Enable RLS before adding production policies/auth roles.
alter table public.trees enable row level security;
alter table public.green_spaces enable row level security;
alter table public.survey_responses enable row level security;
alter table public.gallery enable row level security;

-- Public visitors can read published documentation records.
drop policy if exists "Public can read trees" on public.trees;
create policy "Public can read trees" on public.trees for select to anon, authenticated using (true);

drop policy if exists "Authenticated users can create trees" on public.trees;
create policy "Authenticated users can create trees" on public.trees for insert to authenticated with check (true);
drop policy if exists "Authenticated users can update trees" on public.trees;
create policy "Authenticated users can update trees" on public.trees for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated users can delete trees" on public.trees;
create policy "Authenticated users can delete trees" on public.trees for delete to authenticated using (true);

drop policy if exists "Public can read green spaces" on public.green_spaces;
create policy "Public can read green spaces" on public.green_spaces for select to anon, authenticated using (true);

drop policy if exists "Public can read gallery" on public.gallery;
create policy "Public can read gallery" on public.gallery for select to anon, authenticated using (true);

-- The public survey form may submit responses, but cannot read them.
drop policy if exists "Public can submit survey responses" on public.survey_responses;
create policy "Public can submit survey responses" on public.survey_responses for insert to anon, authenticated with check (true);

create or replace function public.get_survey_response_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from public.survey_responses;
$$;

grant execute on function public.get_survey_response_count() to anon, authenticated;

grant select on public.trees, public.green_spaces, public.gallery to anon, authenticated;
grant insert on public.survey_responses to anon, authenticated;
grant insert, update, delete on public.trees to authenticated;
