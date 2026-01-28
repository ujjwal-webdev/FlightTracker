require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const syncPrices = require('./src/jobs/syncPrices');

const app = express();
const PORT = process.env.PORT || 3000;

// Import DB connection services
require('./src/services/mongo');
require('./src/services/redisClient');
require('./src/services/neo4j');

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const devOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    const allowed = new Set([
      ...devOrigins,
      ...corsOrigins,
    ]);

    if (allowed.has(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base Route
app.get('/', (req, res) => {
  res.send('Server is running with MongoDB, Redis, and Neo4j!');
});

const adminRoutes = require('./src/routes/admin');
app.use('/api/admin', adminRoutes);

// User-Story 1: Syncing live flights
const flightRoutes = require('./src/routes/flights');
app.use('/api/flights', flightRoutes);

const syncOpenSky = require('./src/jobs/syncOpenSky');
const syncMongo = require('./src/jobs/syncMongo');
const OPENSKY_CRON = process.env.OPENSKY_CRON || '*/15 * * * * *';
const MONGO_CRON = process.env.MONGO_CRON || '*/10 * * * *';
const WEATHER_CRON = process.env.WEATHER_CRON || '*/10 * * * *';
const NFZ_CRON = process.env.NFZ_CRON || '*/10 * * * *';

if (process.env.ENABLE_OPENSKY_CRON !== 'false') {
  cron.schedule(OPENSKY_CRON, syncOpenSky);
}
if (process.env.ENABLE_MONGO_CRON !== 'false') {
  cron.schedule(MONGO_CRON, syncMongo);
}

// User-Story 2: Syncing flight prices

//Sync prices for multiple routes
const routes = [
  ['FRA', 'DEL'],
  ['DEL', 'LHR'],
  ['BOM', 'DXB'],
  ['JFK', 'LHR'],
  ['LHR', 'JFK'],
  ['JFK', 'CDG'],
  ['CDG', 'JFK'],
  ['LHR', 'DXB'],
  ['DXB', 'LHR'],
  ['SIN', 'SYD'],
  ['SYD', 'SIN'],
  ['LAX', 'HND'],
  ['HND', 'LAX'],
  ['FRA', 'JFK'],
  ['JFK', 'FRA'],
  ['DXB', 'SIN'],
  ['SIN', 'DXB'],
  ['DEL', 'CDG'],
  ['CDG', 'DEL'],
  ['LAX', 'SYD'],
  ['SYD', 'LAX']
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function syncFlightPrices() {
  console.log('Sync flight prices started...');
  for (const [from, to] of routes) {
    try {
      await syncPrices(from, to);
      await delay(2000); // 2-second gap
    } catch (err) {
      console.error(`Error syncing ${from}-${to}:`, err.message);
    }
  }
  console.log('Sync flight prices finished.');
}

const priceRoutes = require('./src/routes/prices');
app.use('/api/prices', priceRoutes);

const syncNeo4jRoutes = require('./src/jobs/syncNeo4jRoutes');

async function syncBusiestRoutes() {
  console.log('Syncing busiest routes to Neo4j...');
  await syncNeo4jRoutes();
}

if (process.env.ENABLE_PRICE_SYNC_ON_STARTUP === 'true') {
  syncFlightPrices()
    .then(() => {
      if (process.env.ENABLE_NEO4J_SYNC_ON_STARTUP === 'true') return syncBusiestRoutes();
    })
    .catch((err) => console.error('Startup sync error:', err.message));
} else if (process.env.ENABLE_NEO4J_SYNC_ON_STARTUP === 'true') {
  syncBusiestRoutes().catch((err) => console.error('Neo4j startup sync error:', err.message));
}

//User-Story 3: Syncing weather alerts
const syncWeatherAlerts = require('./src/jobs/syncWeatherAlerts');

if (process.env.ENABLE_WEATHER_CRON !== 'false') {
  cron.schedule(WEATHER_CRON, async () => {
    console.log('Syncing weather alerts...');
    await syncWeatherAlerts();
  });
}

//User-Story 4: Syncing restricted airspaces
const restrictedAirspaceRoutes = require('./src/routes/restrictedAirspaceRoutes');
app.use('/api/airspaces/restricted', restrictedAirspaceRoutes);

const syncRestrictedAirspaces = require('./src/jobs/syncRestrictedAirspaces');
if (process.env.ENABLE_AIRSPACE_SYNC_ON_STARTUP === 'true') {
  syncRestrictedAirspaces();
}

const syncNFZAlerts = require('./src/jobs/syncNFZAlerts');

if (process.env.ENABLE_NFZ_CRON !== 'false') {
  cron.schedule(NFZ_CRON, async () => {
    await syncNFZAlerts();
  });
}

const nfzAlertRoutes = require('./src/routes/nfzAlerts');
app.use('/api/alerts/nfz', nfzAlertRoutes);


app.use((req, res) => res.status(404).send('Not Found'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
