import { bookingStore, type AdminMetrics } from '@/lib/db/booking-store';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { auditStore } from '@/lib/db/audit-store';

export class AdminService {
  /**
   * Aggregate executive dashboard metrics
   */
  public async getDashboardMetrics(): Promise<AdminMetrics> {
    const { bookings } = await bookingStore.listAdmin({ limit: 1000 });
    const { vehicles } = await vehicleStore.list({ includeInactive: true });

    let totalRevenue = 0;
    let todayRevenue = 0;
    let monthlyRevenue = 0;
    let pendingPayments = 0;
    let confirmedBookings = 0;
    let activeRentals = 0;
    let completedRentals = 0;
    let cancelledBookings = 0;

    const statusDistribution: Record<string, number> = {
      CONFIRMED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      PAYMENT_PENDING: 0,
    };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthlyRevenueMap: Record<string, { revenue: number; bookings: number }> = {};
    const vehicleBookingCount: Record<string, { make: string; model: string; count: number }> = {};

    for (const b of bookings) {
      // Status counting
      statusDistribution[b.status] = (statusDistribution[b.status] || 0) + 1;

      if (b.status === 'CONFIRMED') confirmedBookings++;
      if (b.status === 'ACTIVE') activeRentals++;
      if (b.status === 'COMPLETED') completedRentals++;
      if (b.status === 'CANCELLED') cancelledBookings++;
      if (b.status === 'PAYMENT_PENDING' || b.paymentStatus === 'PENDING') pendingPayments++;

      // Revenue from verified/confirmed/completed/active bookings
      if (
        b.paymentStatus === 'PAID' ||
        b.status === 'CONFIRMED' ||
        b.status === 'COMPLETED' ||
        b.status === 'ACTIVE'
      ) {
        totalRevenue += b.finalAmount;

        const bDate = new Date(b.createdAt);
        const bDateStr = bDate.toISOString().split('T')[0];
        if (bDateStr === todayStr) {
          todayRevenue += b.finalAmount;
        }

        if (bDate.getFullYear() === currentYear && bDate.getMonth() === currentMonth) {
          monthlyRevenue += b.finalAmount;
        }

        const monthKey = `${bDate.toLocaleString('default', { month: 'short' })} ${bDate.getFullYear()}`;
        if (!monthlyRevenueMap[monthKey]) {
          monthlyRevenueMap[monthKey] = { revenue: 0, bookings: 0 };
        }
        monthlyRevenueMap[monthKey].revenue += b.finalAmount;
        monthlyRevenueMap[monthKey].bookings += 1;
      }

      // Vehicle popular counts
      const v = vehicles.find((veh) => veh.id === b.vehicleId);
      if (v) {
        if (!vehicleBookingCount[b.vehicleId]) {
          vehicleBookingCount[b.vehicleId] = { make: v.make, model: v.model, count: 0 };
        }
        vehicleBookingCount[b.vehicleId].count += 1;
      }
    }

    // Vehicle status counts
    let availableVehicles = 0;
    let rentedVehicles = 0;
    let maintenanceVehicles = 0;

    for (const v of vehicles) {
      if (v.status === 'AVAILABLE') availableVehicles++;
      else if (v.status === 'RENTED' || v.status === 'RESERVED') rentedVehicles++;
      else if (v.status === 'MAINTENANCE') maintenanceVehicles++;
    }

    // Build timeline
    const revenueByMonth = Object.entries(monthlyRevenueMap).map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue * 100) / 100,
      bookings: data.bookings,
    }));

    // Build popular vehicles list
    const popularVehicles = Object.entries(vehicleBookingCount)
      .map(([vehicleId, data]) => ({
        vehicleId,
        make: data.make,
        model: data.model,
        bookingsCount: data.count,
      }))
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, 5);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      totalBookings: bookings.length,
      pendingPayments,
      confirmedBookings,
      activeRentals,
      completedRentals,
      cancelledBookings,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      bookingStatusDistribution: statusDistribution,
      revenueByMonth,
      popularVehicles,
    };
  }

  public async getAuditLogs(limit = 50) {
    return auditStore.list(limit);
  }
}

export const adminService = new AdminService();
