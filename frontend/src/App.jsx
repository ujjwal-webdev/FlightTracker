import AircraftMap from './components/AircraftMap';
import FlightPrices from './components/FlightPrices';
import CalendarPrices from './components/CalendarPrices';
import BusiestRoutes from './components/BusiestRoutes';
import GraphRoutes from './components/GraphRoutes';
import WeatherAlertsTable from './components/WeatherAlertsTable';
import NFZAlertTable from './components/NFZAlertTable';
import AdminControls from './components/AdminControls';

function App() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-100">
      <AdminControls />

      <div className="w-full h-[60vh]">
        <AircraftMap />
      </div>

      <div className="w-full px-4 pb-10 pt-6">
        <FlightPrices />
      </div>

      <div className="w-full px-4 pb-10 pt-6">
        <CalendarPrices />
      </div>

      <div className="w-full px-4 pb-10 pt-6">
        <BusiestRoutes />
      </div>

      <div className="w-full px-4 pb-10 pt-6">
        <GraphRoutes />
      </div>

      <div className="w-full px-4 pb-10 pt-6">
        <WeatherAlertsTable />
      </div>

      <div className="w-full px-4 pb-10 pt-6">
        <NFZAlertTable />
      </div>

    </div>
  );
}

export default App;
