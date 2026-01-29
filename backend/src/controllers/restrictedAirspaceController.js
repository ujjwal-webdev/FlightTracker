const RestrictedAirspace = require('../models/restrictedAirspaceModel');

function parseBbox(bboxStr) {
  if (!bboxStr) return null;
  const parts = String(bboxStr).split(',').map((s) => Number(s.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  const [minLon, minLat, maxLon, maxLat] = parts;
  if (minLon >= maxLon || minLat >= maxLat) return null;
  return { minLon, minLat, maxLon, maxLat };
}

function bboxToPolygon({ minLon, minLat, maxLon, maxLat }) {
  // GeoJSON polygon must be closed (first = last).
  return {
    type: 'Polygon',
    coordinates: [[
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat],
    ]],
  };
}

const getRestrictedZones = async (req, res) => {
  try {
    const bbox = parseBbox(req.query.bbox);
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Math.floor(limitRaw))) : 200;

    const query = bbox
      ? { geometry: { $geoIntersects: { $geometry: bboxToPolygon(bbox) } } }
      : {};

    // NOTE: geometry can be large; always cap results.
    const zones = await RestrictedAirspace
      .find(query, 'name geometry country type')
      .limit(limit)
      .lean();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getRestrictedZones };
