// src/log.ts
import { createLogger, format, transports } from "winston";
var logger = createLogger({
  transports: [
    new transports.Console({
      silent: true
    })
  ]
});
var enableLog = (level) => {
  logger = createLogger({
    level,
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
    transports: [
      new transports.Console()
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
import { setTimeout } from "timers/promises";
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
          await setTimeout(remainingSleepTime, null, { signal: controller.signal });
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
  Scheduler,
  enableLog,
  logger,
  withRedisTiming
};
//# sourceMappingURL=index.mjs.map