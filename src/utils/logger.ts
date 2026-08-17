import winston from 'winston';

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const colors = { error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'white' };

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const replacer = (_key: string, value: unknown): unknown =>
      value instanceof Error ? { name: value.name, message: value.message, stack: value.stack } : value;
    let metadata = '';
    if (Object.keys(meta).length > 0) {
      try {
        metadata = ` ${JSON.stringify(meta, replacer)}`;
      } catch {
        metadata = ' [unserializable metadata]';
      }
    }
    const errorStack = stack ? `\n${stack}` : '';
    return `${timestamp} ${level}: ${message}${metadata}${errorStack}`;
  })
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  new winston.transports.File({ filename: 'logs/all.log' })
];

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports
});
