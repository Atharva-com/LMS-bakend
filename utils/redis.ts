import {Redis} from 'ioredis'
require('dotenv').config()

const redisClient = () => {
    if (process.env.REDIS_URL) {
      console.log("Connecting to Redis...");
      return new Redis(process.env.REDIS_URL);
    }
    throw new Error('Redis connection failed: REDIS_URL not set');
  };
  

export const redis = redisClient();