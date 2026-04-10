import { useEffect, useRef } from 'react';
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

export default function Map({ pins, center = { lat: 37.787, lng: -122.43 }, zoom = 13 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize map once
  useEffect(() => {
    loadGoogleMaps().then((maps) => {
      if (mapRef.current) return;
      mapRef.current = new maps.Map(containerRef.current, {
        center,
        zoom,
        styles: DARK_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: maps.ControlPosition.RIGHT_BOTTOM },
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when pins change
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

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
  }, [pins]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
