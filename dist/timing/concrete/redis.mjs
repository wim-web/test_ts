// src/timing/concrete/redis.ts
import { Redis } from "ioredis";
var withRedisTiming = async (input, f) => {
  const timing = new RedisTiming(input);
  try {
    await f(timing);
  } finally {
    await timing.terminate();
  }
};
var RedisTiming = class {
  constructor({ host, port, keyPrefix }) {
    this.client = new Redis({
      host,
      port,
      keyPrefix
    });
  }
  async allow({
    key,
    date
  }) {
    const result = await this.client.exists(key);
    return result === 0;
  }
  async complete({
    key,
    constraint,
    date
  }) {
    const next = constraint.next(date).getTime();
    const ttl = Math.floor((next - date.getTime()) / 1e3);
    if (ttl > 0) {
      await this.client.set(key, "", "EX", ttl);
    }
  }
  async terminate() {
    await this.client.quit();
  }
};
export {
  RedisTiming,
  withRedisTiming
};
//# sourceMappingURL=redis.mjs.map