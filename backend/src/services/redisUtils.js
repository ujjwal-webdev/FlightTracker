const redis = require('./redisClient');

async function scanKeys(pattern, options = {}) {
  const limit = typeof options.limit === 'number' ? options.limit : Infinity;
  const count = typeof options.count === 'number' ? options.count : 100;

  const keys = [];

  for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: count })) {
    keys.push(key);
    if (keys.length >= limit) break;
  }

  return keys;
}

module.exports = { scanKeys };

