const redis = require('../services/redisClient');
const { scanKeys } = require('../services/redisUtils');
const axios = require('axios');

const getLiveFlights = async (req, res) => {
  try {
    const keys = await scanKeys('flight:*', { limit: 200 });
    const flights = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) flights.push(JSON.parse(data));
    }

    res.json(flights);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch flights from Redis' });
  }
};

const getFlightTrail = async (req, res) => {
  const { icao24 } = req.params;

  try {
    const response = await axios.get('https://opensky-network.org/api/tracks/all', {
      params: { icao24 },
      auth: {
        username: process.env.OS_USER,
        password: process.env.OS_PASS
      }
    });

    const path = response.data?.path;

    if (!Array.isArray(path)) {
      return res.status(404).json({ error: 'Flight trail not available' });
    }

    // Extract lat/lon from the path
    const trail = path.map(entry => {
      const [, lat, lon] = entry;
      return { latitude: lat, longitude: lon };
    });

    res.json(trail);
  } catch (error) {
    console.error('Error fetching flight trail:', error.message);
    res.status(500).json({ error: 'Failed to retrieve flight trail' });
  }
};

const getFlightWeatherAlert = async (req, res) => {
  try {
    const { icao24 } = req.params;
    const key = `weatherAlert:${icao24}`;
    const alert = await redis.get(key);

    if (!alert) {
      return res.json({ message: 'No weather alert for this flight, Clear Sky.' });
    }

    res.json(JSON.parse(alert));
  } catch (err) {
    console.error(`Error in getFlightWeatherAlert: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllWeatherAlerts = async (req, res) => {
  try {
    const keys = await scanKeys('weatherAlert:*');
    const alerts = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        alerts.push({
          icao24: key.split(':')[1],
          ...JSON.parse(data)
        });
      }
    }

    res.json(alerts);
  } catch (err) {
    console.error(`Error in getAllWeatherAlerts: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
};



module.exports = { getLiveFlights, getFlightTrail, getFlightWeatherAlert, getAllWeatherAlerts };
