import { useEffect, useState } from 'react';
import api from '../services/api'; // Axios instance

function BusiestRoutes() {
  const [routes, setRoutes] = useState([]);

  const fetchBusiestRoutes = async () => {
    try {
      const res = await api.get('/flights/busiest'); 
      setRoutes(res.data);
    } catch (err) {
      console.error('Error fetching busiest routes', err);
    }
  };

  useEffect(() => {
    // Fetch only when admin triggers a refresh (no automatic fetch by default).
    const handler = (e) => {
      if (e?.detail?.key === 'busiestRoutes') fetchBusiestRoutes();
    };
    window.addEventListener('admin:refresh', handler);
    return () => window.removeEventListener('admin:refresh', handler);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">🌍 Busiest Flight Routes</h1>
      <table className="min-w-full bg-white shadow rounded-md overflow-hidden text-sm">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="px-4 py-3 text-left">Origin</th>
            <th className="px-4 py-3 text-left">Destination</th>
            <th className="px-4 py-3 text-left">Flights</th>
            <th className="px-4 py-3 text-left">Min Price</th>
            <th className="px-4 py-3 text-left">Avg Stops</th>
            <th className="px-4 py-3 text-left">Best Score</th>
            <th className="px-4 py-3 text-left">Average Price</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{route.origin}</td>
              <td className="px-4 py-2">{route.destination}</td>
              <td className="px-4 py-2">{route.count}</td>
              <td className="px-4 py-2">${route.minPrice}</td>
              <td className="px-4 py-2">{route.avgStops}</td>
              <td className="px-4 py-2">{route.bestScore}</td>
              <td className="px-4 py-2">${route.avgPrice}</td>
            </tr>
          ))}
        </tbody>
    </table>
    </div>
  );
}

export default BusiestRoutes;
