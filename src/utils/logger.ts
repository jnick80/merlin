import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { env } from '../config/env';

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const colors = { error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'white' };

type LogSection = 'app' | 'startup' | 'request' | 'database' | 'runtime' | 'error' | 'diagnostics';

type LogMetadata = Record<string, unknown>;

winston.addColors(colors);

const stringifyMetadata = (metadata?: LogMetadata): string => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }

  return JSON.stringify(metadata, (_key, value) => {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    return value;
  });
};

const prettyConsoleFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.metadata({
    fillExcept: [
      'message',
      'level',
      'timestamp',
      'label',
      'section',
      'service',
      'requestId',
      'stack',
    ],
  }),
  winston.format.colorize({ all: false }),
  winston.format.printf((info) => {
    const labels = [
      `[${String(info.service ?? env.APP_NAME)}]`,
      `[${String(info.section ?? 'app').toUpperCase()}]`,
    ];

    if (info.requestId) {
      labels.push(`[req:${String(info.requestId)}]`);
    }

    const metadata = stringifyMetadata(info.metadata as LogMetadata);
    const stack = typeof info.stack === 'string' ? `\n${info.stack}` : '';
    const metadataSuffix = metadata ? ` | ${metadata}` : '';

    return `${info.timestamp} ${labels.join(' ')} ${String(info.level).toUpperCase()} :: ${info.message}${metadataSuffix}${stack}`;
  })
);

const structuredFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.LOG_FORMAT === 'json' ? structuredFormat : prettyConsoleFormat,
  }),
];

if (env.LOG_TO_FILES) {
  fs.mkdirSync(path.resolve(process.cwd(), env.LOG_DIR), { recursive: true });

  transports.push(
    new winston.transports.File({
      filename: path.resolve(process.cwd(), env.LOG_DIR, 'error.log'),
      level: 'error',
      format: structuredFormat,
    }),
    new winston.transports.File({
      filename: path.resolve(process.cwd(), env.LOG_DIR, 'all.log'),
      format: structuredFormat,
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels,
  defaultMeta: { service: env.APP_NAME },
  transports,
});

export const createSectionLogger = (section: LogSection): winston.Logger =>
  logger.child({ section });
