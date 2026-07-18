import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMaps';

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#141c1e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7f8e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#141c1e' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2a30' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#141c1e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a3f4a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1520' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#253040' }] },
];

export default function Map({ pins, center = { lat: 37.787, lng: -122.43 }, zoom = 13, fit = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false); // map created — lets the marker effect re-run

  // Initialize map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((maps) => {
      if (cancelled || mapRef.current || !containerRef.current) return;
      // Follow the app theme at mount (theme changes apply on next page visit).
      const isLight = document.documentElement.dataset.theme === 'light';
      mapRef.current = new maps.Map(containerRef.current, {
        center,
        zoom,
        // colorScheme is the modern themed base map; the styles array covers
        // older raster keys where colorScheme is unavailable.
        colorScheme: (isLight ? maps.ColorScheme?.LIGHT : maps.ColorScheme?.DARK) ?? undefined,
        styles: isLight ? undefined : DARK_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: maps.ControlPosition.RIGHT_BOTTOM },
      });
      setReady(true);
    }).catch(() => {}); // no API key — the container just stays empty
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pan smoothly when the requested center changes (e.g. clicking a place card)
  useEffect(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.panTo(center);
    if (zoom) mapRef.current.setZoom(zoom);
  }, [center?.lat, center?.lng, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when pins change or the map becomes ready
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google?.maps) return;

    // Remove old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add new markers
    pins.forEach(pin => {
      const marker = new window.google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map: mapRef.current,
        title: pin.label,
        label: {
          text: pin.emoji,
          fontSize: '20px',
        },
        icon: {
          // transparent anchor so the emoji label is the visual
          url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          scaledSize: new window.google.maps.Size(1, 1),
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="color:#0e0e0e;font-size:13px;font-weight:500;padding:2px 4px">${pin.label}</div>`,
      });

      marker.addListener('click', () => infoWindow.open(mapRef.current, marker));
      markersRef.current.push(marker);
    });

    // Frame every pin (used by the trip map, where stops can span cities)
    if (fit && pins.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      pins.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [pins, ready, fit]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
