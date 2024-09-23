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
export {
  enableLog,
  logger
};
//# sourceMappingURL=log.mjs.map