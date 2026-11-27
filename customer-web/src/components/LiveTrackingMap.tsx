import React, { useEffect, useRef } from 'react';

declare const L: any;

interface LiveTrackingMapProps {
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  riderLat?: number | null;
  riderLng?: number | null;
  restaurantName?: string;
  customerAddress?: string;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  riderLat,
  riderLng,
  restaurantName = 'Restaurant',
  customerAddress = 'Delivery Destination',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || typeof L === 'undefined') return;

    // Default center: fallback if coordinates missing
    const defaultLat = pickupLat || 40.7128;
    const defaultLng = pickupLng || -74.006;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([defaultLat, defaultLng], 14);

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const boundsPoints: [number, number][] = [];

    // Custom Icon Creators
    const createHtmlIcon = (bgColor: string, text: string) =>
      L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="
          background-color: ${bgColor};
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        ">${text}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

    // 1. Restaurant Marker
    if (pickupLat && pickupLng) {
      boundsPoints.push([pickupLat, pickupLng]);
      if (!markersRef.current.pickup) {
        markersRef.current.pickup = L.marker([pickupLat, pickupLng], {
          icon: createHtmlIcon('#1565C0', '🍳'),
        })
          .addTo(map)
          .bindPopup(`<b>${restaurantName}</b><br/>Pickup Location`);
      } else {
        markersRef.current.pickup.setLatLng([pickupLat, pickupLng]);
      }
    }

    // 2. Customer Dropoff Marker
    if (dropoffLat && dropoffLng) {
      boundsPoints.push([dropoffLat, dropoffLng]);
      if (!markersRef.current.dropoff) {
        markersRef.current.dropoff = L.marker([dropoffLat, dropoffLng], {
          icon: createHtmlIcon('#10B981', '📍'),
        })
          .addTo(map)
          .bindPopup(`<b>Destination</b><br/>${customerAddress}`);
      } else {
        markersRef.current.dropoff.setLatLng([dropoffLat, dropoffLng]);
      }
    }

    // 3. Live Rider Marker
    if (riderLat && riderLng) {
      boundsPoints.push([riderLat, riderLng]);
      if (!markersRef.current.rider) {
        markersRef.current.rider = L.marker([riderLat, riderLng], {
          icon: createHtmlIcon('#FF9800', '🛵'),
        })
          .addTo(map)
          .bindPopup('<b>Live Rider</b><br/>On the way');
      } else {
        markersRef.current.rider.setLatLng([riderLat, riderLng]);
      }
    }

    // 4. Draw route line
    if (boundsPoints.length >= 2) {
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
      }
      polylineRef.current = L.polyline(boundsPoints, {
        color: '#1565C0',
        weight: 4,
        opacity: 0.7,
        dashArray: '8, 8',
      }).addTo(map);

      map.fitBounds(L.latLngBounds(boundsPoints), {
        padding: [50, 50],
        maxZoom: 16,
      });
    }

    return () => {
      // Map stays alive until unmount
    };
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, riderLat, riderLng]);

  return (
    <div className="relative w-full h-[360px] md:h-[450px] rounded-3xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-md flex items-center gap-1.5 border border-slate-100">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>Live Delivery Map</span>
      </div>
    </div>
  );
};
