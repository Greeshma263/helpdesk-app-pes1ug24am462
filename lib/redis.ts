import { createClient, type RedisClientType } from "redis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not configured");
}

export const redisClient: RedisClientType = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 1000,
    reconnectStrategy: false,
  },
});

redisClient.on("error", (error) => {
  console.error("Redis client error:", error);
});

let connectionPromise: Promise<RedisClientType> | null = null;

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient.isOpen) {
    return redisClient;
  }

  if (!connectionPromise) {
    connectionPromise = redisClient
      .connect()
      .then(() => redisClient)
      .finally(() => {
        connectionPromise = null;
      });
  }

  try {
    return await connectionPromise;
  } catch (error) {
    console.error("Redis connection failed:", error);
    return null;
  }
}
