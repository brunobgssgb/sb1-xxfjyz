import { WhatsAppConfig } from './whatsapp';
import { PaymentConfig } from './payment';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  status: 'pending' | 'active' | 'inactive';
  createdAt: Date;
  phone: string;
  whatsappConfig?: WhatsAppConfig;
  paymentConfig?: PaymentConfig;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordRecovery {
  email: string;
  code: string;
  expiresAt: Date;
}