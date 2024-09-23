// src/log.ts
import { createLogger, format, transports } from "winston";
var logger = createLogger({
  transports: [
    new transports.Console({
      silent: true
    })
  ]
});

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
export {
  Scheduler
};
//# sourceMappingURL=index.mjs.map