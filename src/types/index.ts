enum SERVER_ENVIRONMENT {
  DEV = 'dev',
  PROD = 'prod',
}

enum NOTIFICATION_CHANNEL {
  TELEGRAM = 'telegram',
}

interface TelegramRequest {
  text: string;
}

interface NotificationRequest {
  channel: NOTIFICATION_CHANNEL;
  data: TelegramRequest;
}

export {
  SERVER_ENVIRONMENT,
  NOTIFICATION_CHANNEL,
  TelegramRequest,
  NotificationRequest,
};
