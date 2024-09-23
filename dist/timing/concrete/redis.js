"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/timing/concrete/redis.ts
var redis_exports = {};
__export(redis_exports, {
  RedisTiming: () => RedisTiming,
  withRedisTiming: () => withRedisTiming
});
module.exports = __toCommonJS(redis_exports);
var import_ioredis = require("ioredis");
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
    this.client = new import_ioredis.Redis({
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RedisTiming,
  withRedisTiming
});
//# sourceMappingURL=redis.js.map