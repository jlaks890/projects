// ─── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'food',      label: 'Food & Drink', emoji: '🍽', color: '#E8A87C' },
  { id: 'nature',    label: 'Nature',       emoji: '🌿', color: '#6BBFA0' },
  { id: 'culture',   label: 'Culture',      emoji: '🏛',  color: '#B8A9E0' },
  { id: 'shopping',  label: 'Shopping',     emoji: '🛍',  color: '#F0B8C8' },
  { id: 'nightlife', label: 'Nightlife',    emoji: '🌙', color: '#7EB8D4' },
  { id: 'wellness',  label: 'Wellness',     emoji: '🧘', color: '#A8D8A8' },
];

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
    itinerary: [],
  },
  {
    id: 4,
    user_id: '3',
    title: 'Bali · Mar 2024',
    coverEmoji: '🌴',
    coverBg: '#0a1a0a',
    days: 10, stops: 22, sharedWith: 4,
    itinerary: [],
  },
  {
    id: 5,
    user_id: '4',
    title: 'Paris · Jan 2024',
    coverEmoji: '🗼',
    coverBg: '#0a0a1a',
    days: 5, stops: 16, sharedWith: 3,
    itinerary: [],
  },
];

// ─── Map pins (Explore page) ──────────────────────────────────────────────────

export const MAP_PINS = [
  { id: 1, emoji: '🍜', lat: 37.7851, lng: -122.4316, label: 'Mensho Ramen',  category: 'food' },
  { id: 2, emoji: '☕', lat: 37.7641, lng: -122.4214, label: 'Tartine',        category: 'food' },
  { id: 3, emoji: '🛍', lat: 37.7694, lng: -122.4462, label: 'Haight Vintage', category: 'shopping' },
  { id: 4, emoji: '🌉', lat: 37.8199, lng: -122.4783, label: 'Golden Gate',    category: 'nature' },
  { id: 5, emoji: '🎨', lat: 37.7857, lng: -122.4011, label: 'SFMOMA',         category: 'culture' },
  { id: 6, emoji: '🍣', lat: 37.7808, lng: -122.3948, label: 'Omakase',        category: 'food' },
  { id: 7, emoji: '🌿', lat: 37.7694, lng: -122.4862, label: 'GG Park',        category: 'nature' },
  { id: 8, emoji: '🍸', lat: 37.7634, lng: -122.4150, label: 'Trick Dog',      category: 'nightlife' },
];
