import { describe, it, expect, beforeEach } from 'vitest';
import { inventoryService } from '@/lib/services/inventory-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { NotFoundError, AuthorizationError } from '@/lib/utils/errors';

describe('InventoryService & Vehicle Store (CRUD, Search, Filters, Sorting)', () => {
  beforeEach(() => {
    vehicleStore.reset();
  });

  // ----------------------------------------------------
  // 1. CRUD Operations
  // ----------------------------------------------------
  describe('CRUD Operations', () => {
    it('allows an admin to create a valid vehicle', async () => {
      const newVehicle = await inventoryService.createVehicle(
        {
          make: 'Audi',
          model: 'A4',
          year: 2024,
          category: 'Premium',
          seats: 5,
          doors: 4,
          transmission: 'Automatic',
          fuelType: 'Petrol',
          luggage: 3,
          dailyRate: 165,
          location: 'Sydney',
          status: 'AVAILABLE',
          isActive: true,
          imageUrl: '/images/vehicles/audi-a4.jpg',
        },
        'ADMIN',
      );

      expect(newVehicle).toBeDefined();
      expect(newVehicle.id).toBeTruthy();
      expect(newVehicle.make).toBe('Audi');
      expect(newVehicle.model).toBe('A4');
      expect(newVehicle.dailyRate).toBe(165);

      const found = await inventoryService.getVehicleById(newVehicle.id);
      expect(found.id).toBe(newVehicle.id);
    });

    it('rejects vehicle creation by non-admin users', async () => {
      await expect(
        inventoryService.createVehicle(
          {
            make: 'Audi',
            model: 'A4',
            year: 2024,
            category: 'Premium',
            dailyRate: 165,
            location: 'Sydney',
          },
          'CUSTOMER',
        ),
      ).rejects.toThrow(AuthorizationError);
    });

    it('rejects vehicle creation with invalid fields', async () => {
      await expect(
        inventoryService.createVehicle(
          {
            make: '',
            model: 'A4',
            year: 1990, // below min 2015
            category: 'InvalidCategory',
            dailyRate: -50,
            location: 'Sydney',
          },
          'ADMIN',
        ),
      ).rejects.toThrow();
    });

    it('retrieves an existing vehicle by ID', async () => {
      const camry = await inventoryService.getVehicleById('v-001-camry');
      expect(camry).toBeDefined();
      expect(camry.make).toBe('Toyota');
      expect(camry.model).toBe('Camry');
    });

    it('throws NotFoundError for non-existent vehicle ID', async () => {
      await expect(inventoryService.getVehicleById('unknown-id')).rejects.toThrow(NotFoundError);
    });

    it('allows admin to update vehicle specifications and daily rate', async () => {
      const updated = await inventoryService.updateVehicle(
        'v-001-camry',
        {
          dailyRate: 95,
          location: 'Brisbane',
        },
        'ADMIN',
      );

      expect(updated.dailyRate).toBe(95);
      expect(updated.location).toBe('Brisbane');

      const reFetched = await inventoryService.getVehicleById('v-001-camry');
      expect(reFetched.dailyRate).toBe(95);
      expect(reFetched.location).toBe('Brisbane');
    });

    it('soft deactivates and reactivates a vehicle', async () => {
      // Soft deactivate
      const deactivated = await inventoryService.deactivateVehicle('v-001-camry', 'ADMIN');
      expect(deactivated.isActive).toBe(false);
      expect(deactivated.status).toBe('INACTIVE');

      // Customer should not find inactive vehicle
      await expect(inventoryService.getVehicleById('v-001-camry', false)).rejects.toThrow(
        NotFoundError,
      );

      // Admin with includeInactive should find it
      const foundByAdmin = await inventoryService.getVehicleById('v-001-camry', true);
      expect(foundByAdmin.isActive).toBe(false);

      // Reactivate
      const reactivated = await inventoryService.reactivateVehicle('v-001-camry', 'ADMIN');
      expect(reactivated.isActive).toBe(true);
      expect(reactivated.status).toBe('AVAILABLE');
    });
  });

  // ----------------------------------------------------
  // 2. Search Capabilities
  // ----------------------------------------------------
  describe('Search Engine', () => {
    it('searches by make (case-insensitive)', async () => {
      const results = await inventoryService.listVehicles({ search: 'toyota' });
      expect(results.vehicles.length).toBeGreaterThanOrEqual(2); // Camry and HiLux
      results.vehicles.forEach((v) => expect(v.make).toBe('Toyota'));
    });

    it('searches by model', async () => {
      const results = await inventoryService.listVehicles({ search: 'CX-5' });
      expect(results.vehicles).toHaveLength(1);
      expect(results.vehicles[0].model).toBe('CX-5');
    });

    it('returns empty array when search matches nothing', async () => {
      const results = await inventoryService.listVehicles({ search: 'Lamborghini Aventador' });
      expect(results.vehicles).toHaveLength(0);
      expect(results.total).toBe(0);
    });
  });

  // ----------------------------------------------------
  // 3. Filtering Engine
  // ----------------------------------------------------
  describe('Filtering Engine', () => {
    it('filters by category', async () => {
      const results = await inventoryService.listVehicles({ category: 'SUV' });
      expect(results.vehicles.length).toBeGreaterThanOrEqual(2);
      results.vehicles.forEach((v) => expect(v.category).toBe('SUV'));
    });

    it('filters by price range', async () => {
      const results = await inventoryService.listVehicles({ minPrice: 90, maxPrice: 120 });
      results.vehicles.forEach((v) => {
        expect(v.dailyRate).toBeGreaterThanOrEqual(90);
        expect(v.dailyRate).toBeLessThanOrEqual(120);
      });
    });

    it('filters by transmission and fuel type', async () => {
      const results = await inventoryService.listVehicles({
        transmission: 'Manual',
        fuelType: 'Diesel',
      });
      expect(results.vehicles).toHaveLength(1);
      expect(results.vehicles[0].model).toBe('HiLux');
      expect(results.vehicles[0].fuelType).toBe('Diesel');
    });

    it('filters by location', async () => {
      const results = await inventoryService.listVehicles({ location: 'Sydney' });
      expect(results.vehicles.length).toBeGreaterThanOrEqual(2);
      results.vehicles.forEach((v) => expect(v.location).toBe('Sydney'));
    });

    it('handles combined multi-filters (Category + Transmission + Max Price)', async () => {
      const results = await inventoryService.listVehicles({
        category: 'SUV',
        transmission: 'Automatic',
        maxPrice: 105,
      });
      expect(results.vehicles).toHaveLength(1);
      expect(results.vehicles[0].model).toBe('Tucson');
      expect(results.vehicles[0].dailyRate).toBe(99);
    });
  });

  // ----------------------------------------------------
  // 4. Sorting Engine
  // ----------------------------------------------------
  describe('Sorting Engine', () => {
    it('sorts by price ascending (price-asc)', async () => {
      const results = await inventoryService.listVehicles({ sortBy: 'price-asc' });
      for (let i = 0; i < results.vehicles.length - 1; i++) {
        expect(results.vehicles[i].dailyRate).toBeLessThanOrEqual(
          results.vehicles[i + 1].dailyRate,
        );
      }
    });

    it('sorts by price descending (price-desc)', async () => {
      const results = await inventoryService.listVehicles({ sortBy: 'price-desc' });
      for (let i = 0; i < results.vehicles.length - 1; i++) {
        expect(results.vehicles[i].dailyRate).toBeGreaterThanOrEqual(
          results.vehicles[i + 1].dailyRate,
        );
      }
    });

    it('sorts by name alphabetical (name-asc)', async () => {
      const results = await inventoryService.listVehicles({ sortBy: 'name-asc' });
      const names = results.vehicles.map((v) => `${v.make} ${v.model}`);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sorted);
    });
  });
});
