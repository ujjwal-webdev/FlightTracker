const redis = require('../services/redisClient');
const { scanKeys } = require('../services/redisUtils');
const Flight = require('../models/flightModel');

async function syncRedisToMongo() {
  try {
    const keys = await scanKeys('flight:*');

    let upserted = 0;
    for (const key of keys) {
      const data = await redis.get(key);
      if (!data) continue;

      const flight = JSON.parse(data);
      if (!flight?.icao24) continue;

      await Flight.updateOne(
        { icao24: flight.icao24 },
        { $set: flight },
        { upsert: true }
      );
      upserted++;
    }

    console.log(`Synced ${upserted} flights to MongoDB (upsert)`);
  } catch (err) {
    console.error('MongoDB sync error:', err.message);
  }
}

module.exports = syncRedisToMongo;
