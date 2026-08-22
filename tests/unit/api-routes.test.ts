import { describe, it, expect, beforeEach } from 'vitest';
import { GET as listVehicles, POST as createVehicle } from '@/app/api/vehicles/route';
import {
  GET as getVehicle,
  PATCH as updateVehicle,
  DELETE as deactivateVehicle,
} from '@/app/api/vehicles/[vehicleId]/route';
import { GET as checkAvailability } from '@/app/api/vehicles/[vehicleId]/availability/route';
import { vehicleStore, type VehicleRecord } from '@/lib/db/vehicle-store';

describe('Vehicle API Endpoints', () => {
  beforeEach(() => {
    vehicleStore.reset();
  });

  describe('GET /api/vehicles', () => {
    it('returns a list of active vehicles', async () => {
      const req = new Request('http://localhost:3000/api/vehicles');
      const res = await listVehicles(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.vehicles.length).toBeGreaterThan(0);
      expect(json.data.total).toBe(6);
    });

    it('filters vehicles by category and transmission', async () => {
      const req = new Request(
        'http://localhost:3000/api/vehicles?category=SUV&transmission=Automatic',
      );
      const res = await listVehicles(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      json.data.vehicles.forEach((v: VehicleRecord) => {
        expect(v.category).toBe('SUV');
        expect(v.transmission).toBe('Automatic');
      });
    });
  });

  describe('POST /api/vehicles (Admin creation)', () => {
    it('allows authenticated admin to create a vehicle', async () => {
      const payload = {
        make: 'Tesla',
        model: 'Model 3',
        year: 2024,
        category: 'Premium',
        dailyRate: 155,
        location: 'Melbourne',
        transmission: 'Automatic',
        fuelType: 'Electric',
        seats: 5,
        doors: 4,
        luggage: 3,
        status: 'AVAILABLE',
      };

      const req = new Request('http://localhost:3000/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify(payload),
      });

      const res = await createVehicle(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.make).toBe('Tesla');
    });

    it('rejects unauthenticated or customer attempts with 401/403', async () => {
      const payload = {
        make: 'Tesla',
        model: 'Model 3',
        year: 2024,
        category: 'Premium',
        dailyRate: 155,
        location: 'Melbourne',
      };

      const req = new Request('http://localhost:3000/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await createVehicle(req);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/vehicles/[vehicleId]', () => {
    it('returns single vehicle details', async () => {
      const req = new Request('http://localhost:3000/api/vehicles/v-001-camry');
      const res = await getVehicle(req, {
        params: Promise.resolve({ vehicleId: 'v-001-camry' }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.make).toBe('Toyota');
      expect(json.data.model).toBe('Camry');
    });

    it('returns 404 for unknown vehicle ID', async () => {
      const req = new Request('http://localhost:3000/api/vehicles/non-existent');
      const res = await getVehicle(req, {
        params: Promise.resolve({ vehicleId: 'non-existent' }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/vehicles/[vehicleId]', () => {
    it('allows admin to update vehicle data', async () => {
      const req = new Request('http://localhost:3000/api/vehicles/v-001-camry', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify({ dailyRate: 92 }),
      });
      const res = await updateVehicle(req, {
        params: Promise.resolve({ vehicleId: 'v-001-camry' }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.dailyRate).toBe(92);
    });
  });

  describe('DELETE /api/vehicles/[vehicleId]', () => {
    it('allows admin to deactivate a vehicle', async () => {
      const req = new Request('http://localhost:3000/api/vehicles/v-001-camry', {
        method: 'DELETE',
        headers: {
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
      });
      const res = await deactivateVehicle(req, {
        params: Promise.resolve({ vehicleId: 'v-001-camry' }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isActive).toBe(false);
      expect(json.data.status).toBe('INACTIVE');
    });
  });

  describe('GET /api/vehicles/[vehicleId]/availability', () => {
    it('evaluates date range availability successfully', async () => {
      const req = new Request(
        'http://localhost:3000/api/vehicles/v-001-camry/availability?pickupDate=2026-10-01&dropoffDate=2026-10-05',
      );
      const res = await checkAvailability(req, {
        params: Promise.resolve({ vehicleId: 'v-001-camry' }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.isAvailable).toBe(true);
      expect(json.data.totalDays).toBe(4);
      expect(json.data.estimatedTotal).toBe(4 * 89);
    });

    it('returns 400 when dates are missing or invalid', async () => {
      const req = new Request(
        'http://localhost:3000/api/vehicles/v-001-camry/availability?pickupDate=invalid',
      );
      const res = await checkAvailability(req, {
        params: Promise.resolve({ vehicleId: 'v-001-camry' }),
      });

      expect(res.status).toBe(400);
    });
  });
});
