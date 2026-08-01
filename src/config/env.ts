import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  APP_NAME: Joi.string().trim().default('merlin-business-os'),
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),
  LOG_FORMAT: Joi.string().valid('pretty', 'json').default('pretty'),
  LOG_TO_FILES: Joi.boolean().truthy('true').truthy('1').falsy('false').falsy('0').default(true),
  LOG_DIR: Joi.string().trim().default('logs'),
  DB_HOST: Joi.string().hostname().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().trim().default('merlin_db'),
  DB_USER: Joi.string().trim().default('merlin_user'),
  DB_PASSWORD: Joi.string().allow('').default('secure_password'),
  API_VERSION: Joi.string().trim().default('v1'),
  API_BASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:3000/api'),
  CORS_ORIGIN: Joi.string().trim().default('http://localhost:3000'),
  JWT_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(24).required(),
    otherwise: Joi.string().min(12).default('development-secret-key'),
  }),
  PLATFORM_EXECUTOR: Joi.string().valid('local-simulated').default('local-simulated'),
})
  .unknown(true)
  .required();

const { error, value } = envSchema.validate(process.env, { abortEarly: false, convert: true });

if (error) {
  throw new Error(
    `Invalid environment configuration:\n${error.details.map((detail) => `- ${detail.message}`).join('\n')}`
  );
}

export const env = {
  APP_NAME: value.APP_NAME as string,
  NODE_ENV: value.NODE_ENV as 'development' | 'test' | 'production',
  PORT: value.PORT as number,
  LOG_LEVEL: value.LOG_LEVEL as 'error' | 'warn' | 'info' | 'http' | 'debug',
  LOG_FORMAT: value.LOG_FORMAT as 'pretty' | 'json',
  LOG_TO_FILES: value.NODE_ENV === 'test' ? false : (value.LOG_TO_FILES as boolean),
  LOG_DIR: value.LOG_DIR as string,
  DB_HOST: value.DB_HOST as string,
  DB_PORT: value.DB_PORT as number,
  DB_NAME: value.DB_NAME as string,
  DB_USER: value.DB_USER as string,
  DB_PASSWORD: value.DB_PASSWORD as string,
  API_VERSION: value.API_VERSION as string,
  API_BASE_URL: value.API_BASE_URL as string,
  CORS_ORIGIN: value.CORS_ORIGIN as string,
  JWT_SECRET: value.JWT_SECRET as string,
  PLATFORM_EXECUTOR: value.PLATFORM_EXECUTOR as 'local-simulated',
};

export const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
