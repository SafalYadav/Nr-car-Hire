'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { VehicleRecord } from '@/lib/db/vehicle-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Loader2, RefreshCw, Search } from 'lucide-react';

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [editRate, setEditRate] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>('AVAILABLE');
  const [isUpdating, setIsUpdating] = useState(false);

  // New vehicle modal
  const [isCreating, setIsCreating] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: 'Toyota',
    model: 'RAV4 Hybrid',
    year: 2024,
    category: 'SUV',
    dailyRate: 119,
    location: 'Sydney',
    seats: 5,
    doors: 5,
    transmission: 'Automatic',
    fuelType: 'Hybrid',
    luggage: 4,
    imageUrl:
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200',
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadVehicles() {
      try {
        const res = await fetch('/api/vehicles');
        const data = await res.json();
        if (isMounted && data.success) {
          setVehicles(data.data.vehicles);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadVehicles();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data.vehicles);
      }
    } catch (err) {
      console.error('Failed to refresh vehicles:', err);
    }
  };

  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify({
          dailyRate: Number(editRate),
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshVehicles();
        setEditingVehicle(null);
      }
    } catch (err) {
      console.error('Failed to update vehicle:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateVehicle = async () => {
    setIsSubmittingCreate(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify(newVehicle),
      });

      const data = await res.json();
      if (data.success) {
        await refreshVehicles();
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Failed to create vehicle:', err);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) =>
    `${v.make} ${v.model} ${v.category} ${v.location}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Vehicle Fleet Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Database source of truth. Updates to pricing or availability reflect immediately across
            the customer website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshVehicles}
            className="border-slate-700 bg-slate-800 text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button variant="gold" size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Vehicle
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search by make, model, category, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-xs"
        />
      </div>

      {/* Vehicle Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
            <p className="mt-3 text-xs text-slate-400">Loading fleet inventory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Daily Rate (INR)</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                          {v.imageUrl && (
                            <Image src={v.imageUrl} alt={v.model} fill className="object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">
                            {v.year} {v.make} {v.model}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{v.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-800 text-slate-300 px-2.5 py-1 text-[10px] font-medium border border-slate-700">
                        {v.category}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-gold text-sm">
                      ₹{v.dailyRate}/day
                    </td>

                    <td className="px-5 py-4 text-slate-300">{v.location}</td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          v.status === 'AVAILABLE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : v.status === 'MAINTENANCE'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingVehicle(v);
                          setEditRate(v.dailyRate);
                          setEditStatus(v.status || 'AVAILABLE');
                        }}
                        className="h-7 text-[11px] border-slate-700 bg-slate-800 text-slate-200"
                      >
                        <Edit2 className="h-3 w-3 mr-1" /> Edit Rate / Status
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Vehicle Rate Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-display font-bold text-white">
              Update Pricing & Status: {editingVehicle.year} {editingVehicle.make}{' '}
              {editingVehicle.model}
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="editRate" className="text-xs text-slate-300">
                  Daily Rental Rate (INR ₹)
                </Label>
                <Input
                  id="editRate"
                  type="number"
                  value={editRate}
                  onChange={(e) => setEditRate(Number(e.target.value))}
                  className="mt-1 bg-slate-900 border-slate-800 text-white font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="editStatus" className="text-xs text-slate-300">
                  Operational Status
                </Label>
                <select
                  id="editStatus"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white shadow-sm"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="RENTED">RENTED</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingVehicle(null)}
                className="border-slate-800 text-slate-400"
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                disabled={isUpdating || editRate <= 0}
                onClick={handleUpdateVehicle}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Vehicle Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-display font-bold text-white">
              Add New Vehicle to Fleet
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <Label className="text-slate-300">Make</Label>
                <Input
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Model</Label>
                <Input
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Year</Label>
                <Input
                  type="number"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Category</Label>
                <select
                  value={newVehicle.category}
                  onChange={(e) => setNewVehicle({ ...newVehicle, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Utility">Utility</option>
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Daily Rate (INR ₹)</Label>
                <Input
                  type="number"
                  value={newVehicle.dailyRate}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, dailyRate: Number(e.target.value) })
                  }
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Location</Label>
                <Input
                  value={newVehicle.location}
                  onChange={(e) => setNewVehicle({ ...newVehicle, location: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-slate-300">Image URL</Label>
                <Input
                  value={newVehicle.imageUrl}
                  onChange={(e) => setNewVehicle({ ...newVehicle, imageUrl: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(false)}
                className="border-slate-800 text-slate-400"
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                disabled={isSubmittingCreate}
                onClick={handleCreateVehicle}
              >
                {isSubmittingCreate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Create Vehicle'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
