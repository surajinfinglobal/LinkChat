const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL?.trim();
const redisConfigured = Boolean(redisUrl);

const redisClient = createClient({
  url: redisUrl || "redis://127.0.0.1:6379",
  socket: {
    reconnectStrategy: (retries) => (retries < 3 ? 1000 : false),
  },
});

let redisErrorReported = false;

const reportRedisUnavailable = (error) => {
  if (!redisConfigured || redisErrorReported) {
    return;
  }

  redisErrorReported = true;
  console.warn("Redis unavailable; continuing without cache:", error.message);
};

redisClient.on("error", (error) => {
  reportRedisUnavailable(error);
});

redisClient.on("connect", () => {
  console.log("Redis connecting...");
});

redisClient.on("ready", () => {
  redisErrorReported = false;
  console.log("Redis is ready");
});

redisClient.on("end", () => {
  console.log("Redis connection closed");
});

const connectRedis = async () => {
  if (!redisConfigured) {
    console.log("Redis disabled: REDIS_URL is not configured");
    return;
  }

  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (error) {
      reportRedisUnavailable(error);
    }
  }
};

const getCacheValue = async (key) => {
  if (!redisConfigured || !redisClient.isReady) {
    return null;
  }

  try {
    return await redisClient.get(key);
  } catch (error) {
    reportRedisUnavailable(error);
    return null;
  }
};

const setCacheValue = async (key, seconds, value) => {
  if (!redisConfigured || !redisClient.isReady) {
    return false;
  }

  try {
    await redisClient.setEx(key, seconds, value);
    return true;
  } catch (error) {
    reportRedisUnavailable(error);
    return false;
  }
};

const invalidateCache = async (key) => {
  if (!redisConfigured || !redisClient.isReady) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    reportRedisUnavailable(error);
    return false;
  }
};

module.exports = {
  connectRedis,
  getCacheValue,
  setCacheValue,
  invalidateCache,
};