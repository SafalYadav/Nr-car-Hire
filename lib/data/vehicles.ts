import {
  vehicleCategories as schemaCategories,
  vehicleTransmissions as schemaTransmissions,
  type VehicleCategory,
  type VehicleCategoryFilter,
  type VehicleStatus,
  type VehicleTransmission,
  type VehicleFuelType,
} from '@/lib/validation/vehicle';
import { vehicleStore, type VehicleRecord } from '@/lib/db/vehicle-store';

export type {
  VehicleCategory,
  VehicleCategoryFilter,
  VehicleStatus,
  VehicleTransmission,
  VehicleFuelType,
};

export interface VehicleFeatures {
  seats?: number;
  transmission?: 'Automatic' | 'Manual';
  fuelType?: string;
  luggage?: number;
  airConditioning?: boolean;
  bluetooth?: boolean;
  navigation?: boolean;
  cruiseControl?: boolean;
  reverseCamera?: boolean;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  dailyRate: number;
  availability: VehicleStatus;
  location: string;
  imageUrl: string | null;
  gallery?: string[] | null;
  features: VehicleFeatures | null;
  description?: string | null;
  isActive?: boolean;
}

/**
 * Safely extracts VehicleFeatures from the JSON features field.
 */
export function getVehicleFeatures(
  features: Record<string, unknown> | VehicleFeatures | null | undefined,
): VehicleFeatures | null {
  if (!features || typeof features !== 'object' || Object.keys(features).length === 0) {
    return null;
  }
  const f = features as Record<string, unknown>;

  if (
    typeof f.seats !== 'number' ||
    typeof f.transmission !== 'string' ||
    typeof f.fuelType !== 'string' ||
    typeof f.luggage !== 'number'
  ) {
    return null;
  }

  const result: VehicleFeatures = {
    seats: f.seats,
    transmission:
      f.transmission === 'Manual' || f.transmission === 'Automatic'
        ? (f.transmission as 'Automatic' | 'Manual')
        : 'Automatic',
    fuelType: f.fuelType,
    luggage: f.luggage,
  };

  if (typeof f.airConditioning === 'boolean') result.airConditioning = f.airConditioning;
  if (typeof f.bluetooth === 'boolean') result.bluetooth = f.bluetooth;
  if (typeof f.navigation === 'boolean') result.navigation = f.navigation;
  if (typeof f.cruiseControl === 'boolean') result.cruiseControl = f.cruiseControl;
  if (typeof f.reverseCamera === 'boolean') result.reverseCamera = f.reverseCamera;

  return result;
}

export const vehicleCategories = ['All', ...schemaCategories] as const;
export const vehicleTransmissions = ['All', ...schemaTransmissions] as const;

/**
 * Single source of truth: vehicles drawn directly from the database store.
 */
function toVehicle(record: VehicleRecord): Vehicle {
  return {
    id: record.id,
    make: record.make,
    model: record.model,
    year: record.year,
    category: record.category,
    dailyRate: record.dailyRate,
    availability: record.status,
    location: record.location,
    imageUrl: record.imageUrl || null,
    gallery: record.gallery || null,
    features: getVehicleFeatures(record.features),
    description: record.description || null,
    isActive: record.isActive,
  };
}

export async function fetchAllVehicles(): Promise<Vehicle[]> {
  const result = await vehicleStore.list({
    page: 1,
    limit: 100,
    includeInactive: false,
    sortBy: 'price-asc',
  });
  return result.vehicles.map(toVehicle);
}

export async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  const record = await vehicleStore.findById(id);
  return record ? toVehicle(record) : null;
}

// Initial featured vehicles
export const featuredVehicles: Vehicle[] = [
  {
    id: 'v-001-camry',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    category: 'Sedan',
    dailyRate: 89,
    availability: 'AVAILABLE',
    location: 'Sydney',
    imageUrl: '/images/vehicles/toyota-camry.jpg',
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
  },
  {
    id: 'v-002-cx5',
    make: 'Mazda',
    model: 'CX-5',
    year: 2024,
    category: 'SUV',
    dailyRate: 109,
    availability: 'AVAILABLE',
    location: 'Melbourne',
    imageUrl: '/images/vehicles/mazda-cx5.jpg',
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
  },
  {
    id: 'v-003-3series',
    make: 'BMW',
    model: '3 Series',
    year: 2024,
    category: 'Premium',
    dailyRate: 179,
    availability: 'AVAILABLE',
    location: 'Sydney',
    imageUrl: '/images/vehicles/bmw-3series.jpg',
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
  },
  {
    id: 'v-004-hilux',
    make: 'Toyota',
    model: 'HiLux',
    year: 2024,
    category: 'Utility',
    dailyRate: 129,
    availability: 'AVAILABLE',
    location: 'Brisbane',
    imageUrl: '/images/vehicles/toyota-hilux.jpg',
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Diesel',
      luggage: 2,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
  },
  {
    id: 'v-005-cclass',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2024,
    category: 'Luxury',
    dailyRate: 199,
    availability: 'AVAILABLE',
    location: 'Perth',
    imageUrl: '/images/vehicles/mercedes-cclass.jpg',
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
  },
  {
    id: 'v-006-tucson',
    make: 'Hyundai',
    model: 'Tucson',
    year: 2024,
    category: 'SUV',
    dailyRate: 99,
    availability: 'AVAILABLE',
    location: 'Gold Coast',
    imageUrl: '/images/vehicles/hyundai-tucson.jpg',
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
  },
];

export const allVehicles: Vehicle[] = featuredVehicles;

export function getVehicleById(id: string): Vehicle | undefined {
  return allVehicles.find((v) => v.id === id);
}
