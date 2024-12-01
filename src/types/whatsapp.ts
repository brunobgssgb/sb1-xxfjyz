export interface WhatsAppConfig {
  secret: string;
  account: string;
}

export interface WhatsAppMessage {
  recipient: string;
  message: string;
  config?: WhatsAppConfig;
}