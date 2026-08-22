'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { AdminMetrics } from '@/lib/db/booking-store';
import {
  DollarSign,
  BookmarkCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Car,
  Wrench,
  ArrowUpRight,
  ChevronRight,
  Loader2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch('/api/admin/metrics', {
          headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setMetrics(data.data);
        }
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white sm:text-3xl">
            Executive Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fleet utilization, verified revenue ledger, and operational status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/vehicles"
            className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-slate-950 hover:bg-gold/90 transition-colors shadow-lg shadow-gold/10"
          >
            + Add New Vehicle
          </Link>
          <Link
            href="/admin/discounts"
            className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Create Promo Code
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-display font-extrabold text-white">
              ₹{metrics?.totalRevenue || 0}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> Authoritative verified payments
            </p>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="rounded-xl bg-gold/10 p-2 text-gold">
              <BookmarkCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-display font-extrabold text-white">
              {metrics?.totalBookings || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {metrics?.confirmedBookings || 0} Confirmed • {metrics?.cancelledBookings || 0}{' '}
              Cancelled
            </p>
          </div>
        </div>

        {/* Fleet Availability */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Available Fleet
            </span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-display font-extrabold text-white">
              {metrics?.availableVehicles || 0}{' '}
              <span className="text-sm font-normal text-slate-400">Cars</span>
            </p>
            <p className="text-[11px] text-blue-400 mt-1">
              {metrics?.rentedVehicles || 0} Rented / Reserved
            </p>
          </div>
        </div>

        {/* Fleet in Maintenance */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Maintenance Holds
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-display font-extrabold text-white">
              {metrics?.maintenanceVehicles || 0}{' '}
              <span className="text-sm font-normal text-slate-400">Blocked</span>
            </p>
            <p className="text-[11px] text-amber-400 mt-1">Active operational blocks</p>
          </div>
        </div>
      </div>

      {/* Middle Section: Booking Status Breakdown & Popular Vehicles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Booking Status Distribution */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-display font-bold text-white">
              Booking Status Distribution
            </h2>
            <Link
              href="/admin/bookings"
              className="text-xs text-gold hover:underline flex items-center"
            >
              View All <ArrowUpRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Confirmed & Active
              </span>
              <span className="font-bold text-white font-mono">
                {(metrics?.confirmedBookings || 0) + (metrics?.activeRentals || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-amber-400 font-medium">
                <Clock className="h-4 w-4" /> Payment Pending / Checkout
              </span>
              <span className="font-bold text-white font-mono">
                {metrics?.pendingPayments || 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-blue-400 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Completed Returns
              </span>
              <span className="font-bold text-white font-mono">
                {metrics?.completedRentals || 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-red-400 font-medium">
                <XCircle className="h-4 w-4" /> Cancelled / Refunded
              </span>
              <span className="font-bold text-white font-mono">
                {metrics?.cancelledBookings || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Popular Vehicles */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-display font-bold text-white">
              Fleet Performance & Ranking
            </h2>
            <Link
              href="/admin/vehicles"
              className="text-xs text-gold hover:underline flex items-center"
            >
              Manage Fleet <ArrowUpRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {metrics?.popularVehicles && metrics.popularVehicles.length > 0 ? (
              metrics.popularVehicles.map((v, i) => (
                <div key={v.vehicleId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gold font-mono w-4">#{i + 1}</span>
                    <span className="text-slate-200 font-medium">
                      {v.make} {v.model}
                    </span>
                  </div>
                  <span className="font-bold text-slate-300 font-mono">
                    {v.bookingsCount} Bookings
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No booking activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/pricing"
          className="rounded-2xl border border-slate-800 bg-slate-950 p-5 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Dynamic Pricing</h3>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-gold transition-colors" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Set seasonal multipliers, weekend surcharges, and location rates.
          </p>
        </Link>

        <Link
          href="/admin/inventory"
          className="rounded-2xl border border-slate-800 bg-slate-950 p-5 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Maintenance Holds</h3>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-gold transition-colors" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Schedule vehicle servicing, repairs, and date range locks.
          </p>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="rounded-2xl border border-slate-800 bg-slate-950 p-5 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Audit Trail</h3>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-gold transition-colors" />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Review immutable chronological administrative security logs.
          </p>
        </Link>
      </div>
    </div>
  );
}
