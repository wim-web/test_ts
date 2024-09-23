// src/timing/concrete/file.ts
import fs from "fs";
import * as path from "path";
var FileTiming = class {
  constructor(filepath) {
    this.filepath = filepath;
    this.locker = {};
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
export {
  FileTiming
};
//# sourceMappingURL=file.mjs.map