-- Wandr schema — paste into Supabase SQL Editor (Settings → SQL Editor → New query).
-- Matches the shapes the React app expects via src/services/*.
-- v1 keeps trip itineraries as jsonb on trips; normalizing into trip_stops
-- (see docs/backend-setup.md) is a later migration once auto-detection lands.

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table users (
  id            uuid primary key default gen_random_uuid(),
  -- For real signups, insert with id = auth.uid() so the row is owned by the
  -- authenticated user. Seed users have random ids and no login.
  name          text not null,
  username      text not null unique,
  bio           text default '',
  avatar_color  text default '#E8A87C',
  has_story     boolean default false,
  privacy       text not null default 'public',  -- public | semi | private (profile visibility)
  travel_style  jsonb default '[]',   -- [{label, pct, color}]
  top_places    jsonb default '[]',   -- [{emoji, name, city, category, rating}]
  created_at    timestamptz default now()
);

-- All user_id FKs are ON UPDATE CASCADE so you can "claim" the seed account by
-- updating its users.id to your real auth.uid() — see supabase/seed.sql.
create table places (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on update cascade on delete cascade,
  name        text not null,
  city        text not null,
  category    text not null default 'food',  -- food|nature|culture|shopping|nightlife|wellness|lodging|logistics|landmarks
  emoji       text default '📍',
  bg          text default '#1a1100',
  lat         double precision,
  lng         double precision,
  google_place_id text,                      -- canonical Places API id (vision.md)
  tip         text default '',
  rating      int check (rating between 1 and 5),
  tags        text[] default '{}',
  city_name   text default '',               -- structured city (Profile Cities list)
  country     text default '',               -- structured country (Profile Countries list)
  country_flag text default '',
  visited_on  date,                          -- manual for now; GPS timestamp later
  media       jsonb default '[]',            -- [{url, type: 'image'|'video'}] in the media bucket
  created_at  timestamptz default now()
);

create table trips (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on update cascade on delete cascade,
  title        text not null,
  start_date   date,
  end_date     date,
  cover_emoji  text default '✈',
  cover_bg     text default '#0a1520',
  days         int default 0,
  stops        int default 0,
  shared_with  int default 0,
  itinerary    jsonb default '[]',  -- [{day, label, stops:[{name, category, emoji, time, tip, rating, lat, lng, city, country, countryFlag, address}]}]
  share_token  uuid unique default gen_random_uuid(),  -- future public share links
  created_at   timestamptz default now()
);

create table follows (
  follower_id  uuid not null references users(id) on update cascade on delete cascade,
  following_id uuid not null references users(id) on update cascade on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id)
);

create table likes (
  user_id    uuid not null references users(id) on update cascade on delete cascade,
  place_id   uuid not null references places(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, place_id)
);

create table saves (
  user_id    uuid not null references users(id) on update cascade on delete cascade,
  place_id   uuid not null references places(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, place_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

create index places_user_id_idx   on places(user_id);
create index places_created_idx   on places(created_at desc);
create index trips_user_id_idx    on trips(user_id);
create index follows_follower_idx on follows(follower_id);
create index follows_following_idx on follows(following_id);
create index likes_place_idx      on likes(place_id);
create index saves_place_idx      on saves(place_id);

-- ─── Row-level security ──────────────────────────────────────────────────────
-- v1 policy: everything is readable by anyone with the anon key (the app is a
-- social feed); writes require an authenticated user acting as themselves.
-- Tighten per-trip visibility when share settings land.

alter table users   enable row level security;
alter table places  enable row level security;
alter table trips   enable row level security;
alter table follows enable row level security;
alter table likes   enable row level security;
alter table saves   enable row level security;

create policy "public read"  on users   for select using (true);
create policy "public read"  on places  for select using (true);
create policy "public read"  on trips   for select using (true);
create policy "public read"  on follows for select using (true);
create policy "public read"  on likes   for select using (true);
create policy "public read"  on saves   for select using (true);

create policy "insert own profile" on users  for insert with check (auth.uid() = id);
create policy "update own profile" on users  for update using (auth.uid() = id);

create policy "insert own" on places  for insert with check (auth.uid() = user_id);
create policy "update own" on places  for update using (auth.uid() = user_id);
create policy "delete own" on places  for delete using (auth.uid() = user_id);

create policy "insert own" on trips   for insert with check (auth.uid() = user_id);
create policy "update own" on trips   for update using (auth.uid() = user_id);
create policy "delete own" on trips   for delete using (auth.uid() = user_id);

create policy "insert own" on follows for insert with check (auth.uid() = follower_id);
create policy "delete own" on follows for delete using (auth.uid() = follower_id);

create policy "insert own" on likes   for insert with check (auth.uid() = user_id);
create policy "delete own" on likes   for delete using (auth.uid() = user_id);

create policy "insert own" on saves   for insert with check (auth.uid() = user_id);
create policy "delete own" on saves   for delete using (auth.uid() = user_id);

-- ─── Storage: place photos & videos ──────────────────────────────────────────

insert into storage.buckets (id, name, public) values ('media', 'media', true);

create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');
create policy "auth upload media" on storage.objects
  for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "delete own media" on storage.objects
  for delete using (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);
