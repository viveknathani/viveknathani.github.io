import { SERVER_ENVIRONMENT } from './types';

export default {
  ENVIRONMENT: process.env.ENVIRONMENT || SERVER_ENVIRONMENT.DEV,
  PORT: process.env.PORT || '8080',
  MAX_HN_STORIES: Number(process.env.MAX_HN_STORIES || 0),
  TELEGRAM_API_KEY: process.env.TELEGRAM_API_KEY || '',
};
