"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Daily: () => Daily,
  FileTiming: () => FileTiming,
  Rate: () => Rate,
  RedisTiming: () => RedisTiming,
  Scheduler: () => Scheduler,
  enableLog: () => enableLog,
  logger: () => logger,
  withRedisTiming: () => withRedisTiming
});
module.exports = __toCommonJS(src_exports);

// src/log.ts
var import_winston = require("winston");
var logger = (0, import_winston.createLogger)({
  transports: [
    new import_winston.transports.Console({
      silent: true
    })
  ]
});
var enableLog = (level) => {
  logger = (0, import_winston.createLogger)({
    level,
    format: import_winston.format.combine(
      import_winston.format.timestamp(),
      import_winston.format.json()
    ),
    transports: [
      new import_winston.transports.Console()
    ]
  });
};

// src/util/function.ts
function calculateMilliseconds({
  h,
  m,
  s,
  ms
}) {
  const toM = (h2) => h2 * 60;
  const toS = (m2) => m2 * 60;
  const toMS = (s2) => s2 * 1e3;
  return toMS(
    toS(
      toM(
        h || 0
      ) + (m || 0)
    ) + (s || 0)
  ) + (ms || 0);
}

// src/scheduler/index.ts
var import_promises = require("timers/promises");
var Scheduler = class {
  constructor(mode, timing, tasks) {
    this.mode = mode;
    this.timing = timing;
    this.tasks = tasks;
  }
  async run() {
    logger.debug(`run`, { mode: this.mode._type });
    switch (this.mode._type) {
      case "shot":
        await this.oneCycle();
        break;
      case "loop":
        await this.loop(this.mode.oneCycleTime);
        break;
    }
  }
  async oneCycle() {
    for (const task of this.tasks) {
      logger.info(`start ${task.name}`, { task_name: task.name });
      try {
        const input = {
          key: task.name,
          date: /* @__PURE__ */ new Date()
        };
        if (!await this.timing.allow(input)) {
          continue;
        }
        await task.fn();
        await this.timing.complete({
          ...input,
          constraint: task.constraint
        });
        logger.info(`end ${task.name}`, { task_name: task.name });
      } catch (e) {
      }
    }
  }
  async loop(oneCycleTime) {
    const totalSleepMs = calculateMilliseconds(oneCycleTime);
    let running = true;
    const controller = new AbortController();
    const signalHandle = () => {
      running = false;
      controller.abort();
    };
    process.on("SIGINT", () => {
      signalHandle();
    });
    process.on("SIGTERM", () => {
      signalHandle();
    });
    process.on("SIGQUIT", () => {
      signalHandle();
    });
    try {
      while (running) {
        const startTime = Date.now();
        logger.debug("start oneCycle");
        await this.oneCycle();
        const endTime = Date.now();
        logger.debug("end oneCycle");
        const elapsedTime = endTime - startTime;
        const remainingSleepTime = totalSleepMs - elapsedTime;
        if (remainingSleepTime > 0 && running) {
          logger.debug("sleep", { sleep_time_ms: remainingSleepTime, sleep_time_s: remainingSleepTime / 1e3, sleep_time_m: remainingSleepTime / (1e3 * 60) });
          await (0, import_promises.setTimeout)(remainingSleepTime, null, { signal: controller.signal });
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        logger.info("", e);
        logger.debug("stopping");
      } else {
        throw e;
      }
    }
  }
};

// src/timing/concrete/file.ts
var import_fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var FileTiming = class {
  constructor(filepath) {
    this.filepath = filepath;
    const dir = path.dirname(this.filepath);
    if (!import_fs.default.existsSync(dir)) {
      import_fs.default.mkdirSync(dir, { recursive: true });
    }
    if (!import_fs.default.existsSync(this.filepath)) {
      this.flush();
      return;
    }
    this.read();
  }
  locker = {};
  read() {
    this.locker = JSON.parse(import_fs.default.readFileSync(this.filepath, "utf-8"));
  }
  flush() {
    import_fs.default.writeFileSync(this.filepath, JSON.stringify(this.locker), "utf-8");
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
  client;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Daily,
  FileTiming,
  Rate,
  RedisTiming,
  Scheduler,
  enableLog,
  logger,
  withRedisTiming
});
//# sourceMappingURL=index.js.map