import type { PaymentStatus } from '@/lib/validation/payment';
import { supabase } from '@/lib/db/supabase';
import { logger } from '@/lib/utils/logger';

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

    // Asynchronously persist to Supabase PostgreSQL table
    try {
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
      const dbPromise = supabase.from('payments').upsert({
        id,
        booking_id: record.bookingId || null,
        vehicle_id: record.vehicleId || 'v-001-camry',
        razorpay_order_id: record.razorpayOrderId,
        razorpay_payment_id: record.razorpayPaymentId || null,
        razorpay_signature: record.razorpaySignature || null,
        amount: record.amount,
        currency: record.currency || 'INR',
        status: record.status || 'CREATED',
        receipt: record.receipt || null,
        notes: record.notes || {},
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
      await Promise.race([dbPromise, timeoutPromise]);
    } catch (err) {
      logger.warn('Notice: Supabase payment record sync (in-memory active):', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return { ...payment };
  }

  public async findByOrderId(orderId: string): Promise<PaymentRecord | null> {
    const memPayment = this.payments.get(orderId);
    if (memPayment) return { ...memPayment };

    // Query Supabase for serverless cross-instance resilience
    try {
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1500),
      );
      const queryPromise = supabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .maybeSingle();

      const { data } = (await Promise.race([queryPromise, timeoutPromise])) as {
        data: Record<string, unknown> | null;
      };

      if (data) {
        const record: PaymentRecord = {
          id: String(data.id || ''),
          bookingId: data.booking_id ? String(data.booking_id) : undefined,
          vehicleId: data.vehicle_id ? String(data.vehicle_id) : undefined,
          razorpayOrderId: String(data.razorpay_order_id || orderId),
          razorpayPaymentId: data.razorpay_payment_id ? String(data.razorpay_payment_id) : undefined,
          razorpaySignature: data.razorpay_signature ? String(data.razorpay_signature) : undefined,
          amount: Number(data.amount || 0),
          currency: String(data.currency || 'INR'),
          status: (data.status as PaymentStatus) || 'CREATED',
          receipt: data.receipt ? String(data.receipt) : undefined,
          notes: (data.notes as Record<string, unknown>) || {},
          createdAt: new Date(String(data.created_at || Date.now())),
          updatedAt: new Date(String(data.updated_at || Date.now())),
        };
        this.payments.set(orderId, record);
        return { ...record };
      }
    } catch (err) {
      logger.warn('Notice querying Supabase payments table:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return null;
  }

  public async findByPaymentId(paymentId: string): Promise<PaymentRecord | null> {
    for (const payment of this.payments.values()) {
      if (payment.razorpayPaymentId === paymentId) {
        return { ...payment };
      }
    }

    // Query Supabase
    try {
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1500),
      );
      const queryPromise = supabase
        .from('payments')
        .select('*')
        .eq('razorpay_payment_id', paymentId)
        .maybeSingle();

      const { data } = (await Promise.race([queryPromise, timeoutPromise])) as {
        data: Record<string, unknown> | null;
      };

      if (data) {
        const record: PaymentRecord = {
          id: String(data.id || ''),
          bookingId: data.booking_id ? String(data.booking_id) : undefined,
          vehicleId: data.vehicle_id ? String(data.vehicle_id) : undefined,
          razorpayOrderId: String(data.razorpay_order_id || ''),
          razorpayPaymentId: String(data.razorpay_payment_id || paymentId),
          razorpaySignature: data.razorpay_signature ? String(data.razorpay_signature) : undefined,
          amount: Number(data.amount || 0),
          currency: String(data.currency || 'INR'),
          status: (data.status as PaymentStatus) || 'CREATED',
          receipt: data.receipt ? String(data.receipt) : undefined,
          notes: (data.notes as Record<string, unknown>) || {},
          createdAt: new Date(String(data.created_at || Date.now())),
          updatedAt: new Date(String(data.updated_at || Date.now())),
        };
        this.payments.set(record.razorpayOrderId, record);
        return { ...record };
      }
    } catch (err) {
      logger.warn('Notice querying Supabase payments by payment ID:', {
        error: err instanceof Error ? err.message : String(err),
      });
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
    let existing = this.payments.get(orderId);
    if (!existing) {
      existing = await this.findByOrderId(orderId) || undefined;
    }

    const updated: PaymentRecord = {
      id: existing?.id || `pay-rec-${Date.now()}`,
      bookingId: existing?.bookingId,
      vehicleId: existing?.vehicleId,
      razorpayOrderId: orderId,
      amount: existing?.amount || 0,
      currency: existing?.currency || 'INR',
      status,
      receipt: existing?.receipt,
      notes: existing?.notes,
      razorpayPaymentId: extra.razorpayPaymentId || existing?.razorpayPaymentId,
      razorpaySignature: extra.razorpaySignature || existing?.razorpaySignature,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.payments.set(orderId, updated);

    // Sync status to Supabase
    try {
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
      const dbPromise = supabase
        .from('payments')
        .update({
          status,
          razorpay_payment_id: updated.razorpayPaymentId || null,
          razorpay_signature: updated.razorpaySignature || null,
          updated_at: updated.updatedAt.toISOString(),
        })
        .eq('razorpay_order_id', orderId);
      await Promise.race([dbPromise, timeoutPromise]);
    } catch (err) {
      logger.warn('Notice updating payment status in Supabase:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

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
