const redisClient = require('../services/redisClient');
const { scanKeys } = require('../services/redisUtils');
const { getWeatherByCoords } = require('../services/weatherService');

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

function destinationPoint(lat, lon, bearing, distanceKm = 100) {
  const R = 6371; // Earth radius in km
  const δ = distanceKm / R; // Angular distance
  const θ = toRadians(bearing);

  const φ1 = toRadians(lat);
  const λ1 = toRadians(lon);

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );

  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return {
    lat: toDegrees(φ2),
    lon: toDegrees(λ2)
  };
}

async function syncWeatherAlerts() {
  try {
    const limitedKeys = await scanKeys('flight:*', { limit: 10 });
    const rawFlights = await redisClient.mGet(limitedKeys);
    const flights = rawFlights.filter(Boolean).map(JSON.parse);

    let alertCount = 0;

    for (const flight of flights) {
      console.log(flight)
      if (
        !flight.latitude ||
        !flight.longitude ||
        flight.true_track === null ||
        flight.true_track === undefined
      ) {
        continue;
      }

      // Project 100km ahead along true_track
      const projected = destinationPoint(
        flight.latitude,
        flight.longitude,
        flight.true_track,
        100
      );

      const alert = await getWeatherByCoords(projected.lat, projected.lon);

      if (alert) {
        const key = `weatherAlert:${flight.icao24}`;
        await redisClient.set(key, JSON.stringify(alert), 'EX', 900); // TTL 15 min
        console.log(`[${flight.icao24}] Flying into weather: ${alert.condition}`);
        alertCount++;
      }
    }

    console.log(`Weather alert scan completed. Flights flagged: ${alertCount}`);
  } catch (error) {
    console.error('Error in weather alert sync:', error.message);
  }
}

module.exports = syncWeatherAlerts;
