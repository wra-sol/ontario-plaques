import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router';
import L from 'leaflet';
import type { Plaque } from '../lib/plaques';
import { Card, Button, Tag } from './index';

// Fix Leaflet default marker icons
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom green marker for plaques
const plaqueIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'plaque-marker',
});

interface PlaqueMapProps {
  plaques: Plaque[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  showPopup?: boolean;
}

// Component to update map view when props change
function MapUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
}

export function PlaqueMap({ 
  plaques, 
  height = '600px', 
  center = [44.0, -78.0], // Ontario center
  zoom = 7,
  showPopup = true 
}: PlaqueMapProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Filter plaques with valid coordinates
  const plaquesWithCoords = useMemo(() => 
    plaques.filter(p => p.latitude != null && p.longitude != null),
    [plaques]
  );
  
  if (!isClient) {
    return (
      <Card style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: '100%', height: '100%' }} />
      </Card>
    );
  }
  
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={center} zoom={zoom} />
          
          {plaquesWithCoords.map((plaque) => (
            <Marker
              key={plaque.id}
              position={[plaque.latitude!, plaque.longitude!]}
              icon={plaqueIcon}
            >
              {showPopup && (
                <Popup>
                  <div style={{ minWidth: '200px', maxWidth: '280px' }}>
                    <h3 style={{ 
                      fontSize: 'var(--text-sm)', 
                      marginBottom: 'var(--space-2)',
                      lineHeight: 1.4 
                    }}>
                      {plaque.title}
                    </h3>
                    <p style={{ 
                      fontSize: 'var(--text-xs)', 
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-2)'
                    }}>
                      {plaque.municipalityClean}
                    </p>
                    {plaque.imageUrl && (
                      <img
                        src={plaque.imageUrl}
                        alt={plaque.title}
                        style={{ 
                          width: '100%', 
                          height: 'auto', 
                          marginBottom: 'var(--space-2)',
                          border: '2px solid var(--border-primary)'
                        }}
                      />
                    )}
                    <Link 
                      to={`/plaques/${plaque.id}`}
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      View Details →
                    </Link>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}

// Mini map for plaque detail page
interface MiniMapProps {
  plaque: Plaque;
  height?: string;
}

export function MiniMap({ plaque, height = '250px' }: MiniMapProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient || !plaque.latitude || !plaque.longitude) {
    return (
      <Card style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          {!plaque.latitude || !plaque.longitude ? 'No location data' : 'Loading map...'}
        </span>
      </Card>
    );
  }
  
  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={[plaque.latitude, plaque.longitude]}
          zoom={14}
          scrollWheelZoom={false}
          dragging={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={[plaque.latitude, plaque.longitude]}
            icon={plaqueIcon}
          />
        </MapContainer>
      </div>
    </Card>
  );
}
