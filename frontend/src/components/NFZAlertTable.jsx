import { useEffect, useState } from 'react';
import api from '../services/api';

const NFZAlertTable = () => {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts/nfz');
      const sortedAlerts = res.data.sort(
        (a, b) => new Date(b.intersectedAt) - new Date(a.intersectedAt)
      );
      setAlerts(sortedAlerts);
    } catch (err) {
      console.error('Error fetching NFZ alerts:', err.message);
    }
  };

  useEffect(() => {
    // Fetch only when admin triggers a refresh (no background polling by default).
    const handler = (e) => {
      if (e?.detail?.key === 'nfzAlerts') fetchAlerts();
    };
    window.addEventListener('admin:refresh', handler);
    return () => window.removeEventListener('admin:refresh', handler);
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="px-4 pb-10 pt-6">
      <h1 className="text-3xl font-bold mb-6 text-center">NFZ Alerts</h1>

      <table className="min-w-full bg-white rounded shadow-md">
        <thead className='bg-gray-200 text-gray-700'>
          <tr className="bg-gray-200">
            <th className="px-4 py-3 text-center">ICAO24</th>
            <th className="px-4 py-3 text-center">Zone</th>
            <th className="px-4 py-3 text-center">Time</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert, idx) => (
            <tr key={idx} className="border-t">
              <td className="px-4 py-3 text-center">{alert.icao24}</td>
              <td className="px-4 py-3 text-center">{alert.zoneName}</td>
              <td className="px-4 py-3 text-center">{new Date(alert.intersectedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NFZAlertTable;
