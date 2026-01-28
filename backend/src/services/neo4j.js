const neo4j = require('neo4j-driver');

const neo4jUser = process.env.NEO4J_USER || process.env.NEO4J_USERNAME;

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(neo4jUser, process.env.NEO4J_PASSWORD)
);

driver.verifyConnectivity()
  .then(() => console.log('Neo4j connected'))
  .catch((err) => console.error('Neo4j connection error:', err.message));

module.exports = { driver };