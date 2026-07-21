-- Wandr seed data — run AFTER schema.sql in the Supabase SQL Editor.
-- Mirrors src/data.js so the app looks identical on real data.
-- NOTE: run this as one script in the SQL Editor (it runs with the service
-- role there, so RLS does not block the inserts).

-- Fixed UUIDs so relationships are readable. User 0001 is "you".
-- 0001 you · 0002 Maya · 0003 Jake · 0004 Sofia · 0005 Alex · 0006 Ren

insert into users (id, name, username, bio, avatar_color, has_story, privacy, travel_style, top_places) values
('00000000-0000-0000-0000-000000000001', 'You', 'explorer', 'Exploring the world one place at a time.', '#E8A87C', true, 'public',
 '[{"label":"Food & Drink","pct":48,"color":"#E8A87C"},{"label":"Nature","pct":22,"color":"#6BBFA0"},{"label":"Culture","pct":16,"color":"#B8A9E0"},{"label":"Shopping","pct":8,"color":"#F0B8C8"},{"label":"Nightlife","pct":4,"color":"#7EB8D4"},{"label":"Wellness","pct":2,"color":"#A8D8A8"}]', '[]'),
('00000000-0000-0000-0000-000000000002', 'Maya K.', 'mayak', 'Eating my way through Asia one bowl at a time.', '#6BBFA0', true, 'public',
 '[{"label":"Food & Drink","pct":42,"color":"#E8A87C"},{"label":"Culture","pct":33,"color":"#B8A9E0"},{"label":"Nature","pct":25,"color":"#6BBFA0"}]',
 '[{"emoji":"🍣","name":"Sukiyabashi Jiro","city":"Tokyo, Japan","category":"food","rating":5},{"emoji":"⛩","name":"Fushimi Inari","city":"Kyoto, Japan","category":"culture","rating":5},{"emoji":"🌸","name":"Maruyama Park","city":"Kyoto, Japan","category":"nature","rating":4}]'),
('00000000-0000-0000-0000-000000000003', 'Jake R.', 'jaker', 'Chasing sunsets and surf breaks worldwide.', '#B8A9E0', true, 'semi',
 '[{"label":"Nature","pct":52,"color":"#6BBFA0"},{"label":"Food & Drink","pct":28,"color":"#E8A87C"},{"label":"Culture","pct":20,"color":"#B8A9E0"}]',
 '[{"emoji":"🌊","name":"Uluwatu Temple","city":"Bali, Indonesia","category":"nature","rating":5},{"emoji":"🏄","name":"Padang Padang","city":"Bali, Indonesia","category":"nature","rating":5},{"emoji":"🍜","name":"Locavore","city":"Ubud, Indonesia","category":"food","rating":5}]'),
('00000000-0000-0000-0000-000000000004', 'Sofia P.', 'sofiap', 'Vintage markets, street food, and good espresso.', '#E8A87C', false, 'private',
 '[{"label":"Shopping","pct":44,"color":"#F0B8C8"},{"label":"Culture","pct":31,"color":"#B8A9E0"},{"label":"Food & Drink","pct":25,"color":"#E8A87C"}]',
 '[{"emoji":"🛍","name":"Portobello Road Market","city":"London, UK","category":"shopping","rating":5},{"emoji":"☕","name":"Café de Flore","city":"Paris, France","category":"food","rating":5},{"emoji":"🎨","name":"Musée d''Orsay","city":"Paris, France","category":"culture","rating":5}]'),
('00000000-0000-0000-0000-000000000005', 'Alex L.', 'alexl', 'Architecture nerd with a coffee problem.', '#7EB8D4', true, 'public',
 '[{"label":"Culture","pct":50,"color":"#B8A9E0"},{"label":"Food & Drink","pct":30,"color":"#E8A87C"},{"label":"Nightlife","pct":20,"color":"#7EB8D4"}]',
 '[{"emoji":"🏛","name":"Alhambra","city":"Granada, Spain","category":"culture","rating":5},{"emoji":"🍷","name":"Bar Marsella","city":"Barcelona, Spain","category":"nightlife","rating":5},{"emoji":"☕","name":"Federal Café","city":"Barcelona, Spain","category":"food","rating":4}]'),
('00000000-0000-0000-0000-000000000006', 'Ren T.', 'rent', 'Wellness retreats and mountain hikes.', '#F0B8C8', false, 'semi',
 '[{"label":"Wellness","pct":45,"color":"#A8D8A8"},{"label":"Nature","pct":40,"color":"#6BBFA0"},{"label":"Food & Drink","pct":15,"color":"#E8A87C"}]',
 '[{"emoji":"🧘","name":"Como Shambhala","city":"Ubud, Indonesia","category":"wellness","rating":5},{"emoji":"🏔","name":"Tiger Leaping Gorge","city":"Yunnan, China","category":"nature","rating":5},{"emoji":"♨️","name":"Hakone Ryokan","city":"Hakone, Japan","category":"wellness","rating":5}]');

insert into follows (follower_id, following_id) values
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002');

insert into places (id, user_id, name, city, category, emoji, bg, lat, lng, tip, rating, tags, created_at) values
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Mensho Tokyo Ramen', 'San Francisco, CA', 'food', '🍜', '#2a1a0e', 37.785, -122.408,
 'Best tonkotsu outside of Japan. The truffle ramen is a must — lines form at 11am, get there early.', 5, '{food,nightlife}', now() - interval '2 hours'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Point Reyes Lighthouse', 'Point Reyes, CA', 'nature', '🌊', '#0a1a2a', 38.012, -122.999,
 'Saw 3 whale spouts from the trail. Weekdays only — parking is brutal on weekends.', 5, '{nature}', now() - interval '1 day'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Haight-Ashbury Vintage', 'San Francisco, CA', 'shopping', '🛍', '#1a0a1a', 37.769, -122.446,
 'Hidden gem on the corner — incredible 70s finds. Cash only, closes at 6pm.', 4, '{shopping,culture}', now() - interval '2 days'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Tartine Manufactory', 'San Francisco, CA', 'food', '☕', '#1a1200', 37.764, -122.421,
 'Get the country bread and a cortado. Arrive when they open or wait 45 min.', 5, '{food}', now() - interval '3 days');

-- A few likes/saves so counts are non-zero (real counts, small network)
insert into likes (user_id, place_id) values
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004'),
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004');

insert into saves (user_id, place_id) values
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003');

-- A seeded dream plan (dateless → shows under "Dream plans")
insert into trips (id, user_id, title, status, destination, cover_emoji, cover_bg, days, stops, shared_with, itinerary) values
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Portugal someday 🌊', 'planned', 'Lisbon', '🏖', '#1a1400', 0, 0, 0, '[]');

insert into trips (id, user_id, title, cover_emoji, cover_bg, days, stops, shared_with, itinerary) values
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Tokyo · May 2024', '🗾', '#0a1520', 5, 14, 3,
 '[{"day":1,"label":"Arrive & Eat","stops":[
    {"name":"Tsukiji Outer Market","category":"food","emoji":"🐟","time":"Morning","tip":"Get the tuna bowl — ¥1200 and life-changing","rating":5,"lat":35.6654,"lng":139.7707,"city":"Tokyo","country":"Japan","countryFlag":"🇯🇵","address":"Tsukiji, Chuo City, Tokyo"},
    {"name":"Senso-ji Temple","category":"culture","emoji":"⛩","time":"Afternoon","tip":"Go at dawn for golden hour magic","rating":5,"lat":35.7148,"lng":139.7967,"city":"Tokyo","country":"Japan","countryFlag":"🇯🇵","address":"2-3-1 Asakusa, Taito City, Tokyo"},
    {"name":"Omoide Yokocho","category":"nightlife","emoji":"🍢","time":"Evening","tip":"Smoky yakitori alley, cash only","rating":4,"lat":35.6938,"lng":139.7004,"city":"Tokyo","country":"Japan","countryFlag":"🇯🇵","address":"Shinjuku, Tokyo"}]},
   {"day":2,"label":"Neighborhoods","stops":[
    {"name":"Shinjuku Gyoen Garden","category":"nature","emoji":"🌸","time":"Morning","tip":"Perfect for a picnic in cherry blossom season","rating":5,"lat":35.6852,"lng":139.7100,"city":"Tokyo","country":"Japan","countryFlag":"🇯🇵","address":"11 Naito-machi, Shinjuku City, Tokyo"},
    {"name":"Ichiran Ramen","category":"food","emoji":"🍜","time":"Lunch","tip":"Solo booths = pure ramen meditation","rating":5,"lat":35.6895,"lng":139.7006,"city":"Tokyo","country":"Japan","countryFlag":"🇯🇵","address":"Shinjuku, Tokyo"},
    {"name":"Shimokitazawa Vintage","category":"shopping","emoji":"👗","time":"Afternoon","tip":"Budget 3 hours minimum","rating":4,"lat":35.6613,"lng":139.6681,"city":"Tokyo","country":"Japan","countryFlag":"🇯🇵","address":"Shimokitazawa, Setagaya City, Tokyo"}]},
   {"day":3,"label":"Day Trip","stops":[
    {"name":"Nikko National Park","category":"nature","emoji":"🏔","time":"All day","tip":"2hr shinkansen — worth every minute","rating":5,"lat":36.7198,"lng":139.6982,"city":"Nikko","country":"Japan","countryFlag":"🇯🇵","address":"Nikko, Tochigi"}]}]'),
('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Oaxaca · Jan 2024', '🌮', '#1a0800', 4, 9, 5,
 '[{"day":1,"label":"Mezcal & Mole","stops":[
    {"name":"Mercado Benito Juárez","category":"food","emoji":"🛒","time":"Morning","tip":"Tlayudas at stall #14 — ask for Doña Rosa","rating":5,"lat":17.0619,"lng":-96.7220,"city":"Oaxaca","country":"Mexico","countryFlag":"🇲🇽","address":"Las Casas, Oaxaca de Juárez"},
    {"name":"In Situ Mezcalería","category":"nightlife","emoji":"🥃","time":"Evening","tip":"400+ mezcals, knowledgeable staff","rating":5,"lat":17.0650,"lng":-96.7200,"city":"Oaxaca","country":"Mexico","countryFlag":"🇲🇽","address":"Morelos, Oaxaca de Juárez"}]}]'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Kyoto · Apr 2024', '⛩', '#1a0a0a', 4, 11, 2,
 '[{"day":1,"label":"Temples & Torii","stops":[
    {"name":"Fushimi Inari Taisha","category":"culture","emoji":"⛩","time":"Morning","tip":"Climb past the crowds — upper gates are empty by 8am","rating":5,"lat":34.9671,"lng":135.7727,"city":"Kyoto","country":"Japan","countryFlag":"🇯🇵"},
    {"name":"Nishiki Market","category":"food","emoji":"🍡","time":"Lunch","tip":"Tako tamago and fresh yuba — graze your way through","rating":5,"lat":35.0050,"lng":135.7649,"city":"Kyoto","country":"Japan","countryFlag":"🇯🇵"},
    {"name":"Pontocho Alley","category":"nightlife","emoji":"🏮","time":"Evening","tip":"Riverside seats in summer are magic — book ahead","rating":4,"lat":35.0043,"lng":135.7708,"city":"Kyoto","country":"Japan","countryFlag":"🇯🇵"}]},
   {"day":2,"label":"Zen & Gold","stops":[
    {"name":"Kinkaku-ji","category":"culture","emoji":"🏯","time":"Morning","tip":"Golden pavilion glows right after opening","rating":5,"lat":35.0394,"lng":135.7292,"city":"Kyoto","country":"Japan","countryFlag":"🇯🇵"},
    {"name":"Ryoan-ji Rock Garden","category":"wellness","emoji":"🪨","time":"Midday","tip":"Sit with the 15 stones — you can never see all at once","rating":4,"lat":35.0345,"lng":135.7182,"city":"Kyoto","country":"Japan","countryFlag":"🇯🇵"},
    {"name":"% Arabica Higashiyama","category":"food","emoji":"☕","time":"Afternoon","tip":"Kyoto latte with the pagoda view","rating":4,"lat":34.9986,"lng":135.7807,"city":"Kyoto","country":"Japan","countryFlag":"🇯🇵"}]},
   {"day":3,"label":"Bamboo & Gion","stops":[
    {"name":"Arashiyama Bamboo Grove","category":"nature","emoji":"🎋","time":"Morning","tip":"Before 7:30am or it is a conveyor belt of tourists","rating":5,"lat":35.0170,"lng":135.6710,"city":"Kyoto","country":"Japan","countryFlag":"🇯🇵"},
    {"name":"Okochi Sanso Garden","category":"nature","emoji":"🍵","time":"Midday","tip":"Entry includes matcha — the quiet nobody finds","rating":5,"lat":35.0186,"lng":135.6693,"city":"Kyoto","country":"Japan","countryFlag":"🇯🇵"},
    {"name":"Gion at dusk","category":"culture","emoji":"🌆","time":"Evening","tip":"Hanamikoji Street when the lanterns come on","rating":5,"lat":35.0037,"lng":135.7751,"city":"Kyoto","country":"Japan","countryFlag":"🇯🇵"}]},
   {"day":4,"label":"Nara Day Trip","stops":[
    {"name":"Nara Park","category":"nature","emoji":"🦌","time":"Morning","tip":"Bow to the deer — they bow back for crackers","rating":5,"lat":34.6851,"lng":135.8430,"city":"Nara","country":"Japan","countryFlag":"🇯🇵"},
    {"name":"Tōdai-ji","category":"culture","emoji":"🛕","time":"Midday","tip":"The Great Buddha is bigger than any photo suggests","rating":5,"lat":34.6890,"lng":135.8398,"city":"Nara","country":"Japan","countryFlag":"🇯🇵"}]}]'),
('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'Bali · Mar 2024', '🌴', '#0a1a0a', 5, 12, 4,
 '[{"day":1,"label":"Canggu Warm-up","stops":[
    {"name":"Echo Beach","category":"nature","emoji":"🏄","time":"Morning","tip":"Rent a board from the shacks — mellow lefts at mid tide","rating":5,"lat":-8.6478,"lng":115.1229,"city":"Canggu","country":"Indonesia","countryFlag":"🇮🇩"},
    {"name":"Crate Café","category":"food","emoji":"🥑","time":"Brunch","tip":"Smoothie bowls the size of your head","rating":4,"lat":-8.6600,"lng":115.1300,"city":"Canggu","country":"Indonesia","countryFlag":"🇮🇩"},
    {"name":"Old Man''s","category":"nightlife","emoji":"🍻","time":"Evening","tip":"Sunset beers on the lawn, live music Wednesdays","rating":4,"lat":-8.6570,"lng":115.1305,"city":"Canggu","country":"Indonesia","countryFlag":"🇮🇩"}]},
   {"day":2,"label":"Uluwatu Cliffs","stops":[
    {"name":"Uluwatu Temple","category":"culture","emoji":"🌊","time":"Afternoon","tip":"Kecak fire dance at sunset — arrive an hour early","rating":5,"lat":-8.8291,"lng":115.0849,"city":"Uluwatu","country":"Indonesia","countryFlag":"🇮🇩"},
    {"name":"Padang Padang Beach","category":"nature","emoji":"🏖","time":"Morning","tip":"Through the cave entrance — go early, it is tiny","rating":5,"lat":-8.8107,"lng":115.1030,"city":"Uluwatu","country":"Indonesia","countryFlag":"🇮🇩"},
    {"name":"Single Fin","category":"nightlife","emoji":"🌅","time":"Sunset","tip":"The classic Uluwatu sunset — worth the crowd once","rating":4,"lat":-8.8156,"lng":115.0886,"city":"Uluwatu","country":"Indonesia","countryFlag":"🇮🇩"}]},
   {"day":3,"label":"Ubud Green","stops":[
    {"name":"Sacred Monkey Forest","category":"nature","emoji":"🐒","time":"Morning","tip":"Zip your bag — they open zippers now","rating":4,"lat":-8.5188,"lng":115.2582,"city":"Ubud","country":"Indonesia","countryFlag":"🇮🇩"},
    {"name":"Locavore NXT","category":"food","emoji":"🍜","time":"Dinner","tip":"Book a month out — worth every rupiah","rating":5,"lat":-8.5069,"lng":115.2624,"city":"Ubud","country":"Indonesia","countryFlag":"🇮🇩"}]},
   {"day":4,"label":"Terraces & Temples","stops":[
    {"name":"Tegallalang Rice Terraces","category":"nature","emoji":"🌾","time":"Morning","tip":"Walk down into the terraces past the swing crowds","rating":5,"lat":-8.4312,"lng":115.2777,"city":"Tegallalang","country":"Indonesia","countryFlag":"🇮🇩"},
    {"name":"Tirta Empul","category":"culture","emoji":"⛲","time":"Midday","tip":"Bring a change of clothes for the purification pools","rating":5,"lat":-8.4154,"lng":115.3152,"city":"Tampaksiring","country":"Indonesia","countryFlag":"🇮🇩"}]},
   {"day":5,"label":"East Coast Finale","stops":[
    {"name":"Sidemen Valley Walk","category":"nature","emoji":"🥾","time":"Morning","tip":"The Bali of 30 years ago — rice paddies and silence","rating":5,"lat":-8.4667,"lng":115.4333,"city":"Sidemen","country":"Indonesia","countryFlag":"🇮🇩"},
    {"name":"Jimbaran Fish Market","category":"food","emoji":"🦐","time":"Evening","tip":"Pick your fish, they grill it on coconut husks","rating":4,"lat":-8.7758,"lng":115.1670,"city":"Jimbaran","country":"Indonesia","countryFlag":"🇮🇩"}]}]'),
('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', 'Paris · Jan 2024', '🗼', '#0a0a1a', 4, 10, 3,
 '[{"day":1,"label":"Left Bank Classics","stops":[
    {"name":"Musée d''Orsay","category":"culture","emoji":"🎨","time":"Morning","tip":"Thursday evenings are quiet — head straight to level 5","rating":5,"lat":48.8600,"lng":2.3266,"city":"Paris","country":"France","countryFlag":"🇫🇷"},
    {"name":"Café de Flore","category":"food","emoji":"☕","time":"Midday","tip":"Chocolat chaud and people-watching — sit outside","rating":5,"lat":48.8542,"lng":2.3326,"city":"Paris","country":"France","countryFlag":"🇫🇷"},
    {"name":"Shakespeare & Company","category":"shopping","emoji":"📚","time":"Afternoon","tip":"Get your book stamped at the till","rating":4,"lat":48.8526,"lng":2.3471,"city":"Paris","country":"France","countryFlag":"🇫🇷"}]},
   {"day":2,"label":"Marais Wander","stops":[
    {"name":"Marché des Enfants Rouges","category":"food","emoji":"🥙","time":"Lunch","tip":"Oldest covered market in Paris — the Moroccan stand","rating":5,"lat":48.8628,"lng":2.3622,"city":"Paris","country":"France","countryFlag":"🇫🇷"},
    {"name":"Merci","category":"shopping","emoji":"🛍","time":"Afternoon","tip":"The used-book café hides the best corner","rating":4,"lat":48.8609,"lng":2.3663,"city":"Paris","country":"France","countryFlag":"🇫🇷"},
    {"name":"Place des Vosges","category":"culture","emoji":"🏛","time":"Golden hour","tip":"Picnic under the arcades like a local","rating":5,"lat":48.8554,"lng":2.3655,"city":"Paris","country":"France","countryFlag":"🇫🇷"}]},
   {"day":3,"label":"Montmartre Morning","stops":[
    {"name":"Sacré-Cœur","category":"culture","emoji":"⛪","time":"Sunrise","tip":"Climb the dome before the coaches arrive","rating":5,"lat":48.8867,"lng":2.3431,"city":"Paris","country":"France","countryFlag":"🇫🇷"},
    {"name":"Rue des Martyrs vintage","category":"shopping","emoji":"👗","time":"Afternoon","tip":"Work downhill — the good racks are mid-street","rating":4,"lat":48.8781,"lng":2.3399,"city":"Paris","country":"France","countryFlag":"🇫🇷"}]},
   {"day":4,"label":"One Big Museum Day","stops":[
    {"name":"Louvre","category":"culture","emoji":"🖼","time":"Morning","tip":"Enter via Porte des Lions — skip the pyramid line","rating":5,"lat":48.8606,"lng":2.3376,"city":"Paris","country":"France","countryFlag":"🇫🇷"},
    {"name":"Le Comptoir du Panthéon","category":"food","emoji":"🥩","time":"Dinner","tip":"Steak frites facing the Panthéon at night","rating":4,"lat":48.8462,"lng":2.3464,"city":"Paris","country":"France","countryFlag":"🇫🇷"}]}]');

-- ─── Claiming the seed "You" account ──────────────────────────────────────────
-- Seed users cannot log in. To test as user 0001 with a real login:
--   1. Supabase Dashboard → Authentication → Users → Add user (email + password).
--   2. Copy the new auth user's UUID.
--   3. Run (FKs cascade, so trips/follows/likes move with it):
--
--      update users
--      set id = '<your-auth-user-uuid>'
--      where id = '00000000-0000-0000-0000-000000000001';
--
--   4. Sign in in the app with that email + password.
