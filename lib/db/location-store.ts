export interface LocationRecord {
  id: string;
  code: string;
  name: string;
  airportOrCity: string;
  address: string;
  state: string;
  pickupAvailable: boolean;
  dropoffAvailable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const initialLocations: LocationRecord[] = [
  {
    id: 'loc-syd-airport',
    code: 'SYD_APT',
    name: 'Sydney Airport Hub (SYD)',
    airportOrCity: 'Sydney Airport',
    address: 'Terminal 1 Arrivals & Car Rental Centre, Mascot NSW 2020',
    state: 'NSW',
    pickupAvailable: true,
    dropoffAvailable: true,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'loc-syd-cbd',
    code: 'SYD_CBD',
    name: 'Sydney CBD — Central Station',
    airportOrCity: 'Sydney CBD',
    address: '200 Elizabeth Street, Surry Hills NSW 2010',
    state: 'NSW',
    pickupAvailable: true,
    dropoffAvailable: true,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'loc-mel-airport',
    code: 'MEL_APT',
    name: 'Melbourne Tullamarine Airport (MEL)',
    airportOrCity: 'Melbourne Airport',
    address: 'Terminal Drive, Melbourne Airport VIC 3045',
    state: 'VIC',
    pickupAvailable: true,
    dropoffAvailable: true,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'loc-bne-airport',
    code: 'BNE_APT',
    name: 'Brisbane Airport (BNE)',
    airportOrCity: 'Brisbane Airport',
    address: 'Airport Drive, Brisbane Airport QLD 4008',
    state: 'QLD',
    pickupAvailable: true,
    dropoffAvailable: true,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'loc-per-airport',
    code: 'PER_APT',
    name: 'Perth International Airport (PER)',
    airportOrCity: 'Perth Airport',
    address: 'Airport Way, Redcliffe WA 6105',
    state: 'WA',
    pickupAvailable: true,
    dropoffAvailable: true,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'loc-ool-airport',
    code: 'OOL_APT',
    name: 'Gold Coast Airport (OOL)',
    airportOrCity: 'Coolangatta Airport',
    address: 'Eastern Avenue, Bilinga QLD 4225',
    state: 'QLD',
    pickupAvailable: true,
    dropoffAvailable: true,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
];

class LocationStore {
  private locations: Map<string, LocationRecord> = new Map();

  constructor() {
    this.reset();
  }

  public reset() {
    this.locations.clear();
    initialLocations.forEach((l) => {
      this.locations.set(l.id, { ...l });
    });
  }

  public async list(onlyActive = true): Promise<LocationRecord[]> {
    const list = Array.from(this.locations.values());
    return onlyActive ? list.filter((l) => l.isActive) : list;
  }

  public async findById(id: string): Promise<LocationRecord | null> {
    const loc = this.locations.get(id);
    return loc ? { ...loc } : null;
  }

  public async findByName(name: string): Promise<LocationRecord | null> {
    for (const l of this.locations.values()) {
      if (
        l.name.toLowerCase() === name.toLowerCase() ||
        l.airportOrCity.toLowerCase() === name.toLowerCase()
      ) {
        return { ...l };
      }
    }
    return null;
  }

  public async create(
    data: Omit<LocationRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LocationRecord> {
    const id = `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const newRecord: LocationRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.locations.set(id, newRecord);
    return { ...newRecord };
  }

  public async update(id: string, data: Partial<LocationRecord>): Promise<LocationRecord | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: LocationRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.locations.set(id, updated);
    return { ...updated };
  }
}

const globalForLocation = globalThis as unknown as {
  __nr_locationStore: LocationStore | undefined;
};

export const locationStore =
  globalForLocation.__nr_locationStore ??
  (globalForLocation.__nr_locationStore = new LocationStore());
