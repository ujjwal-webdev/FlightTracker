const express = require('express');

const syncOpenSky = require('../jobs/syncOpenSky');
const syncNeo4jRoutes = require('../jobs/syncNeo4jRoutes');
const syncWeatherAlerts = require('../jobs/syncWeatherAlerts');
const syncNFZAlerts = require('../jobs/syncNFZAlerts');
const syncRestrictedAirspaces = require('../jobs/syncRestrictedAirspaces');
const syncPrices = require('../jobs/syncPrices');

const router = express.Router();

function runInBackground(name, fn) {
  Promise.resolve()
    .then(async () => {
      console.log(`[admin] starting: ${name}`);
      await fn();
      console.log(`[admin] finished: ${name}`);
    })
    .catch((err) => {
      console.error(`[admin] failed: ${name}`, err?.message || err);
    });
}

function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'Admin endpoints disabled (ADMIN_TOKEN not set).' });
  }

  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const xToken = req.headers['x-admin-token'];
  const provided = bearer || xToken;

  if (!provided || provided !== token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

router.get('/status', requireAdmin, (req, res) => {
  res.json({
    adminEnabled: true,
    openskyCron: process.env.OPENSKY_CRON || '*/15 * * * * *',
    weatherCron: process.env.WEATHER_CRON || '*/10 * * * *',
    mongoCron: process.env.MONGO_CRON || '*/10 * * * *',
    nfzCron: process.env.NFZ_CRON || '*/10 * * * *',
  });
});

router.post('/sync/opensky', requireAdmin, async (req, res) => {
  runInBackground('opensky', syncOpenSky);
  res.status(202).json({ ok: true, started: true });
});

router.post('/sync/weather', requireAdmin, async (req, res) => {
  runInBackground('weather', syncWeatherAlerts);
  res.status(202).json({ ok: true, started: true });
});

router.post('/sync/nfz', requireAdmin, async (req, res) => {
  runInBackground('nfz', syncNFZAlerts);
  res.status(202).json({ ok: true, started: true });
});

router.post('/sync/airspaces', requireAdmin, async (req, res) => {
  runInBackground('airspaces', syncRestrictedAirspaces);
  res.status(202).json({ ok: true, started: true });
});

router.post('/sync/neo4j', requireAdmin, async (req, res) => {
  runInBackground('neo4j', syncNeo4jRoutes);
  res.status(202).json({ ok: true, started: true });
});

router.post('/sync/prices', requireAdmin, async (req, res) => {
  const routes = Array.isArray(req.body?.routes)
    ? req.body.routes
    : [
        ['DEL', 'LHR'],
        ['JFK', 'LHR'],
        ['FRA', 'JFK'],
      ];

  runInBackground(`prices (${routes.length} routes)`, async () => {
    for (const pair of routes) {
      const [from, to] = pair || [];
      if (!from || !to) continue;
      await syncPrices(String(from).toUpperCase(), String(to).toUpperCase());
    }
  });

  res.status(202).json({ ok: true, started: true, routesQueued: routes.length });
});

module.exports = router;

