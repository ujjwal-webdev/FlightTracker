const FlightPrice = require('../models/flightPriceModel');

async function aggregateBusiestRoutes(limit = 20) {
  const today = new Date().toISOString().split('T')[0];

  const all = await FlightPrice.aggregate([
    {
      $match: {
        departure_date: { $gte: today }
      }
    },
    {
      $group: {
        _id: { origin: '$origin', destination: '$destination' },
        flightCount: { $sum: 1 },
        minPrice: { $min: '$price' },
        avgStops: { $avg: '$transfers' },
        avgPrice: { $avg: '$price' },
      }
    },
    { $sort: { flightCount: -1 } },
    { $limit: limit }
  ]);

  // Compute maxima for normalization (avoid relying on undefined fields).
  const maxMinPrice = all.reduce((max, r) => Math.max(max, r.minPrice || 0), 0);
  const maxAvgStops = all.reduce((max, r) => Math.max(max, r.avgStops || 0), 0);

  const normalized = all.map(route => {
    const minPrice = route.minPrice || 0;
    const avgStops = route.avgStops || 0;

    // Lower is better: cheaper + fewer stops.
    const normPrice = maxMinPrice ? (minPrice / maxMinPrice) : 0;
    const normStops = maxAvgStops ? (avgStops / maxAvgStops) : 0;
    const bestScore = (normPrice * 0.6) + (normStops * 0.4);

    return {
      origin: route._id.origin,
      destination: route._id.destination,
      count: route.flightCount,
      minPrice,
      avgStops,
      avgPrice: parseFloat((route.avgPrice || 0).toFixed(2)),
      bestScore: parseFloat(bestScore.toFixed(3)),
    };
  });

  return normalized;
}

module.exports = aggregateBusiestRoutes;
