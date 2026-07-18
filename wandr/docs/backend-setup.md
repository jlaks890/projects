# Wandr Backend Setup Guide

This doc covers how to connect Wandr to a real database when you're ready.

---

## ✅ Status (July 2026): code side is done — 2 manual steps remain

The app is fully wired for Supabase. Every page loads data through
`src/services/` (async), which query Supabase when configured and fall back to
the static seed data in `src/data.js` when not. `@supabase/supabase-js` is
installed and `src/lib/supabase.js` is active.

**To switch from static data to a real database:**

1. **Create a free Supabase project** at https://supabase.com (pick a nearby
   region). In the SQL Editor, run `supabase/schema.sql`, then
   `supabase/seed.sql` (in that order).
2. **Add your keys** to `.env.local` (Settings → API in the Supabase dashboard),
   then restart `npm start`:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

To log in as the seeded "You" account: create an email/password user in
Supabase (Authentication → Users → Add user) and run the "claim the seed
account" snippet at the bottom of `supabase/seed.sql`. Google OAuth needs
Google Cloud OAuth credentials configured in Supabase (Authentication →
Providers → Google) — email/password is the fastest path for testing.

**Roadmap after connection** (details in `frontend-flows.md` / `vision.md`):
1. Follow/unfollow + trip creation/editing writes (services already expose
   `followUser`, `createTrip`, `updateItinerary` — UI wiring is next)
2. Public share links via `trips.share_token` (column already in schema)
3. Comments table + notifications
4. Normalize itinerary jsonb into `trip_stops` when auto-detection needs
   per-stop timestamps (`arrived_at` / `departed_at`)

The sections below are the original design notes.

---

## Recommended Stack: Supabase + Postgres

Supabase is a hosted Postgres database with built-in auth, a REST API, and a
JavaScript client. If you're comfortable with relational databases, it maps
directly to how you already think.

**Why Supabase over alternatives:**
- Real Postgres — you can query it with SQL directly, use psycopg2 from Python, connect Jupyter notebooks, etc.
- Built-in auth (Google OAuth, email/password)
- Row-level security (users can only edit their own data)
- Free tier is generous for early-stage apps
- No backend server needed — the JS client talks directly to Supabase

---

## Mental Model

| What you know | Wandr equivalent |
|---|---|
| Postgres tables | users, places, trips, follows |
| SQL queries | Supabase JS client or raw SQL |
| Foreign keys | e.g. `posts.user_id → users.id` |
| `.env` secrets | `REACT_APP_SUPABASE_URL` + anon key |
| pandas DataFrame | React state populated from DB fetch |

---

## Data Model

```
users
─────────────────
id            uuid PRIMARY KEY
name          text
handle        text UNIQUE
avatar_color  text
created_at    timestamp

places
─────────────────
id            uuid PRIMARY KEY
user_id       uuid REFERENCES users(id)
name          text
city          text
category      text        -- food, nature, culture, shopping, nightlife, wellness
lat           float
lng           float
tip           text
rating        int         -- 1-5
created_at    timestamp

trips
─────────────────
id            uuid PRIMARY KEY
user_id       uuid REFERENCES users(id)
title         text
cover_emoji   text
itinerary     jsonb       -- array of days/stops (flexible schema)
days          int
created_at    timestamp

trip_stops
─────────────────
id            uuid PRIMARY KEY
trip_id       uuid REFERENCES trips(id)
place_id      uuid REFERENCES places(id)
day_number    int
stop_order    int
time_of_day   text        -- Morning, Afternoon, Evening
note          text

follows
─────────────────
follower_id   uuid REFERENCES users(id)
following_id  uuid REFERENCES users(id)
created_at    timestamp
PRIMARY KEY (follower_id, following_id)

likes
─────────────────
user_id       uuid REFERENCES users(id)
place_id      uuid REFERENCES places(id)
created_at    timestamp
PRIMARY KEY (user_id, place_id)
```

---

## Setup Steps (when ready)

### 1. Create a Supabase project
- Go to https://supabase.com and create a free account
- Create a new project, choose a region close to you
- Save your **Project URL** and **anon/public key** from Settings → API

### 2. Run the SQL schema
Paste the schema above into Supabase's SQL Editor and ask Claude to generate
the full `CREATE TABLE` statements with indexes and RLS policies.

### 3. Add your keys to the app
Create a `.env.local` file in the project root (already in `.gitignore`):
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install the Supabase client
```bash
npm install @supabase/supabase-js
```

### 5. Create src/supabase.js
```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default supabase;
```

### 6. Replace static data with real queries
Example — loading places in the feed:
```js
// Before (static)
import { POSTS } from './data';

// After (from Supabase)
import supabase from './supabase';

const { data: posts, error } = await supabase
  .from('places')
  .select('*, users(name, avatar_color)')
  .order('created_at', { ascending: false });
```

### 7. Add Google OAuth login
```js
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```
This also lets users import their Google Maps saved places on first login.

---

## Bonus: Connecting from Python / Jupyter

Since Supabase is just Postgres, you can query it with your existing
data science tools — useful for analytics, recommendations, etc.

```python
import psycopg2
import pandas as pd

conn = psycopg2.connect(
    host="db.your-project.supabase.co",
    database="postgres",
    user="postgres",
    password="your-db-password",
    port=5432
)

df = pd.read_sql("SELECT * FROM places ORDER BY created_at DESC", conn)
```

Your DB password is in Supabase → Settings → Database → Connection string.

---

## When to come back to this

- [ ] The UI feels solid and you know what data you actually need
- [ ] You're ready to test with real users (even just yourself + a friend)
- [ ] You're adding Google Maps (Places API response maps directly into the `places` table)

When ready, ask Claude to generate the full SQL schema and updated React files.
