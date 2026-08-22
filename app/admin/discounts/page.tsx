'use client';

import { useState, useEffect } from 'react';
import type { DiscountRecord } from '@/lib/db/discount-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Power, Loader2 } from 'lucide-react';

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Promo Modal
  const [isCreating, setIsCreating] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: 'SPECIAL20',
    description: '20% off all Australian rentals',
    discountType: 'PERCENTAGE',
    value: 20,
    minRentalDays: 3,
    minBookingValue: 200,
    maxDiscountAmount: 150,
    usageLimit: 500,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDiscounts() {
      try {
        const res = await fetch('/api/discounts', {
          headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setDiscounts(data.data);
        }
      } catch (err) {
        console.error('Failed to load discounts:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadDiscounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshDiscounts = async () => {
    try {
      const res = await fetch('/api/discounts', {
        headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
      });
      const data = await res.json();
      if (data.success) {
        setDiscounts(data.data);
      }
    } catch (err) {
      console.error('Failed to refresh discounts:', err);
    }
  };

  const handleCreateDiscount = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify(newPromo),
      });

      const data = await res.json();
      if (data.success) {
        await refreshDiscounts();
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Failed to create discount:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/discounts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshDiscounts();
      }
    } catch (err) {
      console.error('Failed to toggle discount:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Discounts & Promo Codes</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create percentage or fixed amount coupons with usage limits, minimum rental days, and
            category restrictions.
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Promo Code
        </Button>
      </div>

      {/* Discounts Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold" />
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Promo Code</th>
                <th className="px-5 py-3">Discount Value</th>
                <th className="px-5 py-3">Usage</th>
                <th className="px-5 py-3">Constraints</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-gold text-sm bg-gold/10 px-2.5 py-1 rounded-md border border-gold/20">
                      {d.code}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1.5">{d.description}</p>
                  </td>

                  <td className="px-5 py-4 font-bold text-white">
                    {d.discountType === 'PERCENTAGE' ? `${d.value}% Off` : `₹${d.value} Flat Off`}
                    {d.maxDiscountAmount && (
                      <span className="block text-[10px] text-slate-400">
                        Max ₹{d.maxDiscountAmount}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-slate-300 font-mono">
                    {d.usageCount} / {d.usageLimit || '∞'} uses
                  </td>

                  <td className="px-5 py-4 text-slate-400 text-[11px]">
                    {d.minRentalDays ? `Min ${d.minRentalDays} days • ` : ''}
                    {d.minBookingValue ? `Min ₹${d.minBookingValue} spend` : 'No min spend'}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        d.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {d.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Button
                      size="sm"
                      variant={d.isActive ? 'destructive' : 'outline'}
                      onClick={() => handleToggleStatus(d.id, Boolean(d.isActive))}
                      className="h-7 text-[11px]"
                    >
                      <Power className="h-3 w-3 mr-1" />
                      {d.isActive ? 'Deactivate' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Promo Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-display font-bold text-white">Create Promo Code</h3>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-slate-300">Promo Code (Uppercase)</Label>
                <Input
                  value={newPromo.code}
                  onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white font-mono uppercase"
                />
              </div>

              <div>
                <Label className="text-slate-300">Description</Label>
                <Input
                  value={newPromo.description}
                  onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Discount Type</Label>
                  <select
                    value={newPromo.discountType}
                    onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-slate-300">Value (% or ₹)</Label>
                  <Input
                    type="number"
                    value={newPromo.value}
                    onChange={(e) => setNewPromo({ ...newPromo, value: Number(e.target.value) })}
                    className="mt-1 bg-slate-900 border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">Min Rental Days</Label>
                  <Input
                    type="number"
                    value={newPromo.minRentalDays}
                    onChange={(e) =>
                      setNewPromo({ ...newPromo, minRentalDays: Number(e.target.value) })
                    }
                    className="mt-1 bg-slate-900 border-slate-800 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Max Usage Limit</Label>
                  <Input
                    type="number"
                    value={newPromo.usageLimit}
                    onChange={(e) =>
                      setNewPromo({ ...newPromo, usageLimit: Number(e.target.value) })
                    }
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
              <Button
                variant="gold"
                size="sm"
                disabled={isSubmitting || !newPromo.code || newPromo.value <= 0}
                onClick={handleCreateDiscount}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Promo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
