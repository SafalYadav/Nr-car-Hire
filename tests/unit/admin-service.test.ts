import { describe, it, expect, beforeEach } from 'vitest';
import { adminService } from '@/lib/services/admin-service';
import { bookingStore } from '@/lib/db/booking-store';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { paymentStore } from '@/lib/db/payment-store';
import { auditStore } from '@/lib/db/audit-store';
import { inventoryService } from '@/lib/services/inventory-service';

describe('AdminService & Command Centre Backend', () => {
  beforeEach(() => {
    bookingStore.reset();
    vehicleStore.reset();
    paymentStore.reset();
    auditStore.reset();
  });

  it('aggregates executive dashboard metrics from real booking and vehicle data', async () => {
    const metrics = await adminService.getDashboardMetrics();

    expect(metrics.totalBookings).toBeGreaterThan(0);
    expect(metrics.totalRevenue).toBeGreaterThan(0);
    expect(metrics.availableVehicles).toBeGreaterThan(0);
    expect(metrics.bookingStatusDistribution).toBeDefined();
  });

  it('immediately updates vehicle daily rate and reflects across vehicle store', async () => {
    const vehicleId = 'v-001-camry';
    const original = await vehicleStore.findById(vehicleId);
    expect(original?.dailyRate).toBe(89);

    // Update rate to ₹95
    const updated = await vehicleStore.update(vehicleId, { dailyRate: 95 });
    expect(updated?.dailyRate).toBe(95);

    // Read back to verify database source of truth
    const readBack = await vehicleStore.findById(vehicleId);
    expect(readBack?.dailyRate).toBe(95);
  });

  it('adds maintenance block and makes vehicle unavailable during hold dates', async () => {
    const vehicleId = 'v-001-camry';
    const sDate = new Date('2026-12-01T00:00:00Z');
    const eDate = new Date('2026-12-05T00:00:00Z');

    // Initially available
    const before = await inventoryService.checkAvailability(vehicleId, sDate, eDate);
    expect(before.isAvailable).toBe(true);

    // Add maintenance block
    await inventoryService.addMaintenanceBlock(
      {
        vehicleId,
        startDate: sDate,
        endDate: eDate,
        reason: 'MAINTENANCE',
        notes: 'Brake overhaul',
      },
      'ADMIN',
    );

    // Check availability again -> must be blocked
    const after = await inventoryService.checkAvailability(vehicleId, sDate, eDate);
    expect(after.isAvailable).toBe(false);
    expect(after.reason).toContain('block');
  });

  it('records immutable audit logs for administrative security actions', async () => {
    await auditStore.create({
      adminId: 'admin-001',
      action: 'VEHICLE_UPDATED',
      entity: 'Vehicle',
      entityId: 'v-001-camry',
      details: { newDailyRate: 95 },
    });

    const logs = await auditStore.list(10);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe('VEHICLE_UPDATED');
    expect(logs[0].entityId).toBe('v-001-camry');
  });
});
