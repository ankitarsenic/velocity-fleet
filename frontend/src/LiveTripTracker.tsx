import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { X, CheckCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom SVG icon for the truck
const truckIcon = new L.DivIcon({
  html: `<div style="background-color: white; border: 2px solid #F97316; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M10 17h4V5H2v12h3"></path>
             <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"></path>
             <path d="M14 17h1"></path>
             <circle cx="7.5" cy="17.5" r="2.5"></circle>
             <circle cx="17.5" cy="17.5" r="2.5"></circle>
           </svg>
         </div>`,
  className: 'custom-truck-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface LiveTripTrackerProps {
  trip: any; // Using any for simplicity here; matches Trip interface in App.tsx
  onClose: () => void;
}

export default function LiveTripTracker({ trip, onClose }: LiveTripTrackerProps) {
  // Mock coordinates for simulation (New York to Philadelphia roughly, or just random points)
  // Let's use a nice localized route. Say, within a city.
  const routePoints: [number, number][] = [
    [26.8550, 80.9450], // Start (Source A)
    [26.8350, 80.9500]  // End (Destination B)
  ];

  const [currentPosition, setCurrentPosition] = useState<[number, number]>(routePoints[0]);
  const [etaMins, setEtaMins] = useState(18);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulation logic
    const totalDuration = 60000; // 60 seconds
    const intervalMs = 1000;
    const steps = totalDuration / intervalMs;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep > steps) {
        clearInterval(interval);
        setEtaMins(0);
        return;
      }

      const fraction = currentStep / steps;
      setProgress(fraction * 100);
      
      // Calculate interpolated position
      const numSegments = routePoints.length - 1;
      const scaledFraction = fraction * numSegments;
      const segmentIndex = Math.min(Math.floor(scaledFraction), numSegments - 1);
      const segmentFraction = scaledFraction - segmentIndex;

      const p1 = routePoints[segmentIndex];
      const p2 = routePoints[segmentIndex + 1];

      const lat = p1[0] + (p2[0] - p1[0]) * segmentFraction;
      const lng = p1[1] + (p2[1] - p1[1]) * segmentFraction;

      setCurrentPosition([lat, lng]);

      // Update ETA
      const remainingMins = Math.max(0, Math.ceil(18 * (1 - fraction)));
      setEtaMins(remainingMins);
      
    }, intervalMs);

    return () => clearInterval(interval);
  }, []);

  const driverName = trip.driver?.name || 'Unknown Driver';
  const vehicleModel = trip.vehicle ? `${trip.vehicle.make} ${trip.vehicle.model}` : 'Unknown Vehicle';
  const regNumber = trip.vehicle?.registration_number || 'N/A';

  return (
    <div className="tracker-modal-overlay">
      <div className="tracker-modal-content">
        <button className="tracker-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="tracker-map-container">
          <MapContainer 
            center={[26.8467, 80.9462]} 
            zoom={13} 
            style={{ height: '100%', width: '100%', borderRadius: '16px' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Polyline positions={routePoints} color="#3b82f6" weight={5} opacity={0.7} />
            <Marker position={currentPosition} icon={truckIcon} />
          </MapContainer>
        </div>

        <div className="tracker-floating-card glass-panel">
          <div className="tracker-eta-header">
            <div className="eta-time">
              {etaMins > 0 ? `${etaMins} mins away` : 'Arriving now'}
            </div>
            <div className="eta-badge">
              <CheckCircle size={14} style={{ marginRight: '4px' }} />
              On Schedule
            </div>
          </div>
          
          <div className="tracker-progress-bar">
            <div className="tracker-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="tracker-details">
            <div className="driver-info">
              <div className="driver-avatar">
                {driverName.charAt(0)}
              </div>
              <div className="driver-text">
                <div className="driver-name">{driverName}</div>
                <div className="safety-score">★ 4.9 Safety Score</div>
              </div>
            </div>
            <div className="vehicle-info">
              <div className="vehicle-model">{vehicleModel}</div>
              <div className="vehicle-plate">{regNumber}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
