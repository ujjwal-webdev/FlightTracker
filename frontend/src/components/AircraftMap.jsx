import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { Polyline } from 'react-leaflet';
import { Polygon } from 'react-leaflet';

const AircraftMap = () => {
  const [flights, setFlights] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);

  // Custom plane icon
  const planeIcon = new L.Icon({
    iconUrl: 'https://img.icons8.com/ios-filled/50/000000/airport.png',
    iconSize: [25, 25],
  });

  // Fetch flight data from backend
  const fetchFlights = async () => {
    try {
      const res = await api.get('/flights');
      setFlights(res.data);
    } catch (err) {
      console.error('Error fetching flights:', err.message);
    }
  };

  useEffect(() => {
    // Fetch only when admin triggers a refresh (no background polling by default).
    const handler = (e) => {
      if (e?.detail?.key === 'flights') fetchFlights();
    };
    window.addEventListener('admin:refresh', handler);
    return () => window.removeEventListener('admin:refresh', handler);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredFlights = flights.filter(flight => {
    const query = searchTerm.toLowerCase();
    return (
      flight.icao24?.toLowerCase().includes(query) ||
      flight.callsign?.toLowerCase().includes(query) ||
      flight.origin_country?.toLowerCase().includes(query)
    );
  });

  const [selectedTrail, setSelectedTrail] = useState([]);
  const [flightAlert, setFlightAlert] = useState(null);

  const fetchFlightTrail = async (icao24) => {
    try {
      const res = await api.get(`/flights/${icao24}/trail`);
      const trail = res.data.map(coord => [coord.latitude, coord.longitude]);
      setSelectedTrail(trail);

      // Fetch weather alert
      try {
        const alertRes = await api.get(`/flights/${icao24}/alert`);
        setFlightAlert(alertRes.data);
      } catch (alertErr) {
        setFlightAlert(null);
      }
    } catch (err) {
      console.error('Error fetching trail:', err.message);
      setSelectedTrail([]);
    }
  };

  const [restrictedZones, setRestrictedZones] = useState([]);
  const [showNFZs, setShowNFZs] = useState(false);

  const fetchRestrictedZones = async () => {
    try {
      const params = { limit: 300 };
      if (mapInstance?.getBounds) {
        const b = mapInstance.getBounds();
        const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(',');
        params.bbox = bbox;
      }

      const res = await api.get('/airspaces/restricted', { params });
      setRestrictedZones(res.data);
    } catch (err) {
      console.error('Error fetching restricted zones:', err.message);
    }
  };
  useEffect(() => {
    if (!showNFZs) {
      setRestrictedZones([]);
      return;
    }
    fetchRestrictedZones();
  }, [showNFZs]);
    

  return (
    <div className="relative w-full h-full">
        <button
          onClick={() => setShowNFZs(!showNFZs)}
          className="absolute top-20 right-4 z-[1000] p-2 rounded bg-yellow-300 shadow"
        >
          {showNFZs ? 'Hide NFZs' : 'Show NFZs'}
        </button>

        <input
            type="text"
            placeholder="Search callsign / ICAO24 / country"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="absolute z-[1000] top-20 left-4 p-2 rounded shadow bg-white border"
        />

        <MapContainer
        center={[20, 0]}
        zoom={2}
        className="w-full h-full"
        whenCreated={setMapInstance}
        >
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {filteredFlights.map((flight) => {
          const rotation = flight.true_track || 0;

          const rotatedIcon = new L.DivIcon({
            className: 'rotated-plane-icon',
            html: `<div style="transform: rotate(${rotation}deg);">
                    ✈️
                  </div>`,
            iconSize: [25, 25],
            iconAnchor: [12, 12],
          });

          return (
            <Marker
              key={flight.icao24}
              position={[flight.latitude, flight.longitude]}
              icon={rotatedIcon}
              eventHandlers={{
                click: () => fetchFlightTrail(flight.icao24)
              }}
            >
              <Popup>
                <div>
                  <p><strong>Icao24:</strong> {flight.icao24 || 'N/A'}</p>
                  <p><strong>Callsign:</strong> {flight.callsign || 'N/A'}</p>
                  <p><strong>Country:</strong> {flight.origin_country}</p>
                  <p><strong>Altitude:</strong> {flight.altitude} m</p>
                  <p><strong>Velocity:</strong> {flight.velocity} m/s</p>
                  <p><strong>Latitude:</strong> {flight.latitude}</p>
                  <p><strong>Longitude:</strong> {flight.longitude}</p>

                  {/* Weather alert display */}
                  {flightAlert?.condition && (
                    <p className="text-red-600 font-semibold">
                      Flying into: {flightAlert.condition} – {flightAlert.description}
                    </p>
                  )}

                  {flightAlert?.message && (
                    <p className="text-green-600 font-semibold">
                      {flightAlert.message}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {selectedTrail.length > 1 && (
          <Polyline positions={selectedTrail} color="blue" />
        )}

        {showNFZs && restrictedZones.map((zone, index) => (
          <Polygon
            key={index}
            positions={zone.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
            pathOptions={{ color: 'red', weight: 2, fillOpacity: 0.2 }}
          >
            <Popup>
              <strong>{zone.name}</strong><br />
              Country: {zone.country}<br />
              Type: {zone.type}
            </Popup>
          </Polygon>
        ))}
        </MapContainer>
    </div>
  );
};

export default AircraftMap;
