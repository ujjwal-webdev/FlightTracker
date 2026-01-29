const axios = require('axios');
const turf = require('@turf/turf');
const NFZAlert = require('../models/nfzAlertModel');
const RestrictedAirspace = require('../models/restrictedAirspaceModel');
const redisClient = require('./redisClient');
const { scanKeys } = require('./redisUtils');

const getRestrictedAirspaces = async () => {
  // Prefer direct DB access here (this is backend-internal code).
  return RestrictedAirspace.find({}, 'name geometry country type').lean();
};

async function checkNFZViolationsBatch(limit = 50) {
  const keys = await scanKeys('flight:*', { limit });

  for (const key of keys) {
    const data = await redisClient.get(key);
    if (!data) continue;

    let { icao24, latitude, longitude, true_track = 0, velocity = 200 } = JSON.parse(data);

    if (velocity < 200) {
      velocity = 200;
    }

    const start = turf.point([longitude, latitude]);
    const distance = velocity * 60 * 3 / 1000; // project for 3 minutes in km
    const destination = turf.destination(start, distance, true_track);

    const flightLine = turf.lineString([start.geometry.coordinates, destination.geometry.coordinates]);

    // Query only zones that intersect the flight segment (keeps memory small).
    const candidates = await RestrictedAirspace.find(
      {
        geometry: {
          $geoIntersects: {
            $geometry: {
              type: 'LineString',
              coordinates: flightLine.geometry.coordinates,
            }
          }
        }
      },
      'name geometry'
    ).lean();

    for (const zone of candidates) {
      const polygon = turf.polygon(zone.geometry.coordinates);
      if (turf.booleanIntersects(flightLine, polygon)) {
        await NFZAlert.findOneAndUpdate(
          { icao24 },
          {
            icao24,
            zoneId: zone._id,
            zoneName: zone.name,
            intersectedAt: new Date(),
          },
          { upsert: true }
        );
        break;
      }
    }
  }

  console.log('NFZ check completed.');
}

module.exports = { getRestrictedAirspaces, checkNFZViolationsBatch };
