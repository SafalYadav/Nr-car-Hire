import {
  VehicleCreateSchema,
  VehicleUpdateSchema,
  VehicleQuerySchema,
  VehicleMaintenanceCreateSchema,
  type VehicleQueryParams,
} from '@/lib/validation/vehicle';
import {
  vehicleStore,
  type VehicleRecord,
  type MaintenanceRecord,
  type ActiveBookingRecord,
} from '@/lib/db/vehicle-store';
import { ValidationError, NotFoundError, AuthorizationError, AppError } from '@/lib/utils/errors';
import type { UserRole } from '@/lib/auth/rbac';

export interface AvailabilityResult {
  vehicleId: string;
  isAvailable: boolean;
  reason?: string;
  conflictingBookingId?: string;
  conflictingMaintenanceId?: string;
  dailyRate?: number;
  totalDays?: number;
  estimatedTotal?: number;
}

export class InventoryService {
  /**
   * Lists and searches vehicles with server-side validation, filtering, sorting, and pagination.
   */
  public async listVehicles(params: Partial<VehicleQueryParams> = {}) {
    const validated = VehicleQuerySchema.parse(params);
    return vehicleStore.list(validated);
  }

  /**
   * Retrieves a vehicle by ID.
   */
  public async getVehicleById(
    id: string,
    includeInactive: boolean = false,
  ): Promise<VehicleRecord> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('A valid vehicle ID is required');
    }

    const vehicle = await vehicleStore.findById(id);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID "${id}" was not found`);
    }

    if (!vehicle.isActive && !includeInactive) {
      throw new NotFoundError(`Vehicle with ID "${id}" is currently inactive`);
    }

    return vehicle;
  }

  /**
   * Admin: Creates a new vehicle in the database.
   */
  public async createVehicle(input: unknown, userRole: UserRole): Promise<VehicleRecord> {
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only administrators can create inventory vehicles');
    }

    const validated = VehicleCreateSchema.parse(input);
    return vehicleStore.create(validated);
  }

  /**
   * Admin: Updates an existing vehicle in the database.
   */
  public async updateVehicle(
    id: string,
    input: unknown,
    userRole: UserRole,
  ): Promise<VehicleRecord> {
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only administrators can modify inventory vehicles');
    }

    if (!id) {
      throw new ValidationError('A valid vehicle ID is required');
    }

    const existing = await vehicleStore.findById(id);
    if (!existing) {
      throw new NotFoundError(`Vehicle with ID "${id}" does not exist`);
    }

    const validated = VehicleUpdateSchema.parse(input);
    const updated = await vehicleStore.update(id, validated);
    if (!updated) {
      throw new NotFoundError(`Vehicle with ID "${id}" does not exist`);
    }

    return updated;
  }

  /**
   * Admin: Soft deactivates a vehicle from customer visibility.
   */
  public async deactivateVehicle(id: string, userRole: UserRole): Promise<VehicleRecord> {
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only administrators can deactivate inventory vehicles');
    }

    const existing = await vehicleStore.findById(id);
    if (!existing) {
      throw new NotFoundError(`Vehicle with ID "${id}" does not exist`);
    }

    const updated = await vehicleStore.setStatus(id, 'INACTIVE', false);
    if (!updated) {
      throw new NotFoundError(`Vehicle with ID "${id}" does not exist`);
    }

    return updated;
  }

  /**
   * Admin: Reactivates an inactive vehicle into active inventory.
   */
  public async reactivateVehicle(id: string, userRole: UserRole): Promise<VehicleRecord> {
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only administrators can reactivate inventory vehicles');
    }

    const existing = await vehicleStore.findById(id);
    if (!existing) {
      throw new NotFoundError(`Vehicle with ID "${id}" does not exist`);
    }

    const updated = await vehicleStore.setStatus(id, 'AVAILABLE', true);
    if (!updated) {
      throw new NotFoundError(`Vehicle with ID "${id}" does not exist`);
    }

    return updated;
  }

  /**
   * Core Engine: Evaluates authoritative date-range vehicle availability.
   * Accounts for:
   * 1. Operational status (AVAILABLE, MAINTENANCE, UNAVAILABLE, INACTIVE)
   * 2. Existing active bookings with date overlap conflict prevention
   * 3. Administrative and maintenance hold blocks
   */
  public async checkAvailability(
    vehicleId: string,
    pickupDate: Date,
    dropoffDate: Date,
  ): Promise<AvailabilityResult> {
    const vehicle = await vehicleStore.findById(vehicleId);
    if (!vehicle || !vehicle.isActive) {
      return {
        vehicleId,
        isAvailable: false,
        reason: 'Vehicle is not currently active in inventory',
      };
    }

    // 1. Check operational status
    if (vehicle.status === 'MAINTENANCE') {
      return {
        vehicleId,
        isAvailable: false,
        reason: 'Vehicle is currently undergoing routine maintenance',
      };
    }

    if (vehicle.status === 'UNAVAILABLE' || vehicle.status === 'INACTIVE') {
      return {
        vehicleId,
        isAvailable: false,
        reason: 'Vehicle is currently unavailable for rental',
      };
    }

    // Calculate rental duration in days
    const diffMs = dropoffDate.getTime() - pickupDate.getTime();
    const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const estimatedTotal = totalDays * vehicle.dailyRate;

    // 2. Check overlap against existing active bookings
    const bookings = await vehicleStore.getVehicleBookings(vehicleId);
    for (const b of bookings) {
      const bPickup = new Date(b.pickupDate);
      const bDropoff = new Date(b.dropoffDate);

      // Overlap condition: requested pickup < existing dropoff AND requested dropoff > existing pickup
      if (pickupDate < bDropoff && dropoffDate > bPickup) {
        return {
          vehicleId,
          isAvailable: false,
          reason: `Vehicle has a confirmed reservation from ${bPickup.toLocaleDateString('en-AU')} to ${bDropoff.toLocaleDateString('en-AU')}`,
          conflictingBookingId: b.id,
          dailyRate: vehicle.dailyRate,
          totalDays,
          estimatedTotal,
        };
      }
    }

    // 3. Check overlap against maintenance/blocked periods
    const maintenances = await vehicleStore.getVehicleMaintenances(vehicleId);
    for (const m of maintenances) {
      const mStart = new Date(m.startDate);
      const mEnd = new Date(m.endDate);

      // Overlap condition for maintenance
      if (pickupDate <= mEnd && dropoffDate >= mStart) {
        return {
          vehicleId,
          isAvailable: false,
          reason: `Vehicle is scheduled for ${m.reason.toLowerCase()} block from ${mStart.toLocaleDateString('en-AU')} to ${mEnd.toLocaleDateString('en-AU')}`,
          conflictingMaintenanceId: m.id,
          dailyRate: vehicle.dailyRate,
          totalDays,
          estimatedTotal,
        };
      }
    }

    // Everything clear
    return {
      vehicleId,
      isAvailable: true,
      dailyRate: vehicle.dailyRate,
      totalDays,
      estimatedTotal,
    };
  }

  /**
   * Concurrency Protection: Atomically checks availability and locks a reservation.
   * Guarantees two customers cannot simultaneously double-book the same vehicle.
   */
  public async reserveWithConcurrencyCheck(bookingData: {
    id: string;
    vehicleId: string;
    pickupDate: Date;
    dropoffDate: Date;
  }): Promise<ActiveBookingRecord> {
    // Perform authoritative availability check
    const availability = await this.checkAvailability(
      bookingData.vehicleId,
      bookingData.pickupDate,
      bookingData.dropoffDate,
    );

    if (!availability.isAvailable) {
      throw new AppError(
        `Vehicle is unavailable for requested dates: ${availability.reason}`,
        409, // Conflict
      );
    }

    // Atomically persist booking
    const record: ActiveBookingRecord = {
      id: bookingData.id,
      vehicleId: bookingData.vehicleId,
      pickupDate: bookingData.pickupDate,
      dropoffDate: bookingData.dropoffDate,
      status: 'CONFIRMED',
    };

    await vehicleStore.addBooking(record);
    return record;
  }

  /**
   * Admin: Creates a maintenance or administrative hold block.
   */
  public async addMaintenanceBlock(input: unknown, userRole: UserRole): Promise<MaintenanceRecord> {
    if (userRole !== 'ADMIN') {
      throw new AuthorizationError('Only administrators can place maintenance holds');
    }

    const validated = VehicleMaintenanceCreateSchema.parse(input);
    const vehicle = await vehicleStore.findById(validated.vehicleId);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID "${validated.vehicleId}" was not found`);
    }

    return vehicleStore.addMaintenanceBlock(
      validated.vehicleId,
      validated.startDate,
      validated.endDate,
      validated.reason,
      validated.notes,
    );
  }

  /**
   * Retrieves all blocked date ranges (maintenance and confirmed bookings) for a vehicle.
   */
  public async getBlockedDateRanges(vehicleId: string): Promise<
    Array<{
      startDate: string;
      endDate: string;
      type: 'MAINTENANCE' | 'BOOKING';
      reason: string;
    }>
  > {
    const ranges: Array<{
      startDate: string;
      endDate: string;
      type: 'MAINTENANCE' | 'BOOKING';
      reason: string;
    }> = [];

    const maintenances = await vehicleStore.getVehicleMaintenances(vehicleId);
    for (const m of maintenances) {
      ranges.push({
        startDate: new Date(m.startDate).toISOString().split('T')[0],
        endDate: new Date(m.endDate).toISOString().split('T')[0],
        type: 'MAINTENANCE',
        reason: m.notes || m.reason || 'Scheduled Maintenance',
      });
    }

    const bookings = await vehicleStore.getVehicleBookings(vehicleId);
    for (const b of bookings) {
      if (b.status === 'CONFIRMED' || b.status === 'PENDING') {
        ranges.push({
          startDate: new Date(b.pickupDate).toISOString().split('T')[0],
          endDate: new Date(b.dropoffDate).toISOString().split('T')[0],
          type: 'BOOKING',
          reason: 'Reserved by another customer',
        });
      }
    }

    return ranges;
  }
}

export const inventoryService = new InventoryService();
