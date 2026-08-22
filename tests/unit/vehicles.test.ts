import { describe, it, expect } from 'vitest';
import {
  getVehicleFeatures,
  getVehicleById,
  allVehicles,
  vehicleCategories,
  vehicleTransmissions,
} from '@/lib/data/vehicles';

describe('Vehicles Data Layer', () => {
  it('extracts valid vehicle features correctly', () => {
    const rawFeatures = {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 3,
    };
    const features = getVehicleFeatures(rawFeatures);
    expect(features).toEqual({
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 3,
    });
  });

  it('returns null for invalid or missing features', () => {
    expect(getVehicleFeatures(null)).toBeNull();
    expect(getVehicleFeatures({})).toBeNull();
    expect(getVehicleFeatures({ seats: 'five' })).toBeNull();
  });

  it('finds vehicles by ID', () => {
    const camry = getVehicleById('v-001-camry');
    expect(camry).toBeDefined();
    expect(camry?.make).toBe('Toyota');
    expect(camry?.model).toBe('Camry');
  });

  it('returns undefined for non-existent vehicle ID', () => {
    expect(getVehicleById('non-existent-id')).toBeUndefined();
  });

  it('contains valid categories and transmissions', () => {
    expect(vehicleCategories).toContain('All');
    expect(vehicleCategories).toContain('Sedan');
    expect(vehicleCategories).toContain('SUV');
    expect(vehicleTransmissions).toContain('Automatic');
  });

  it('has valid daily rates for all vehicles', () => {
    allVehicles.forEach((vehicle) => {
      expect(vehicle.dailyRate).toBeGreaterThan(0);
      expect(vehicle.make).toBeTruthy();
      expect(vehicle.model).toBeTruthy();
      expect(vehicle.imageUrl).toBeTruthy();
    });
  });
});
