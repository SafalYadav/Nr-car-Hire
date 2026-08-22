export type PricingRuleType =
  'DAILY_OVERRIDE' | 'WEEKEND_SURCHARGE' | 'SEASONAL' | 'LOCATION_SURCHARGE';

export interface PricingRuleRecord {
  id: string;
  name: string;
  vehicleId?: string;
  category?: string;
  location?: string;
  ruleType: PricingRuleType;
  adjustment: number; // e.g. 20 (flat addition) or percentage/override
  startDate?: Date;
  endDate?: Date;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const initialRules: PricingRuleRecord[] = [
  {
    id: 'pr-weekend-suv',
    name: 'Weekend SUV Surcharge',
    category: 'SUV',
    ruleType: 'WEEKEND_SURCHARGE',
    adjustment: 15,
    priority: 1,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
];

class PricingStore {
  private rules: Map<string, PricingRuleRecord> = new Map();

  constructor() {
    this.reset();
  }

  public reset() {
    this.rules.clear();
    initialRules.forEach((r) => {
      this.rules.set(r.id, { ...r });
    });
  }

  public async list(onlyActive = true): Promise<PricingRuleRecord[]> {
    const list = Array.from(this.rules.values());
    return onlyActive ? list.filter((r) => r.isActive) : list;
  }

  public async findById(id: string): Promise<PricingRuleRecord | null> {
    const rule = this.rules.get(id);
    return rule ? { ...rule } : null;
  }

  public async create(
    data: Omit<PricingRuleRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PricingRuleRecord> {
    const id = `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const newRecord: PricingRuleRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.rules.set(id, newRecord);
    return { ...newRecord };
  }

  public async update(
    id: string,
    data: Partial<PricingRuleRecord>,
  ): Promise<PricingRuleRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: PricingRuleRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.rules.set(id, updated);
    return { ...updated };
  }

  public async toggle(id: string, isActive: boolean): Promise<PricingRuleRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: PricingRuleRecord = {
      ...existing,
      isActive,
      updatedAt: new Date(),
    };
    this.rules.set(id, updated);
    return { ...updated };
  }
}

const globalForPricing = globalThis as unknown as {
  __nr_pricingStore: PricingStore | undefined;
};

export const pricingStore =
  globalForPricing.__nr_pricingStore ?? (globalForPricing.__nr_pricingStore = new PricingStore());
