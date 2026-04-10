# Wandr 🌍

A social travel app for discovering hidden gems, building itineraries, and sharing trips with friends.

## Tech Stack

- React 18 (web app)
- CSS custom properties (dark theme)
- Playfair Display + DM Sans fonts (Google Fonts)
- Google Maps API *(placeholder map — ready to wire up)*

---

## Getting Started

### 1. Clone / place in your dev folder

```bash
cd /Users/jonathanlaks/Development/projects
# already here if you copied this folder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm start
```

Opens at **[http://localhost:3000](http://localhost:3000)**

---

## Project Structure

```
wandr/
├── public/
│   └── index.html          # HTML shell + Google Fonts
├── src/
│   ├── index.js            # React entry point
│   ├── App.js              # All screens + state
│   ├── data.js             # Seed data (posts, trips, profile)
│   └── styles.css          # Full design system (dark theme)
├── .gitignore
├── package.json
└── README.md
```

---

## Screens


| Screen      | Description                                                    |
| ----------- | -------------------------------------------------------------- |
| **Feed**    | Friend activity, post cards, like/save/share, trending sidebar |
| **Explore** | Filterable place list + placeholder map with friend pins       |
| **Trips**   | Day-by-day itineraries with sharing + export options           |
| **Profile** | Stats, countries visited, achievement badges, travel style     |


---

## Adding Google Maps

1. Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
  - Enable: Maps JavaScript API, Places API, Geocoding API
2. Create a `.env.local` file in the project root:

```
REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here
```

1. Install the Maps package:

```bash
npm install @react-google-maps/api
```

1. In `App.js`, replace the SVG placeholder map in `ExplorePage` with:

```jsx
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const { isLoaded } = useJsApiLoader({
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  libraries: ['places'],
});
```

---

## Roadmap

- Google Maps integration (Places Autocomplete, real pins)
- Supabase backend (auth, users, places, trips, follows)
- Google OAuth login
- Image/video uploads for posts
- Instagram story export
- React Native / Capacitor for Android
- Business profiles + verified listings

