import type { PaymentStatus } from '@/lib/validation/payment';

export interface PaymentRecord {
  id: string;
  bookingId?: string;
  vehicleId?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number; // In INR / major units
  currency: string;
  status: PaymentStatus;
  receipt?: string;
  notes?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

class PaymentStore {
  private payments: Map<string, PaymentRecord> = new Map(); // Key: razorpayOrderId

  public reset() {
    this.payments.clear();
  }

  public async create(
    record: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PaymentRecord> {
    const id = `pay-rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const payment: PaymentRecord = {
      ...record,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.set(record.razorpayOrderId, payment);
    return { ...payment };
  }

  public async findByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const payment = this.payments.get(orderId);
    return payment ? { ...payment } : null;
  }

  public async findByPaymentId(paymentId: string): Promise<PaymentRecord | null> {
    for (const payment of this.payments.values()) {
      if (payment.razorpayPaymentId === paymentId) {
        return { ...payment };
      }
    }
    return null;
  }

  public async updateStatus(
    orderId: string,
    status: PaymentStatus,
    extra: {
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    } = {},
  ): Promise<PaymentRecord | null> {
    const existing = this.payments.get(orderId);
    if (!existing) return null;

    const updated: PaymentRecord = {
      ...existing,
      status,
      razorpayPaymentId: extra.razorpayPaymentId || existing.razorpayPaymentId,
      razorpaySignature: extra.razorpaySignature || existing.razorpaySignature,
      updatedAt: new Date(),
    };
    this.payments.set(orderId, updated);
    return { ...updated };
  }

  public async list(): Promise<PaymentRecord[]> {
    return Array.from(this.payments.values());
  }

  public async getAll(): Promise<PaymentRecord[]> {
    return Array.from(this.payments.values());
  }
}

const globalForPayment = globalThis as unknown as {
  __nr_paymentStore: PaymentStore | undefined;
};

export const paymentStore =
  globalForPayment.__nr_paymentStore ?? (globalForPayment.__nr_paymentStore = new PaymentStore());
