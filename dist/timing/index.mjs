// src/timing/concrete/file.ts
import fs from "fs";
import * as path from "path";
var FileTiming = class {
  constructor(filepath) {
    this.filepath = filepath;
    const dir = path.dirname(this.filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filepath)) {
      this.flush();
      return;
    }
    this.read();
  }
  locker = {};
  read() {
    this.locker = JSON.parse(fs.readFileSync(this.filepath, "utf-8"));
  }
  flush() {
    fs.writeFileSync(this.filepath, JSON.stringify(this.locker), "utf-8");
  }
  async allow({
    key,
    date
  }) {
    if (this.locker[key] === void 0) {
      return true;
    }
    const nextTime = new Date(this.locker[key]);
    return date >= nextTime;
  }
  async complete({
    key,
    constraint,
    date
  }) {
    this.locker[key] = constraint.next(date).toISOString();
    this.flush();
  }
};

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
  client;
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

// src/timing/concrete/constraint.ts
var Rate = class {
  constructor(param) {
    this.param = param;
  }
  next(date) {
    const h_ms = (this.param.h || 0) * 60 * 60 * 1e3;
    const m_ms = (this.param.m || 0) * 60 * 1e3;
    const timestamp = date.getTime();
    return new Date(timestamp + h_ms + m_ms);
  }
};
var Daily = class {
  constructor(param) {
    this.param = param;
  }
  next(date) {
    const base = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), this.param.h, this.param.m)
    );
    return date <= base ? base : (() => {
      base.setDate(base.getDate() + 1);
      return base;
    })();
  }
};
export {
  Daily,
  FileTiming,
  Rate,
  RedisTiming,
  withRedisTiming
};
//# sourceMappingURL=index.mjs.map