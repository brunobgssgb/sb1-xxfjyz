export interface PaymentConfig {
  accessToken: string;
  webhookUrl: string;
}

export interface PaymentData {
  transactionAmount: number;
  description: string;
  payerEmail: string;
  payerFirstName: string;
}

export interface PaymentResponse {
  success: boolean;
  error?: string;
  pixCopiaECola?: string;
  paymentId?: string;
}

export interface PaymentWebhookData {
  id: string;
  status: 'approved' | 'rejected' | 'pending';
  external_reference: string;
}