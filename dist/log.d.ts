import * as winston from 'winston';

declare let logger: winston.Logger;
declare const enableLog: (level: string) => void;

export { enableLog, logger };
