import type { ExtraCreateInput, ExtraUpdateInput } from '@/lib/validation/extra';

export interface ExtraRecord extends ExtraCreateInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const initialExtras: ExtraRecord[] = [
  {
    id: 'ext-zero-excess',
    code: 'ZERO_EXCESS',
    name: 'Zero Excess Premium Protection',
    description: 'Comprehensive damage waiver reducing accidental liability to $0',
    pricingType: 'PER_DAY',
    price: 25,
    icon: 'ShieldCheck',
    isActive: true,
    maxQuantity: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'ext-add-driver',
    code: 'ADD_DRIVER',
    name: 'Additional Authorised Driver',
    description: 'Allow a second eligible licensed driver to operate the vehicle',
    pricingType: 'FLAT',
    price: 15,
    icon: 'UserPlus',
    isActive: true,
    maxQuantity: 2,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'ext-child-seat',
    code: 'CHILD_SEAT',
    name: 'Child Safety Baby / Booster Seat',
    description:
      'Australian standard AS/NZS 1754 approved rear or forward facing child safety seat',
    pricingType: 'PER_DAY',
    price: 12,
    icon: 'Baby',
    isActive: true,
    maxQuantity: 2,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'ext-gps',
    code: 'GPS_NAV',
    name: 'GPS Satellite Navigation Unit',
    description: 'Dedicated GPS with live traffic re-routing and speed camera alerts',
    pricingType: 'PER_DAY',
    price: 10,
    icon: 'Compass',
    isActive: true,
    maxQuantity: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'ext-roadside-plus',
    code: 'ROADSIDE_PLUS',
    name: '24/7 Roadside Assistance Plus',
    description:
      'Covers key loss, flat tyre replacement, jump-starts and emergency towing anywhere in Australia',
    pricingType: 'PER_DAY',
    price: 8,
    icon: 'Wrench',
    isActive: true,
    maxQuantity: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
];

class ExtraStore {
  private extras: Map<string, ExtraRecord> = new Map();

  constructor() {
    this.reset();
  }

  public reset() {
    this.extras.clear();
    initialExtras.forEach((e) => {
      this.extras.set(e.id, { ...e });
    });
  }

  public async list(onlyActive = true): Promise<ExtraRecord[]> {
    const list = Array.from(this.extras.values());
    return onlyActive ? list.filter((e) => e.isActive) : list;
  }

  public async findById(id: string): Promise<ExtraRecord | null> {
    const extra = this.extras.get(id);
    return extra ? { ...extra } : null;
  }

  public async findByCode(code: string): Promise<ExtraRecord | null> {
    for (const e of this.extras.values()) {
      if (e.code === code) return { ...e };
    }
    return null;
  }

  public async create(data: ExtraCreateInput): Promise<ExtraRecord> {
    const id = `ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const newRecord: ExtraRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.extras.set(id, newRecord);
    return { ...newRecord };
  }

  public async update(id: string, data: ExtraUpdateInput): Promise<ExtraRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ExtraRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.extras.set(id, updated);
    return { ...updated };
  }

  public async toggleStatus(id: string, isActive: boolean): Promise<ExtraRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: ExtraRecord = {
      ...existing,
      isActive,
      updatedAt: new Date(),
    };
    this.extras.set(id, updated);
    return { ...updated };
  }
}

const globalForExtra = globalThis as unknown as {
  __nr_extraStore: ExtraStore | undefined;
};

export const extraStore =
  globalForExtra.__nr_extraStore ?? (globalForExtra.__nr_extraStore = new ExtraStore());
