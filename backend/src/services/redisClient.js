const redis = require('redis');

const client = process.env.REDIS_URL
  ? redis.createClient({ url: process.env.REDIS_URL })
  : redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    });

client.connect()
.then(() => console.log('Redis connected'))
.catch(console.error);

module.exports = client;
