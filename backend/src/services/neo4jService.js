const { driver } = require('./neo4j');

async function upsertRoute(origin, destination, count, minPrice, avgStops, bestScore, avgPrice) {
  const query = `
  MERGE (a:Airport {code: $origin})
  MERGE (b:Airport {code: $destination})
  MERGE (a)-[r:HAS_ROUTE]->(b)
  SET r.count = $count,
      r.minPrice = $minPrice,
      r.avgStops = $avgStops,
      r.bestScore = $bestScore,
      r.avgPrice = $avgPrice
  RETURN r
`;

  const session = process.env.NEO4J_DATABASE
    ? driver.session({ database: process.env.NEO4J_DATABASE })
    : driver.session();
  try {
    console.log(`Upserting route ${origin} -> ${destination}`);
    await session.run(query, { origin, destination, count, minPrice, avgStops, bestScore, avgPrice });
  } catch (err) {
    console.error(`Neo4j upsert error for ${origin} -> ${destination}:`, err.message);
  } finally {
    try {
      await session.close();
    } catch {
      // ignore close errors
    }
  }
}

module.exports = { upsertRoute };
