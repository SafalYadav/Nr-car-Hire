import type { DiscountCreateInput, DiscountUpdateInput } from '@/lib/validation/discount';

export interface DiscountRecord extends DiscountCreateInput {
  id: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const initialDiscounts: DiscountRecord[] = [
  {
    id: 'disc-save10',
    code: 'SAVE10',
    description: '10% discount on all Australian rentals',
    discountType: 'PERCENTAGE',
    value: 10,
    minRentalDays: 2,
    maxDiscountAmount: 100,
    usageLimit: 1000,
    usageCount: 0,
    perCustomerLimit: 2,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'disc-weekend50',
    code: 'WEEKEND50',
    description: '₹50 flat discount for bookings over 3 days',
    discountType: 'FIXED_AMOUNT',
    value: 50,
    minRentalDays: 3,
    minBookingValue: 200,
    usageLimit: 500,
    usageCount: 0,
    perCustomerLimit: 1,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'disc-summer15',
    code: 'SUMMER15',
    description: '15% summer holiday discount on Premium & Luxury sedans',
    discountType: 'PERCENTAGE',
    value: 15,
    minRentalDays: 4,
    applicableCategories: ['Premium', 'Luxury', 'SUV'],
    usageLimit: 250,
    usageCount: 0,
    perCustomerLimit: 1,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
];

class DiscountStore {
  private discounts: Map<string, DiscountRecord> = new Map(); // Key: code.toUpperCase()

  constructor() {
    this.reset();
  }

  public reset() {
    this.discounts.clear();
    initialDiscounts.forEach((d) => {
      this.discounts.set(d.code.toUpperCase(), { ...d });
    });
  }

  public async findByCode(code: string): Promise<DiscountRecord | null> {
    const record = this.discounts.get(code.toUpperCase().trim());
    return record ? { ...record } : null;
  }

  public async findById(id: string): Promise<DiscountRecord | null> {
    for (const d of this.discounts.values()) {
      if (d.id === id) return { ...d };
    }
    return null;
  }

  public async list(): Promise<DiscountRecord[]> {
    return Array.from(this.discounts.values());
  }

  public async create(data: DiscountCreateInput): Promise<DiscountRecord> {
    const id = `disc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const newRecord: DiscountRecord = {
      ...data,
      code: data.code.toUpperCase().trim(),
      id,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.discounts.set(newRecord.code, newRecord);
    return { ...newRecord };
  }

  public async update(id: string, data: DiscountUpdateInput): Promise<DiscountRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: DiscountRecord = {
      ...existing,
      ...data,
      code: data.code ? data.code.toUpperCase().trim() : existing.code,
      updatedAt: new Date(),
    };

    if (data.code && data.code.toUpperCase().trim() !== existing.code) {
      this.discounts.delete(existing.code);
    }
    this.discounts.set(updated.code, updated);
    return { ...updated };
  }

  public async toggleStatus(id: string, isActive: boolean): Promise<DiscountRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: DiscountRecord = {
      ...existing,
      isActive,
      updatedAt: new Date(),
    };
    this.discounts.set(updated.code, updated);
    return { ...updated };
  }

  public async incrementUsage(code: string): Promise<void> {
    const record = this.discounts.get(code.toUpperCase().trim());
    if (record) {
      record.usageCount += 1;
      record.updatedAt = new Date();
    }
  }
}

const globalForDiscount = globalThis as unknown as {
  __nr_discountStore: DiscountStore | undefined;
};

export const discountStore =
  globalForDiscount.__nr_discountStore ??
  (globalForDiscount.__nr_discountStore = new DiscountStore());
