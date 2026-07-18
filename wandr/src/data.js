// ─── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'food',      label: 'Food & Drink', emoji: '🍽', color: '#E8A87C' },
  { id: 'nature',    label: 'Nature',       emoji: '🌿', color: '#6BBFA0' },
  { id: 'culture',   label: 'Culture',      emoji: '🏛',  color: '#B8A9E0' },
  { id: 'shopping',  label: 'Shopping',     emoji: '🛍',  color: '#F0B8C8' },
  { id: 'nightlife', label: 'Nightlife',    emoji: '🌙', color: '#7EB8D4' },
  { id: 'wellness',  label: 'Wellness',     emoji: '🧘', color: '#A8D8A8' },
  { id: 'lodging',   label: 'Lodging',      emoji: '🏨', color: '#D4B483' },
  { id: 'logistics', label: 'Logistics',    emoji: '🚆', color: '#9BB0C1' },
  { id: 'landmarks', label: 'Landmarks',    emoji: '🗽', color: '#C8B8D8' },
];

// Dark thumb backgrounds per category (stop icons, place thumbs)
export const CAT_BG = {
  food: '#2a1a0e', nature: '#0a1a0a', culture: '#0a0a1a', shopping: '#1a0a1a',
  nightlife: '#050510', wellness: '#0a1a0a', lodging: '#1a140a', logistics: '#0a121a',
  landmarks: '#14101a',
};

// ─── Badge definitions (static — earned state computed per user) ──────────────

export const BADGES = [
  { emoji: '🍜', name: 'Foodie 50',     desc: 'Saved 50+ food spots' },
  { emoji: '✈',  name: 'Jet Setter',    desc: '10+ countries visited' },
  { emoji: '🌏', name: 'Asia Explorer', desc: '5+ Asian countries' },
  { emoji: '📸', name: 'Storyteller',   desc: 'Shared 10+ trips' },
  { emoji: '🏔', name: 'Summit Seeker', desc: '10 nature spots' },
  { emoji: '🌊', name: 'Island Hopper', desc: '5 island destinations' },
];

// ─── Users ────────────────────────────────────────────────────────────────────
// Mirrors the planned Supabase `users` table.
// id '1' is the seed "logged-in" user (used by DEV_EXISTING_PROFILE in AuthContext).

export const USERS = [
  {
    id: '1',
    name: 'You',
    username: 'explorer',
    initials: 'YO',
    privacy: 'public',
    color: '#E8A87C',
    hasStory: true,
    bio: 'Exploring the world one place at a time.',
    travelStyle: [
      { label: 'Food & Drink', pct: 48, color: '#E8A87C' },
      { label: 'Nature',       pct: 22, color: '#6BBFA0' },
      { label: 'Culture',      pct: 16, color: '#B8A9E0' },
      { label: 'Shopping',     pct: 8,  color: '#F0B8C8' },
      { label: 'Nightlife',    pct: 4,  color: '#7EB8D4' },
      { label: 'Wellness',     pct: 2,  color: '#A8D8A8' },
    ],
  },
  {
    id: '2',
    name: 'Maya K.',
    username: 'mayak',
    initials: 'MK',
    privacy: 'public',
    color: '#6BBFA0',
    hasStory: true,
    bio: 'Eating my way through Asia one bowl at a time.',
    travelStyle: [
      { label: 'Food & Drink', pct: 42, color: '#E8A87C' },
      { label: 'Culture',      pct: 33, color: '#B8A9E0' },
      { label: 'Nature',       pct: 25, color: '#6BBFA0' },
    ],
    topPlaces: [
      { emoji: '🍣', name: 'Sukiyabashi Jiro', city: 'Tokyo, Japan',  category: 'food',    rating: 5 },
      { emoji: '⛩',  name: 'Fushimi Inari',   city: 'Kyoto, Japan',  category: 'culture', rating: 5 },
      { emoji: '🌸', name: 'Maruyama Park',    city: 'Kyoto, Japan',  category: 'nature',  rating: 4 },
    ],
  },
  {
    id: '3',
    name: 'Jake R.',
    username: 'jaker',
    initials: 'JR',
    privacy: 'semi',
    color: '#B8A9E0',
    hasStory: true,
    bio: 'Chasing sunsets and surf breaks worldwide.',
    travelStyle: [
      { label: 'Nature',       pct: 52, color: '#6BBFA0' },
      { label: 'Food & Drink', pct: 28, color: '#E8A87C' },
      { label: 'Culture',      pct: 20, color: '#B8A9E0' },
    ],
    topPlaces: [
      { emoji: '🌊', name: 'Uluwatu Temple', city: 'Bali, Indonesia', category: 'nature', rating: 5 },
      { emoji: '🏄', name: 'Padang Padang',  city: 'Bali, Indonesia', category: 'nature', rating: 5 },
      { emoji: '🍜', name: 'Locavore',       city: 'Ubud, Indonesia', category: 'food',   rating: 5 },
    ],
  },
  {
    id: '4',
    name: 'Sofia P.',
    username: 'sofiap',
    initials: 'SP',
    privacy: 'private',
    color: '#E8A87C',
    hasStory: false,
    bio: 'Vintage markets, street food, and good espresso.',
    travelStyle: [
      { label: 'Shopping',     pct: 44, color: '#F0B8C8' },
      { label: 'Culture',      pct: 31, color: '#B8A9E0' },
      { label: 'Food & Drink', pct: 25, color: '#E8A87C' },
    ],
    topPlaces: [
      { emoji: '🛍', name: 'Portobello Road Market', city: 'London, UK',    category: 'shopping', rating: 5 },
      { emoji: '☕', name: 'Café de Flore',          city: 'Paris, France', category: 'food',     rating: 5 },
      { emoji: '🎨', name: "Musée d'Orsay",          city: 'Paris, France', category: 'culture',  rating: 5 },
    ],
  },
  {
    id: '5',
    name: 'Alex L.',
    username: 'alexl',
    initials: 'AL',
    privacy: 'public',
    color: '#7EB8D4',
    hasStory: true,
    bio: 'Architecture nerd with a coffee problem.',
    travelStyle: [
      { label: 'Culture',      pct: 50, color: '#B8A9E0' },
      { label: 'Food & Drink', pct: 30, color: '#E8A87C' },
      { label: 'Nightlife',    pct: 20, color: '#7EB8D4' },
    ],
    topPlaces: [
      { emoji: '🏛', name: 'Alhambra',    city: 'Granada, Spain',   category: 'culture',   rating: 5 },
      { emoji: '🍷', name: 'Bar Marsella', city: 'Barcelona, Spain', category: 'nightlife', rating: 5 },
      { emoji: '☕', name: 'Federal Café', city: 'Barcelona, Spain', category: 'food',      rating: 4 },
    ],
  },
  {
    id: '6',
    name: 'Ren T.',
    username: 'rent',
    initials: 'RT',
    privacy: 'semi',
    color: '#F0B8C8',
    hasStory: false,
    bio: 'Wellness retreats and mountain hikes.',
    travelStyle: [
      { label: 'Wellness',     pct: 45, color: '#A8D8A8' },
      { label: 'Nature',       pct: 40, color: '#6BBFA0' },
      { label: 'Food & Drink', pct: 15, color: '#E8A87C' },
    ],
    topPlaces: [
      { emoji: '🧘', name: 'Como Shambhala',      city: 'Ubud, Indonesia', category: 'wellness', rating: 5 },
      { emoji: '🏔', name: 'Tiger Leaping Gorge', city: 'Yunnan, China',   category: 'nature',   rating: 5 },
      { emoji: '♨️', name: 'Hakone Ryokan',        city: 'Hakone, Japan',   category: 'wellness', rating: 5 },
    ],
  },
];

// ─── Follows ─────────────────────────────────────────────────────────────────
// Mirrors the planned Supabase `follows` table: { follower_id, following_id }
// To get who user '1' follows: FOLLOWS.filter(f => f.follower_id === '1')

export const FOLLOWS = [
  { follower_id: '1', following_id: '2' },
  { follower_id: '1', following_id: '3' },
  { follower_id: '1', following_id: '4' },
  { follower_id: '2', following_id: '1' },
  { follower_id: '2', following_id: '3' },
  { follower_id: '3', following_id: '1' },
  { follower_id: '3', following_id: '2' },
];

// ─── Posts ────────────────────────────────────────────────────────────────────
// user_id references USERS.id

export const POSTS = [
  {
    id: 1,
    user_id: '2',
    place: 'Mensho Tokyo Ramen',
    city: 'San Francisco, CA',
    category: 'food',
    emoji: '🍜',
    bg: '#2a1a0e',
    tip: 'Best tonkotsu outside of Japan. The truffle ramen is a must — lines form at 11am, get there early.',
    rating: 5, likes: 24, comments: 6, timeAgo: '2h ago',
    lat: 37.785, lng: -122.408,
    tags: ['food', 'nightlife'],
    saved: false,
  },
  {
    id: 2,
    user_id: '3',
    place: 'Point Reyes Lighthouse',
    city: 'Point Reyes, CA',
    category: 'nature',
    emoji: '🌊',
    bg: '#0a1a2a',
    tip: 'Saw 3 whale spouts from the trail. Weekdays only — parking is brutal on weekends.',
    rating: 5, likes: 41, comments: 11, timeAgo: '1d ago',
    lat: 38.012, lng: -122.999,
    tags: ['nature'],
    saved: false,
  },
  {
    id: 3,
    user_id: '4',
    place: 'Haight-Ashbury Vintage',
    city: 'San Francisco, CA',
    category: 'shopping',
    emoji: '🛍',
    bg: '#1a0a1a',
    tip: 'Hidden gem on the corner — incredible 70s finds. Cash only, closes at 6pm.',
    rating: 4, likes: 17, comments: 3, timeAgo: '2d ago',
    lat: 37.769, lng: -122.446,
    tags: ['shopping', 'culture'],
    saved: true,
  },
  {
    id: 4,
    user_id: '5',
    place: 'Tartine Manufactory',
    city: 'San Francisco, CA',
    category: 'food',
    emoji: '☕',
    bg: '#1a1200',
    tip: 'Get the country bread and a cortado. Arrive when they open or wait 45 min.',
    rating: 5, likes: 58, comments: 14, timeAgo: '3d ago',
    lat: 37.764, lng: -122.421,
    tags: ['food'],
    saved: false,
  },
];

// ─── Trips ────────────────────────────────────────────────────────────────────
// user_id references USERS.id
// Place data model per stop: name, lat, lng, category, emoji, city, country, countryFlag, address, tip, rating
// When Supabase is connected, stops will reference a place_id from the `places` table.

export const TRIPS = [
  {
    id: 1,
    user_id: '1',
    title: 'Tokyo · May 2024',
    coverEmoji: '🗾',
    coverBg: '#0a1520',
    days: 5, stops: 14, sharedWith: 3,
    itinerary: [
      {
        day: 1, label: 'Arrive & Eat',
        stops: [
          { name: 'Tsukiji Outer Market', category: 'food',      emoji: '🐟', time: 'Morning',   tip: 'Get the tuna bowl — ¥1200 and life-changing',  rating: 5, lat: 35.6654, lng: 139.7707, city: 'Tokyo', country: 'Japan', countryFlag: '🇯🇵', address: 'Tsukiji, Chuo City, Tokyo' },
          { name: 'Senso-ji Temple',       category: 'culture',   emoji: '⛩',  time: 'Afternoon', tip: 'Go at dawn for golden hour magic',               rating: 5, lat: 35.7148, lng: 139.7967, city: 'Tokyo', country: 'Japan', countryFlag: '🇯🇵', address: '2-3-1 Asakusa, Taito City, Tokyo' },
          { name: 'Omoide Yokocho',        category: 'nightlife', emoji: '🍢', time: 'Evening',   tip: 'Smoky yakitori alley, cash only',                rating: 4, lat: 35.6938, lng: 139.7004, city: 'Tokyo', country: 'Japan', countryFlag: '🇯🇵', address: 'Shinjuku, Tokyo' },
        ],
      },
      {
        day: 2, label: 'Neighborhoods',
        stops: [
          { name: 'Shinjuku Gyoen Garden', category: 'nature',   emoji: '🌸', time: 'Morning',   tip: 'Perfect for a picnic in cherry blossom season', rating: 5, lat: 35.6852, lng: 139.7100, city: 'Tokyo', country: 'Japan', countryFlag: '🇯🇵', address: '11 Naito-machi, Shinjuku City, Tokyo' },
          { name: 'Ichiran Ramen',          category: 'food',     emoji: '🍜', time: 'Lunch',     tip: 'Solo booths = pure ramen meditation',            rating: 5, lat: 35.6895, lng: 139.7006, city: 'Tokyo', country: 'Japan', countryFlag: '🇯🇵', address: 'Shinjuku, Tokyo' },
          { name: 'Shimokitazawa Vintage',  category: 'shopping', emoji: '👗', time: 'Afternoon', tip: 'Budget 3 hours minimum',                         rating: 4, lat: 35.6613, lng: 139.6681, city: 'Tokyo', country: 'Japan', countryFlag: '🇯🇵', address: 'Shimokitazawa, Setagaya City, Tokyo' },
        ],
      },
      {
        day: 3, label: 'Day Trip',
        stops: [
          { name: 'Nikko National Park', category: 'nature', emoji: '🏔', time: 'All day', tip: '2hr shinkansen — worth every minute', rating: 5, lat: 36.7198, lng: 139.6982, city: 'Nikko', country: 'Japan', countryFlag: '🇯🇵', address: 'Nikko, Tochigi' },
        ],
      },
    ],
  },
  {
    id: 2,
    user_id: '1',
    title: 'Oaxaca · Jan 2024',
    coverEmoji: '🌮',
    coverBg: '#1a0800',
    days: 4, stops: 9, sharedWith: 5,
    itinerary: [
      {
        day: 1, label: 'Mezcal & Mole',
        stops: [
          { name: 'Mercado Benito Juárez', category: 'food',      emoji: '🛒', time: 'Morning', tip: 'Tlayudas at stall #14 — ask for Doña Rosa', rating: 5, lat: 17.0619, lng: -96.7220, city: 'Oaxaca', country: 'Mexico', countryFlag: '🇲🇽', address: 'Las Casas, Oaxaca de Juárez' },
          { name: 'In Situ Mezcalería',   category: 'nightlife', emoji: '🥃', time: 'Evening', tip: '400+ mezcals, knowledgeable staff',          rating: 5, lat: 17.0650, lng: -96.7200, city: 'Oaxaca', country: 'Mexico', countryFlag: '🇲🇽', address: 'Morelos, Oaxaca de Juárez' },
        ],
      },
    ],
  },
  {
    id: 3,
    user_id: '2',
    title: 'Kyoto · Apr 2024',
    coverEmoji: '⛩',
    coverBg: '#1a0a0a',
    days: 4, stops: 11, sharedWith: 2,
    itinerary: [
      {
        day: 1, label: 'Temples & Torii',
        stops: [
          { name: 'Fushimi Inari Taisha',  category: 'culture',   emoji: '⛩',  time: 'Morning',   tip: 'Climb past the crowds — upper gates are empty by 8am', rating: 5, lat: 34.9671, lng: 135.7727, city: 'Kyoto', country: 'Japan', countryFlag: '🇯🇵', address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto' },
          { name: 'Nishiki Market',        category: 'food',      emoji: '🍡', time: 'Lunch',     tip: 'Tako tamago and fresh yuba — graze your way through',  rating: 5, lat: 35.0050, lng: 135.7649, city: 'Kyoto', country: 'Japan', countryFlag: '🇯🇵', address: 'Nishikikoji-dori, Nakagyo Ward, Kyoto' },
          { name: 'Pontocho Alley',        category: 'nightlife', emoji: '🏮', time: 'Evening',   tip: 'Riverside seats in summer are magic — book ahead',      rating: 4, lat: 35.0043, lng: 135.7708, city: 'Kyoto', country: 'Japan', countryFlag: '🇯🇵', address: 'Pontocho, Nakagyo Ward, Kyoto' },
        ],
      },
      {
        day: 2, label: 'Zen & Gold',
        stops: [
          { name: 'Kinkaku-ji',            category: 'culture',   emoji: '🏯', time: 'Morning',   tip: 'Golden pavilion glows right after opening',             rating: 5, lat: 35.0394, lng: 135.7292, city: 'Kyoto', country: 'Japan', countryFlag: '🇯🇵', address: '1 Kinkakujicho, Kita Ward, Kyoto' },
          { name: 'Ryoan-ji Rock Garden',  category: 'wellness',  emoji: '🪨', time: 'Midday',    tip: 'Sit with the 15 stones — you can never see all at once', rating: 4, lat: 35.0345, lng: 135.7182, city: 'Kyoto', country: 'Japan', countryFlag: '🇯🇵', address: '13 Ryoanji Goryonoshitacho, Ukyo Ward, Kyoto' },
          { name: '% Arabica Higashiyama', category: 'food',      emoji: '☕', time: 'Afternoon', tip: 'Kyoto latte with the pagoda view',                      rating: 4, lat: 34.9986, lng: 135.7807, city: 'Kyoto', country: 'Japan', countryFlag: '🇯🇵', address: '87-5 Hoshinocho, Higashiyama Ward, Kyoto' },
        ],
      },
      {
        day: 3, label: 'Bamboo & Gion',
        stops: [
          { name: 'Arashiyama Bamboo Grove', category: 'nature',  emoji: '🎋', time: 'Morning',   tip: 'Before 7:30am or it is a conveyor belt of tourists',    rating: 5, lat: 35.0170, lng: 135.6710, city: 'Kyoto', country: 'Japan', countryFlag: '🇯🇵', address: 'Sagaogurayama, Ukyo Ward, Kyoto' },
          { name: 'Okochi Sanso Garden',     category: 'nature',  emoji: '🍵', time: 'Midday',    tip: 'Entry includes matcha — the quiet nobody finds',        rating: 5, lat: 35.0186, lng: 135.6693, city: 'Kyoto', country: 'Japan', countryFlag: '🇯🇵', address: '8 Sagaogurayama Tabuchiyamacho, Ukyo Ward, Kyoto' },
          { name: 'Gion at dusk',            category: 'culture', emoji: '🌆', time: 'Evening',   tip: 'Hanamikoji Street when the lanterns come on',           rating: 5, lat: 35.0037, lng: 135.7751, city: 'Kyoto', country: 'Japan', countryFlag: '🇯🇵', address: 'Gion, Higashiyama Ward, Kyoto' },
        ],
      },
      {
        day: 4, label: 'Nara Day Trip',
        stops: [
          { name: 'Nara Park',             category: 'nature',    emoji: '🦌', time: 'Morning',   tip: 'Bow to the deer — they bow back for crackers',          rating: 5, lat: 34.6851, lng: 135.8430, city: 'Nara', country: 'Japan', countryFlag: '🇯🇵', address: 'Nara Park, Nara' },
          { name: 'Tōdai-ji',              category: 'culture',   emoji: '🛕', time: 'Midday',    tip: 'The Great Buddha is bigger than any photo suggests',    rating: 5, lat: 34.6890, lng: 135.8398, city: 'Nara', country: 'Japan', countryFlag: '🇯🇵', address: '406-1 Zoshicho, Nara' },
        ],
      },
    ],
  },
  {
    id: 4,
    user_id: '3',
    title: 'Bali · Mar 2024',
    coverEmoji: '🌴',
    coverBg: '#0a1a0a',
    days: 5, stops: 12, sharedWith: 4,
    itinerary: [
      {
        day: 1, label: 'Canggu Warm-up',
        stops: [
          { name: 'Echo Beach',            category: 'nature',    emoji: '🏄', time: 'Morning',   tip: 'Rent a board from the shacks — mellow lefts at mid tide', rating: 5, lat: -8.6478, lng: 115.1229, city: 'Canggu', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Echo Beach, Canggu' },
          { name: 'Crate Café',            category: 'food',      emoji: '🥑', time: 'Brunch',    tip: 'Smoothie bowls the size of your head',                    rating: 4, lat: -8.6600, lng: 115.1300, city: 'Canggu', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Jl. Canggu Padang Linjong, Canggu' },
          { name: "Old Man's",             category: 'nightlife', emoji: '🍻', time: 'Evening',   tip: 'Sunset beers on the lawn, live music Wednesdays',         rating: 4, lat: -8.6570, lng: 115.1305, city: 'Canggu', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Jl. Pantai Batu Bolong, Canggu' },
        ],
      },
      {
        day: 2, label: 'Uluwatu Cliffs',
        stops: [
          { name: 'Uluwatu Temple',        category: 'culture',   emoji: '🌊', time: 'Afternoon', tip: 'Kecak fire dance at sunset — arrive an hour early',       rating: 5, lat: -8.8291, lng: 115.0849, city: 'Uluwatu', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Pecatu, South Kuta' },
          { name: 'Padang Padang Beach',   category: 'nature',    emoji: '🏖', time: 'Morning',   tip: 'Through the cave entrance — go early, it is tiny',        rating: 5, lat: -8.8107, lng: 115.1030, city: 'Uluwatu', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Jl. Labuansait, Pecatu' },
          { name: 'Single Fin',            category: 'nightlife', emoji: '🌅', time: 'Sunset',    tip: 'The classic Uluwatu sunset — worth the crowd once',       rating: 4, lat: -8.8156, lng: 115.0886, city: 'Uluwatu', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Pantai Suluban, Uluwatu' },
        ],
      },
      {
        day: 3, label: 'Ubud Green',
        stops: [
          { name: 'Sacred Monkey Forest',  category: 'nature',    emoji: '🐒', time: 'Morning',   tip: 'Zip your bag — they open zippers now',                    rating: 4, lat: -8.5188, lng: 115.2582, city: 'Ubud', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Jl. Monkey Forest, Ubud' },
          { name: 'Locavore NXT',          category: 'food',      emoji: '🍜', time: 'Dinner',    tip: 'Book a month out — worth every rupiah',                   rating: 5, lat: -8.5069, lng: 115.2624, city: 'Ubud', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Jl. Dewisita, Ubud' },
        ],
      },
      {
        day: 4, label: 'Terraces & Temples',
        stops: [
          { name: 'Tegallalang Rice Terraces', category: 'nature', emoji: '🌾', time: 'Morning',  tip: 'Walk down into the terraces past the swing crowds',       rating: 5, lat: -8.4312, lng: 115.2777, city: 'Tegallalang', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Jl. Raya Tegallalang' },
          { name: 'Tirta Empul',           category: 'culture',   emoji: '⛲', time: 'Midday',    tip: 'Bring a change of clothes for the purification pools',    rating: 5, lat: -8.4154, lng: 115.3152, city: 'Tampaksiring', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Jl. Tirta, Tampaksiring' },
        ],
      },
      {
        day: 5, label: 'East Coast Finale',
        stops: [
          { name: 'Sidemen Valley Walk',   category: 'nature',    emoji: '🥾', time: 'Morning',   tip: 'The Bali of 30 years ago — rice paddies and silence',     rating: 5, lat: -8.4667, lng: 115.4333, city: 'Sidemen', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Sidemen, Karangasem' },
          { name: 'Jimbaran Fish Market',  category: 'food',      emoji: '🦐', time: 'Evening',   tip: 'Pick your fish, they grill it on coconut husks',          rating: 4, lat: -8.7758, lng: 115.1670, city: 'Jimbaran', country: 'Indonesia', countryFlag: '🇮🇩', address: 'Jl. Pantai Kedonganan, Jimbaran' },
        ],
      },
    ],
  },
  {
    id: 5,
    user_id: '4',
    title: 'Paris · Jan 2024',
    coverEmoji: '🗼',
    coverBg: '#0a0a1a',
    days: 4, stops: 10, sharedWith: 3,
    itinerary: [
      {
        day: 1, label: 'Left Bank Classics',
        stops: [
          { name: "Musée d'Orsay",         category: 'culture',   emoji: '🎨', time: 'Morning',   tip: 'Thursday evenings are quiet — head straight to level 5',  rating: 5, lat: 48.8600, lng: 2.3266, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: "1 Rue de la Légion d'Honneur, Paris" },
          { name: 'Café de Flore',         category: 'food',      emoji: '☕', time: 'Midday',    tip: 'Chocolat chaud and people-watching — sit outside',        rating: 5, lat: 48.8542, lng: 2.3326, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: '172 Bd Saint-Germain, Paris' },
          { name: 'Shakespeare & Company', category: 'shopping',  emoji: '📚', time: 'Afternoon', tip: 'Get your book stamped at the till',                       rating: 4, lat: 48.8526, lng: 2.3471, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: '37 Rue de la Bûcherie, Paris' },
        ],
      },
      {
        day: 2, label: 'Marais Wander',
        stops: [
          { name: 'Marché des Enfants Rouges', category: 'food',  emoji: '🥙', time: 'Lunch',     tip: "Oldest covered market in Paris — the Moroccan stand",     rating: 5, lat: 48.8628, lng: 2.3622, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: '39 Rue de Bretagne, Paris' },
          { name: 'Merci',                 category: 'shopping',  emoji: '🛍', time: 'Afternoon', tip: 'The used-book café hides the best corner',                rating: 4, lat: 48.8609, lng: 2.3663, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: '111 Bd Beaumarchais, Paris' },
          { name: 'Place des Vosges',      category: 'culture',   emoji: '🏛', time: 'Golden hour', tip: 'Picnic under the arcades like a local',                 rating: 5, lat: 48.8554, lng: 2.3655, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: 'Place des Vosges, Paris' },
        ],
      },
      {
        day: 3, label: 'Montmartre Morning',
        stops: [
          { name: 'Sacré-Cœur',            category: 'culture',   emoji: '⛪', time: 'Sunrise',   tip: 'Climb the dome before the coaches arrive',                rating: 5, lat: 48.8867, lng: 2.3431, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: '35 Rue du Chevalier de la Barre, Paris' },
          { name: 'Rue des Martyrs vintage', category: 'shopping', emoji: '👗', time: 'Afternoon', tip: 'Work downhill — the good racks are mid-street',          rating: 4, lat: 48.8781, lng: 2.3399, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: 'Rue des Martyrs, Paris' },
        ],
      },
      {
        day: 4, label: 'One Big Museum Day',
        stops: [
          { name: 'Louvre',                category: 'culture',   emoji: '🖼', time: 'Morning',   tip: 'Enter via Porte des Lions — skip the pyramid line',       rating: 5, lat: 48.8606, lng: 2.3376, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: 'Rue de Rivoli, Paris' },
          { name: 'Le Comptoir du Panthéon', category: 'food',    emoji: '🥩', time: 'Dinner',    tip: 'Steak frites facing the Panthéon at night',               rating: 4, lat: 48.8462, lng: 2.3464, city: 'Paris', country: 'France', countryFlag: '🇫🇷', address: '5 Rue Soufflot, Paris' },
        ],
      },
    ],
  },
];

// ─── Explore places (list + map pins share this) ──────────────────────────────

export const EXPLORE_PLACES = [
  { id: 1, emoji: '🍜', name: 'Mensho Tokyo Ramen',    sub: 'Food · Japantown · 0.8mi',   friends: 12, verified: true,  bg: '#2a1a0e', category: 'food',      lat: 37.7851, lng: -122.4316 },
  { id: 2, emoji: '☕', name: 'Tartine Manufactory',   sub: 'Coffee · Mission · 1.2mi',   friends: 18, verified: true,  bg: '#1a1200', category: 'food',      lat: 37.7641, lng: -122.4214 },
  { id: 3, emoji: '🛍', name: 'Haight-Ashbury Vintage', sub: 'Shopping · Haight · 2mi',   friends: 6,  verified: false, bg: '#1a0a1a', category: 'shopping',  lat: 37.7694, lng: -122.4462 },
  { id: 4, emoji: '🌉', name: 'Golden Gate Bridge',    sub: 'Nature · Presidio · 3mi',    friends: 44, verified: true,  bg: '#0a1520', category: 'nature',    lat: 37.8199, lng: -122.4783 },
  { id: 5, emoji: '🎨', name: 'SFMOMA',                sub: 'Culture · SoMa · 0.5mi',     friends: 9,  verified: true,  bg: '#0a0a1a', category: 'culture',   lat: 37.7857, lng: -122.4011 },
  { id: 6, emoji: '🍣', name: 'Omakase',               sub: 'Food · SoMa · 0.9mi',        friends: 7,  verified: true,  bg: '#140a0a', category: 'food',      lat: 37.7808, lng: -122.3948 },
  { id: 7, emoji: '🌿', name: 'Golden Gate Park',      sub: 'Nature · Richmond · 2.4mi',  friends: 21, verified: true,  bg: '#0a1a0a', category: 'nature',    lat: 37.7694, lng: -122.4862 },
  { id: 8, emoji: '🍸', name: 'Trick Dog',             sub: 'Nightlife · Mission · 1.5mi', friends: 15, verified: true, bg: '#0a0a0a', category: 'nightlife', lat: 37.7634, lng: -122.4150 },
];

// Legacy alias — pins are derived from EXPLORE_PLACES
export const MAP_PINS = EXPLORE_PLACES.map(p => ({ id: p.id, emoji: p.emoji, lat: p.lat, lng: p.lng, label: p.name, category: p.category }));
