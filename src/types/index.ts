// ... outros tipos ...

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  createdAt: Date;
  status: 'pending' | 'completed' | 'cancelled';
  rechargeCodes: string[];
  paymentId?: string;
  paymentStatus: 'pending' | 'approved' | 'rejected';
}