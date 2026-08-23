import type { BookingStatus, CustomerDetails, BookingQueryParams } from '@/lib/validation/booking';
import type { PaymentStatus } from '@/lib/validation/payment';
import type { SelectedExtraItem } from '@/lib/validation/extra';
import { supabase } from '@/lib/db/supabase';
import { logger } from '@/lib/utils/logger';

function mapDbRowToBooking(row: Record<string, unknown>): BookingRecord {
  return {
    id: String(row.id || ''),
    bookingNumber: String(row.booking_number || ''),
    userId: String(row.user_id || ''),
    vehicleId: String(row.vehicle_id || ''),
    pickupLocation: String(row.pickup_location || ''),
    dropoffLocation: String(row.dropoff_location || ''),
    pickupDate: new Date(String(row.pickup_date || Date.now())),
    dropoffDate: new Date(String(row.dropoff_date || Date.now())),
    pickupTime: String(row.pickup_time || '10:00'),
    returnTime: String(row.return_time || '10:00'),
    rentalDays: Number(row.rental_days || 1),
    dailyRate: Number(row.daily_rate || 0),
    baseAmount: Number(row.base_amount || 0),
    extrasAmount: Number(row.extras_amount || 0),
    discountAmount: Number(row.discount_amount || 0),
    taxAmount: Number(row.tax_amount || 0),
    finalAmount: Number(row.final_amount || 0),
    currency: String(row.currency || 'INR'),
    promoCode: row.promo_code ? String(row.promo_code) : undefined,
    customerDetails: (row.customer_details as CustomerDetails) || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    extras: (row.extras as SelectedExtraItem[]) || [],
    status: (row.status as BookingStatus) || 'PENDING',
    paymentStatus: (row.payment_status as PaymentStatus) || 'PENDING',
    razorpayOrderId: row.razorpay_order_id ? String(row.razorpay_order_id) : undefined,
    razorpayPaymentId: row.razorpay_payment_id ? String(row.razorpay_payment_id) : undefined,
    cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : undefined,
    createdAt: new Date(String(row.created_at || Date.now())),
    updatedAt: new Date(String(row.updated_at || Date.now())),
  };
}

export interface BookingRecord {
  id: string;
  bookingNumber: string;
  userId: string;
  vehicleId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: Date;
  dropoffDate: Date;
  pickupTime: string;
  returnTime: string;
  rentalDays: number;
  dailyRate: number;
  baseAmount: number;
  extrasAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  currency: string;
  promoCode?: string;
  customerDetails: CustomerDetails;
  extras: SelectedExtraItem[];
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingListResult {
  bookings: BookingRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminMetrics {
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  pendingPayments: number;
  confirmedBookings: number;
  activeRentals: number;
  completedRentals: number;
  cancelledBookings: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  bookingStatusDistribution: Record<string, number>;
  revenueByMonth: { month: string; revenue: number; bookings: number }[];
  popularVehicles: { vehicleId: string; make: string; model: string; bookingsCount: number }[];
}

const initialBookings: BookingRecord[] = [
  {
    id: 'bk-demo-001',
    bookingNumber: 'NR-2024-78210',
    userId: 'usr-customer-001',
    vehicleId: 'v-001-camry',
    pickupLocation: 'Sydney Airport Hub (SYD)',
    dropoffLocation: 'Sydney Airport Hub (SYD)',
    pickupDate: new Date('2026-09-10T10:00:00Z'),
    dropoffDate: new Date('2026-09-13T10:00:00Z'),
    pickupTime: '10:00',
    returnTime: '10:00',
    rentalDays: 3,
    dailyRate: 89,
    baseAmount: 267,
    extrasAmount: 25,
    discountAmount: 26.7,
    taxAmount: 0,
    finalAmount: 265.3,
    currency: 'INR',
    promoCode: 'SAVE10',
    customerDetails: {
      firstName: 'James',
      lastName: 'Harrison',
      email: 'james.harrison@example.com.au',
      phone: '+61 412 345 678',
      licenseNumber: 'NSW-9842109',
      address: '12 George Street',
      city: 'Sydney',
      state: 'NSW',
      postalCode: '2000',
    },
    extras: [
      {
        extraId: 'ext-zero-excess',
        code: 'ZERO_EXCESS',
        name: 'Zero Excess Premium Protection',
        pricingType: 'PER_DAY',
        price: 25,
        quantity: 1,
      },
    ],
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    razorpayOrderId: 'order_demo_1001',
    razorpayPaymentId: 'pay_demo_1001_success',
    createdAt: new Date('2026-08-15T08:30:00Z'),
    updatedAt: new Date('2026-08-15T08:32:00Z'),
  },
  {
    id: 'bk-demo-002',
    bookingNumber: 'NR-2024-78211',
    userId: 'usr-customer-002',
    vehicleId: 'v-003-3series',
    pickupLocation: 'Melbourne Tullamarine Airport (MEL)',
    dropoffLocation: 'Melbourne Tullamarine Airport (MEL)',
    pickupDate: new Date('2026-09-20T11:00:00Z'),
    dropoffDate: new Date('2026-09-25T11:00:00Z'),
    pickupTime: '11:00',
    returnTime: '11:00',
    rentalDays: 5,
    dailyRate: 179,
    baseAmount: 895,
    extrasAmount: 40,
    discountAmount: 134.25,
    taxAmount: 0,
    finalAmount: 800.75,
    currency: 'INR',
    promoCode: 'SUMMER15',
    customerDetails: {
      firstName: 'Olivia',
      lastName: 'Smith',
      email: 'olivia.smith@example.com.au',
      phone: '+61 423 456 789',
      licenseNumber: 'VIC-4581290',
      address: '88 Collins Street',
      city: 'Melbourne',
      state: 'VIC',
      postalCode: '3000',
    },
    extras: [
      {
        extraId: 'ext-roadside-plus',
        code: 'ROADSIDE_PLUS',
        name: '24/7 Roadside Assistance Plus',
        pricingType: 'PER_DAY',
        price: 8,
        quantity: 1,
      },
    ],
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    razorpayOrderId: 'order_demo_1002',
    razorpayPaymentId: 'pay_demo_1002_success',
    createdAt: new Date('2026-08-16T14:15:00Z'),
    updatedAt: new Date('2026-08-16T14:18:00Z'),
  },
];

class BookingStore {
  private bookings: Map<string, BookingRecord> = new Map(); // Key: id

  constructor() {
    this.reset();
  }

  public reset() {
    this.bookings.clear();
    initialBookings.forEach((b) => {
      this.bookings.set(b.id, {
        ...b,
        pickupDate: new Date(b.pickupDate),
        dropoffDate: new Date(b.dropoffDate),
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      });
    });
  }

  public async findById(id: string): Promise<BookingRecord | null> {
    const mem = this.bookings.get(id);
    if (mem) return { ...mem };

    try {
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1500),
      );
      const queryPromise = supabase.from('bookings').select('*').eq('id', id).maybeSingle();
      const { data } = (await Promise.race([queryPromise, timeoutPromise])) as {
        data: Record<string, unknown> | null;
      };
      if (data) {
        const mapped = mapDbRowToBooking(data);
        this.bookings.set(id, mapped);
        return { ...mapped };
      }
    } catch (err) {
      logger.warn('Notice querying Supabase bookings by ID:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return null;
  }

  public async findByBookingNumber(bookingNumber: string): Promise<BookingRecord | null> {
    for (const b of this.bookings.values()) {
      if (b.bookingNumber.toUpperCase() === bookingNumber.toUpperCase().trim()) {
        return { ...b };
      }
    }

    try {
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1500),
      );
      const queryPromise = supabase
        .from('bookings')
        .select('*')
        .eq('booking_number', bookingNumber.trim().toUpperCase())
        .maybeSingle();
      const { data } = (await Promise.race([queryPromise, timeoutPromise])) as {
        data: Record<string, unknown> | null;
      };
      if (data) {
        const mapped = mapDbRowToBooking(data);
        this.bookings.set(mapped.id, mapped);
        return { ...mapped };
      }
    } catch (err) {
      logger.warn('Notice querying Supabase bookings by bookingNumber:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return null;
  }

  public async findByRazorpayOrderId(orderId: string): Promise<BookingRecord | null> {
    for (const b of this.bookings.values()) {
      if (b.razorpayOrderId === orderId) {
        return { ...b };
      }
    }

    try {
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1500),
      );
      const queryPromise = supabase
        .from('bookings')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .maybeSingle();
      const { data } = (await Promise.race([queryPromise, timeoutPromise])) as {
        data: Record<string, unknown> | null;
      };
      if (data) {
        const mapped = mapDbRowToBooking(data);
        this.bookings.set(mapped.id, mapped);
        return { ...mapped };
      }
    } catch (err) {
      logger.warn('Notice querying Supabase bookings by razorpayOrderId:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return null;
  }

  public async listByUser(userId: string): Promise<BookingRecord[]> {
    const memList = Array.from(this.bookings.values())
      .filter(
        (b) =>
          b.userId === userId || b.customerDetails.email.toLowerCase() === userId.toLowerCase(),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    try {
      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 1500),
      );
      const queryPromise = supabase
        .from('bookings')
        .select('*')
        .or(`user_id.eq.${userId},customer_details->>email.eq.${userId.toLowerCase()}`)
        .order('created_at', { ascending: false });

      const { data } = (await Promise.race([queryPromise, timeoutPromise])) as {
        data: Record<string, unknown>[] | null;
      };

      if (data && data.length > 0) {
        const dbBookings = data.map(mapDbRowToBooking);
        dbBookings.forEach((b) => this.bookings.set(b.id, b));
        return dbBookings;
      }
    } catch (err) {
      logger.warn('Notice querying Supabase bookings for user:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return memList;
  }

  public async listForVehicle(vehicleId: string): Promise<BookingRecord[]> {
    return Array.from(this.bookings.values())
      .filter(
        (b) =>
          b.vehicleId === vehicleId &&
          (b.status === 'CONFIRMED' || b.status === 'ACTIVE' || b.status === 'PAYMENT_PENDING'),
      )
      .sort((a, b) => a.pickupDate.getTime() - b.pickupDate.getTime());
  }

  public async listAdmin(params: Partial<BookingQueryParams> = {}): Promise<BookingListResult> {
    let result = Array.from(this.bookings.values());

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(q) ||
          b.customerDetails.firstName.toLowerCase().includes(q) ||
          b.customerDetails.lastName.toLowerCase().includes(q) ||
          b.customerDetails.email.toLowerCase().includes(q) ||
          b.vehicleId.toLowerCase().includes(q),
      );
    }

    if (params.status && params.status !== 'ALL') {
      result = result.filter((b) => b.status === params.status);
    }

    if (params.vehicleId) {
      result = result.filter((b) => b.vehicleId === params.vehicleId);
    }

    if (params.userId) {
      result = result.filter((b) => b.userId === params.userId);
    }

    if (params.startDate) {
      result = result.filter((b) => b.pickupDate >= params.startDate!);
    }
    if (params.endDate) {
      result = result.filter((b) => b.dropoffDate <= params.endDate!);
    }

    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = result.length;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      bookings: paginated.map((b) => ({ ...b })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async create(
    data: Omit<BookingRecord, 'id' | 'bookingNumber' | 'createdAt' | 'updatedAt'>,
  ): Promise<BookingRecord> {
    const id = `bk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const bookingNumber = `NR-${new Date().getFullYear()}-${randomNum}`;
    const now = new Date();

    const newRecord: BookingRecord = {
      ...data,
      id,
      bookingNumber,
      createdAt: now,
      updatedAt: now,
    };

    this.bookings.set(id, newRecord);

    try {
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
      const dbPromise = supabase.from('bookings').upsert({
        id,
        booking_number: bookingNumber,
        user_id: data.userId,
        vehicle_id: data.vehicleId,
        pickup_location: data.pickupLocation,
        dropoff_location: data.dropoffLocation,
        pickup_date: data.pickupDate.toISOString(),
        dropoff_date: data.dropoffDate.toISOString(),
        pickup_time: data.pickupTime || '10:00',
        return_time: data.returnTime || '10:00',
        rental_days: data.rentalDays,
        daily_rate: data.dailyRate,
        base_amount: data.baseAmount,
        extras_amount: data.extrasAmount || 0,
        discount_amount: data.discountAmount || 0,
        tax_amount: data.taxAmount || 0,
        final_amount: data.finalAmount,
        currency: data.currency || 'INR',
        promo_code: data.promoCode || null,
        customer_details: data.customerDetails,
        extras: data.extras || [],
        status: data.status || 'PAYMENT_PENDING',
        payment_status: data.paymentStatus || 'PENDING',
        razorpay_order_id: data.razorpayOrderId || null,
        razorpay_payment_id: data.razorpayPaymentId || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
      await Promise.race([dbPromise, timeoutPromise]);
    } catch (err) {
      logger.warn('Notice syncing booking to Supabase:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return { ...newRecord };
  }

  public async updateStatus(
    id: string,
    status: BookingStatus,
    paymentStatus?: PaymentStatus,
    paymentId?: string,
  ): Promise<BookingRecord | null> {
    let existing = this.bookings.get(id);
    if (!existing) {
      existing = (await this.findById(id)) || undefined;
    }
    if (!existing) return null;

    const updated: BookingRecord = {
      ...existing,
      status,
      ...(paymentStatus && { paymentStatus }),
      ...(paymentId && { razorpayPaymentId: paymentId }),
      updatedAt: new Date(),
    };

    this.bookings.set(id, updated);

    try {
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
      const dbPromise = supabase
        .from('bookings')
        .update({
          status,
          ...(paymentStatus && { payment_status: paymentStatus }),
          ...(paymentId && { razorpay_payment_id: paymentId }),
          updated_at: updated.updatedAt.toISOString(),
        })
        .eq('id', id);
      await Promise.race([dbPromise, timeoutPromise]);
    } catch (err) {
      logger.warn('Notice updating booking status in Supabase:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return { ...updated };
  }

  public async cancel(id: string, reason: string): Promise<BookingRecord | null> {
    let existing = this.bookings.get(id);
    if (!existing) {
      existing = (await this.findById(id)) || undefined;
    }
    if (!existing) return null;

    const updated: BookingRecord = {
      ...existing,
      status: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    };

    this.bookings.set(id, updated);

    try {
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
      const dbPromise = supabase
        .from('bookings')
        .update({
          status: 'CANCELLED',
          cancellation_reason: reason,
          updated_at: updated.updatedAt.toISOString(),
        })
        .eq('id', id);
      await Promise.race([dbPromise, timeoutPromise]);
    } catch (err) {
      logger.warn('Notice updating booking cancellation in Supabase:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return { ...updated };
  }
}

const globalForBooking = globalThis as unknown as {
  __nr_bookingStore: BookingStore | undefined;
};

export const bookingStore =
  globalForBooking.__nr_bookingStore ?? (globalForBooking.__nr_bookingStore = new BookingStore());
