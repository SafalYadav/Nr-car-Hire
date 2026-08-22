'use client';

import { useState, useEffect } from 'react';
import type { Vehicle } from '@/lib/data/vehicles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Trash2 } from 'lucide-react';

interface MaintenanceItem {
  id: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
}

export default function AdminInventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>([
    {
      id: 'm-demo-1',
      vehicleId: 'v-005-hilux',
      startDate: '2026-09-01T00:00:00Z',
      endDate: '2026-09-05T00:00:00Z',
      reason: 'MAINTENANCE',
      notes: 'Scheduled 50,000km mechanical safety inspection',
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // New Block Form
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('v-001-camry');
  const [startDate, setStartDate] = useState(
    () => new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
  );
  const [reason, setReason] = useState('MAINTENANCE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vehicles');
        const data = await res.json();
        if (data.success) {
          setVehicles(data.data.vehicles);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleAddBlock = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicleId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMaintenances([
          ...maintenances,
          {
            id: data.data.id || `m-${Date.now()}`,
            vehicleId: selectedVehicleId,
            startDate,
            endDate,
            reason,
            notes,
          },
        ]);
        setIsAdding(false);
        setNotes('');
      }
    } catch (err) {
      console.error('Failed to add maintenance hold:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBlock = (id: string) => {
    setMaintenances(maintenances.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">
            Inventory & Maintenance Calendar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Lock specific date ranges to prevent double-booking during servicing, repairs, or
            administrative holds.
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={() => setIsAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Schedule Maintenance Hold
        </Button>
      </div>

      {/* Active Maintenance Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Active Maintenance & Date-Range Holds ({maintenances.length})
          </h2>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3">Vehicle</th>
              <th className="px-5 py-3">Blocked Date Range</th>
              <th className="px-5 py-3">Reason</th>
              <th className="px-5 py-3">Notes</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold" />
                  <p className="mt-2 text-xs">Loading fleet inventory...</p>
                </td>
              </tr>
            ) : maintenances.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No active maintenance holds currently scheduled.
                </td>
              </tr>
            ) : (
              maintenances.map((m) => {
                const veh = vehicles.find((v) => v.id === m.vehicleId);
                const sDate = new Date(m.startDate).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const eDate = new Date(m.endDate).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">
                      {veh ? `${veh.year} ${veh.make} ${veh.model}` : m.vehicleId}
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-mono">
                      {sDate} → {eDate}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                        {m.reason}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{m.notes || '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveBlock(m.id)}
                        className="h-7 text-[11px]"
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Remove Hold
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Maintenance Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-display font-bold text-white">
              Schedule Vehicle Maintenance Hold
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-slate-300">Target Vehicle</Label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">End Date</Label>
                <Input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Reason</Label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="MAINTENANCE">Scheduled Maintenance</option>
                  <option value="DAMAGE">Repair & Damage</option>
                  <option value="CLEANING">Deep Detailing</option>
                  <option value="INSPECTION">Roadworthy Inspection</option>
                  <option value="ADMIN_HOLD">Administrative Hold</option>
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Notes (Optional)</Label>
                <Input
                  value={notes}
                  placeholder="e.g. Brake replacement and tyre rotation"
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
                className="border-slate-800 text-slate-400"
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                disabled={isSubmitting || !startDate || !endDate}
                onClick={handleAddBlock}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Schedule Hold'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
