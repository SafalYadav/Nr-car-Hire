import type {
  VehicleCreateInput,
  VehicleUpdateInput,
  VehicleQueryParams,
  VehicleStatus,
} from '@/lib/validation/vehicle';

export interface VehicleRecord extends VehicleCreateInput {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  notes?: string;
  createdAt: Date;
}

export interface ActiveBookingRecord {
  id: string;
  vehicleId: string;
  pickupDate: Date;
  dropoffDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

// ----------------------------------------------------
// Initial Production Vehicle Seed Data
// ----------------------------------------------------
const initialSeedVehicles: VehicleRecord[] = [
  {
    id: 'v-001-camry',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    category: 'Sedan',
    description:
      'The definitive Australian executive and family sedan. Exceptional fuel economy, smooth ride, and advanced safety assistance.',
    seats: 5,
    doors: 4,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    luggage: 3,
    dailyRate: 89,
    location: 'Sydney',
    status: 'AVAILABLE',
    isActive: true,
    imageUrl: '/images/vehicles/toyota-camry.jpg',
    gallery: ['/images/vehicles/toyota-camry.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 3,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'v-002-cx5',
    make: 'Mazda',
    model: 'CX-5',
    year: 2024,
    category: 'SUV',
    description:
      'A refined mid-size SUV offering premium Japanese craftsmanship, elevated seating, and versatile cargo capacity for family trips.',
    seats: 5,
    doors: 5,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    luggage: 4,
    dailyRate: 109,
    location: 'Melbourne',
    status: 'AVAILABLE',
    isActive: true,
    imageUrl: '/images/vehicles/mazda-cx5.jpg',
    gallery: ['/images/vehicles/mazda-cx5.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 4,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'v-003-3series',
    make: 'BMW',
    model: '3 Series',
    year: 2024,
    category: 'Premium',
    description:
      'The benchmark in sports luxury sedans. Dynamic handling, bespoke leather interior, and cutting-edge digital cockpit technology.',
    seats: 5,
    doors: 4,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    luggage: 3,
    dailyRate: 179,
    location: 'Sydney',
    status: 'AVAILABLE',
    isActive: true,
    imageUrl: '/images/vehicles/bmw-3series.jpg',
    gallery: ['/images/vehicles/bmw-3series.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 3,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'v-004-hilux',
    make: 'Toyota',
    model: 'HiLux',
    year: 2024,
    category: 'Utility',
    description:
      'Australia’s most dependable dual-cab ute. Rugged 4x4 capability, strong towing performance, and heavy-duty utility for regional adventures.',
    seats: 5,
    doors: 4,
    transmission: 'Manual',
    fuelType: 'Diesel',
    luggage: 2,
    dailyRate: 129,
    location: 'Brisbane',
    status: 'AVAILABLE',
    isActive: true,
    imageUrl: '/images/vehicles/toyota-hilux.jpg',
    gallery: ['/images/vehicles/toyota-hilux.jpg'],
    features: {
      seats: 5,
      transmission: 'Manual',
      fuelType: 'Diesel',
      luggage: 2,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'v-005-cclass',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2024,
    category: 'Luxury',
    description:
      'Prestige and supreme comfort. Engineered for effortless long-distance touring with executive styling and whisper-quiet cabin acoustics.',
    seats: 5,
    doors: 4,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    luggage: 3,
    dailyRate: 199,
    location: 'Perth',
    status: 'AVAILABLE',
    isActive: true,
    imageUrl: '/images/vehicles/mercedes-cclass.jpg',
    gallery: ['/images/vehicles/mercedes-cclass.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 3,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'v-006-tucson',
    make: 'Hyundai',
    model: 'Tucson',
    year: 2024,
    category: 'SUV',
    description:
      'Modern hybrid crossover SUV with high fuel efficiency, spacious 5-passenger cabin, and comprehensive active safety suite.',
    seats: 5,
    doors: 5,
    transmission: 'Automatic',
    fuelType: 'Hybrid',
    luggage: 4,
    dailyRate: 99,
    location: 'Gold Coast',
    status: 'AVAILABLE',
    isActive: true,
    imageUrl: '/images/vehicles/hyundai-tucson.jpg',
    gallery: ['/images/vehicles/hyundai-tucson.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Hybrid',
      luggage: 4,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
];

const initialSeedMaintenances: MaintenanceRecord[] = [
  {
    id: 'm-seed-001-hilux',
    vehicleId: 'v-004-hilux',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-09-05T23:59:59.999Z'),
    reason: 'Scheduled maintenance: transmission rebuild and mechanical inspection',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'm-seed-002-tucson',
    vehicleId: 'v-006-tucson',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2026-09-05T23:59:59.999Z'),
    reason: 'Scheduled maintenance: 50,000km hybrid battery and brake system overhaul',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
];

// Persistent runtime vehicle store
class VehicleStore {
  private vehicles: Map<string, VehicleRecord> = new Map();
  private maintenances: MaintenanceRecord[] = [];
  private activeBookings: ActiveBookingRecord[] = [];

  constructor() {
    this.reset();
  }

  public reset() {
    this.vehicles.clear();
    this.maintenances = initialSeedMaintenances.map((m) => ({ ...m }));
    this.activeBookings = [];
    initialSeedVehicles.forEach((v) => {
      this.vehicles.set(v.id, { ...v });
    });
  }

  // ----------------------------------------------------
  // Vehicle CRUD
  // ----------------------------------------------------
  public async create(data: VehicleCreateInput): Promise<VehicleRecord> {
    const id = `v-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const newVehicle: VehicleRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }

  public async findById(id: string): Promise<VehicleRecord | null> {
    const vehicle = this.vehicles.get(id);
    return vehicle ? { ...vehicle } : null;
  }

  public async update(id: string, data: VehicleUpdateInput): Promise<VehicleRecord | null> {
    const existing = this.vehicles.get(id);
    if (!existing) return null;

    const updated: VehicleRecord = {
      ...existing,
      ...data,
      features: data.features ? { ...existing.features, ...data.features } : existing.features,
      updatedAt: new Date(),
    };
    this.vehicles.set(id, updated);
    return updated;
  }

  public async setStatus(
    id: string,
    status: VehicleStatus,
    isActive?: boolean,
  ): Promise<VehicleRecord | null> {
    const existing = this.vehicles.get(id);
    if (!existing) return null;

    const updated: VehicleRecord = {
      ...existing,
      status,
      isActive: isActive !== undefined ? isActive : existing.isActive,
      updatedAt: new Date(),
    };
    this.vehicles.set(id, updated);
    return updated;
  }

  public async list(params: Partial<VehicleQueryParams> = {}): Promise<{
    vehicles: VehicleRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let result = Array.from(this.vehicles.values());

    // Filter by active status unless specifically requested by admin
    if (!params?.includeInactive) {
      result = result.filter((v) => v.isActive && v.status !== 'INACTIVE');
    }

    // Status filter
    if (params.status) {
      result = result.filter((v) => v.status === params.status);
    }

    // Search filter (make, model, category, location)
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      result = result.filter((v) => {
        const text = `${v.make} ${v.model} ${v.category} ${v.location}`.toLowerCase();
        return text.includes(q);
      });
    }

    // Category filter
    if (params.category && params.category !== 'All') {
      result = result.filter((v) => v.category === params.category);
    }

    // Price range filters
    if (params.minPrice !== undefined) {
      result = result.filter((v) => v.dailyRate >= params.minPrice!);
    }
    if (params.maxPrice !== undefined) {
      result = result.filter((v) => v.dailyRate <= params.maxPrice!);
    }

    // Seats filter
    if (params.seats !== undefined) {
      result = result.filter((v) => v.seats >= params.seats!);
    }

    // Transmission filter
    if (params.transmission && params.transmission !== 'All') {
      result = result.filter((v) => v.transmission === params.transmission);
    }

    // Fuel Type filter
    if (params.fuelType && params.fuelType !== 'All') {
      result = result.filter((v) => v.fuelType === params.fuelType);
    }

    // Location filter
    if (params.location && params.location.trim()) {
      const loc = params.location.toLowerCase().trim();
      result = result.filter((v) => v.location.toLowerCase().includes(loc));
    }

    // Sorting
    switch (params.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.dailyRate - b.dailyRate);
        break;
      case 'price-desc':
        result.sort((a, b) => b.dailyRate - a.dailyRate);
        break;
      case 'name-asc':
        result.sort((a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`));
        break;
    }

    const total = result.length;
    const page = params.page || 1;
    const limit = params.limit || 20;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      vehicles: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ----------------------------------------------------
  // Maintenance & Blocked Periods
  // ----------------------------------------------------
  public async addMaintenanceBlock(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    reason: string,
    notes?: string,
  ): Promise<MaintenanceRecord> {
    const record: MaintenanceRecord = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vehicleId,
      startDate,
      endDate,
      reason,
      notes,
      createdAt: new Date(),
    };
    this.maintenances.push(record);
    return record;
  }

  public async getVehicleMaintenances(vehicleId: string): Promise<MaintenanceRecord[]> {
    return this.maintenances.filter((m) => m.vehicleId === vehicleId);
  }

  public async removeMaintenanceBlock(id: string): Promise<boolean> {
    const initialLen = this.maintenances.length;
    this.maintenances = this.maintenances.filter((m) => m.id !== id);
    return this.maintenances.length < initialLen;
  }

  public async clearVehicleMaintenances(vehicleId: string): Promise<void> {
    this.maintenances = this.maintenances.filter((m) => m.vehicleId !== vehicleId);
  }

  // ----------------------------------------------------
  // Active Bookings (For Overlap & Concurrency Check)
  // ----------------------------------------------------
  public async addBooking(booking: ActiveBookingRecord): Promise<void> {
    this.activeBookings.push(booking);
  }

  public async getVehicleBookings(vehicleId: string): Promise<ActiveBookingRecord[]> {
    return this.activeBookings.filter(
      (b) => b.vehicleId === vehicleId && (b.status === 'CONFIRMED' || b.status === 'PENDING'),
    );
  }

  public async clearVehicleBookings(vehicleId: string): Promise<void> {
    this.activeBookings = this.activeBookings.filter((b) => b.vehicleId !== vehicleId);
  }
}

const globalForVehicle = globalThis as unknown as {
  __nr_vehicleStore: VehicleStore | undefined;
};

export const vehicleStore =
  globalForVehicle.__nr_vehicleStore ?? (globalForVehicle.__nr_vehicleStore = new VehicleStore());
