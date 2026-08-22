'use client';

import { useState, useEffect } from 'react';
import type { ExtraRecord } from '@/lib/db/extra-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Power, Loader2 } from 'lucide-react';

export default function AdminExtrasPage() {
  const [extras, setExtras] = useState<ExtraRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isCreating, setIsCreating] = useState(false);
  const [newExtra, setNewExtra] = useState({
    code: 'PREMIUM_WIFI',
    name: 'In-Car 5G Wi-Fi Hotspot',
    description: 'Unlimited high-speed Australian 5G mobile hotspot for up to 8 devices',
    pricingType: 'PER_DAY' as ExtraRecord['pricingType'],
    price: 14,
    maxQuantity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadExtras() {
      try {
        const res = await fetch('/api/extras?all=true', {
          headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setExtras(data.data);
        }
      } catch (err) {
        console.error('Failed to load extras:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadExtras();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshExtras = async () => {
    try {
      const res = await fetch('/api/extras?all=true', {
        headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
      });
      const data = await res.json();
      if (data.success) {
        setExtras(data.data);
      }
    } catch (err) {
      console.error('Failed to refresh extras:', err);
    }
  };

  const handleCreateExtra = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/extras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify(newExtra),
      });

      const data = await res.json();
      if (data.success) {
        await refreshExtras();
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Failed to create extra:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleExtra = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/extras/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshExtras();
      }
    } catch (err) {
      console.error('Failed to toggle extra:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Optional Rental Extras</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage optional insurance covers, equipment add-ons, child seats, and accessories
            available during booking.
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Extra Item
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Extra Name</th>
                <th className="px-5 py-3">Pricing Type</th>
                <th className="px-5 py-3">Price (INR)</th>
                <th className="px-5 py-3">Max Qty</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {extras.map((e) => (
                <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-white">{e.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{e.description}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-300">
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px]">
                      {e.pricingType}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-gold">
                    ₹{e.price} {e.pricingType === 'PER_DAY' ? '/ day' : 'flat'}
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-mono">{e.maxQuantity}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        e.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {e.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      size="sm"
                      variant={e.isActive ? 'destructive' : 'outline'}
                      onClick={() => handleToggleExtra(e.id, Boolean(e.isActive))}
                      className="h-7 text-[11px]"
                    >
                      <Power className="h-3 w-3 mr-1" />
                      {e.isActive ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-display font-bold text-white">Add New Extra</h3>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-slate-300">Code (Unique)</Label>
                <Input
                  value={newExtra.code}
                  onChange={(e) => setNewExtra({ ...newExtra, code: e.target.value.toUpperCase() })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white font-mono uppercase"
                />
              </div>

              <div>
                <Label className="text-slate-300">Name</Label>
                <Input
                  value={newExtra.name}
                  onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Description</Label>
                <Input
                  value={newExtra.description}
                  onChange={(e) => setNewExtra({ ...newExtra, description: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Pricing Type</Label>
                  <select
                    value={newExtra.pricingType}
                    onChange={(e) =>
                      setNewExtra({
                        ...newExtra,
                        pricingType: e.target.value as ExtraRecord['pricingType'],
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                  >
                    <option value="PER_DAY">Per Day</option>
                    <option value="FLAT">Flat Fee</option>
                  </select>
                </div>

                <div>
                  <Label className="text-slate-300">Price (INR ₹)</Label>
                  <Input
                    type="number"
                    value={newExtra.price}
                    onChange={(e) => setNewExtra({ ...newExtra, price: Number(e.target.value) })}
                    className="mt-1 bg-slate-900 border-slate-800 text-white"
                  />
                </div>
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
              <Button variant="gold" size="sm" disabled={isSubmitting} onClick={handleCreateExtra}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Extra'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
