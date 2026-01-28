import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../services/api';
import { AIRPORTS } from '../constants/airports';

const CalendarPrices = () => {
  const [calendarData, setCalendarData] = useState([]);
  // "Applied" route used for fetching
  const [origin, setOrigin] = useState('DEL');
  const [destination, setDestination] = useState('LHR');
  // Draft route (UI selections)
  const [draftOrigin, setDraftOrigin] = useState('DEL');
  const [draftDestination, setDraftDestination] = useState('LHR');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const formatAirport = (a) => `${a.code} — ${a.city}, ${a.country}`;

  const fetchCalendarData = async (origin, destination, month) => {
    try {
      const startDateStr = month.toLocaleDateString('en-CA');

      const endDate = new Date(month);
      endDate.setDate(endDate.getDate() + 41);
      const endDateStr = endDate.toLocaleDateString('en-CA');

      const res = await api.get('/prices/calendar', {
        params: { origin, destination, startDate: startDateStr, endDate: endDateStr }
      });

      setCalendarData(res.data);
    } catch (err) {
      console.error('Error fetching calendar data:', err.message);
      setCalendarData([]);
    }
  };

  useEffect(() => {
    fetchCalendarData(origin, destination, selectedMonth);
  }, [selectedMonth]);

  const getPriceForDate = (date) => {
       const dateStr = date.toLocaleDateString('en-CA');
       const entry = calendarData.find(item => item.date === dateStr);
       return entry ? `${entry.currency} ${entry.price}` : null;
    };
    

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6">Cheapest Flight Calendar</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6 w-full justify-center items-center">
        <select
          value={draftOrigin}
          onChange={(e) => setDraftOrigin(e.target.value)}
          className="p-2 border rounded min-w-[280px]"
        >
          {AIRPORTS.map((a) => (
            <option key={a.code} value={a.code}>
              {formatAirport(a)}
            </option>
          ))}
        </select>
        <select
          value={draftDestination}
          onChange={(e) => setDraftDestination(e.target.value)}
          className="p-2 border rounded min-w-[280px]"
        >
          {AIRPORTS.map((a) => (
            <option key={a.code} value={a.code}>
              {formatAirport(a)}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setOrigin(draftOrigin);
            setDestination(draftDestination);
            fetchCalendarData(draftOrigin, draftDestination, selectedMonth);
          }}
          className="!bg-blue-600 !text-white px-4 py-2 rounded-md font-semibold shadow-sm hover:!bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Search
        </button>
      </div>

      <Calendar
        value={selectedMonth}
        onActiveStartDateChange={({ activeStartDate }) => setSelectedMonth(activeStartDate)}
        tileContent={({ date, view }) => {
            if (view !== 'month') return null;

            const dateStr = date.toLocaleDateString('en-CA');
            const entry = calendarData.find(item => item.date === dateStr);

            if (!entry) return null;

            let priceColor = 'text-gray-500'; // Default
            if (entry.price <= 300) priceColor = 'text-green-600 font-bold';
            else if (entry.price <= 400) priceColor = 'text-yellow-500 font-semibold';
            else priceColor = 'text-red-600 font-bold';

            return (
                <div className={`text-xs mt-1 ${priceColor}`}>
                    {`${entry.currency} ${entry.price}`}
                </div>
            ); 
        }}
    />
    </div>
  );
};

export default CalendarPrices;