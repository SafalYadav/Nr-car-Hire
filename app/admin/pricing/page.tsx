'use client';

import { useState, useEffect } from 'react';
import type { PricingRuleRecord } from '@/lib/db/pricing-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';

export default function AdminPricingPage() {
  const [rules, setRules] = useState<PricingRuleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    name: 'Peak Season Summer Surcharge',
    category: 'SUV',
    ruleType: 'SEASONAL' as PricingRuleRecord['ruleType'],
    adjustment: 25,
    priority: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRules() {
      try {
        const res = await fetch('/api/pricing?all=true', {
          headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setRules(data.data);
        }
      } catch (err) {
        console.error('Failed to load pricing rules:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadRules();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshRules = async () => {
    try {
      const res = await fetch('/api/pricing?all=true', {
        headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
      });
      const data = await res.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch (err) {
      console.error('Failed to refresh pricing rules:', err);
    }
  };

  const handleCreateRule = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify(newRule),
      });

      const data = await res.json();
      if (data.success) {
        await refreshRules();
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Failed to create rule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Dynamic Pricing Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure weekend multipliers, seasonal holiday rates, and category-wide price
            adjustments.
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Pricing Rule
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
                <th className="px-5 py-3">Rule Name</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Category / Scope</th>
                <th className="px-5 py-3">Adjustment (INR)</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-4 font-bold text-white">{r.name}</td>
                  <td className="px-5 py-4 font-mono text-slate-300">{r.ruleType}</td>
                  <td className="px-5 py-4 text-slate-300">{r.category || 'All Categories'}</td>
                  <td className="px-5 py-4 font-bold text-gold font-mono">+₹{r.adjustment}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                      ACTIVE
                    </span>
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
            <h3 className="text-base font-display font-bold text-white">Create Pricing Rule</h3>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-slate-300">Rule Name</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Rule Type</Label>
                <select
                  value={newRule.ruleType}
                  onChange={(e) =>
                    setNewRule({
                      ...newRule,
                      ruleType: e.target.value as PricingRuleRecord['ruleType'],
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="WEEKEND_SURCHARGE">Weekend Surcharge</option>
                  <option value="SEASONAL">Seasonal Holiday</option>
                  <option value="DAILY_OVERRIDE">Daily Override</option>
                  <option value="LOCATION_SURCHARGE">Location Surcharge</option>
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Target Category</Label>
                <select
                  value={newRule.category}
                  onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Premium">Premium</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Utility">Utility</option>
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Adjustment Amount (INR ₹)</Label>
                <Input
                  type="number"
                  value={newRule.adjustment}
                  onChange={(e) => setNewRule({ ...newRule, adjustment: Number(e.target.value) })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
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
              <Button variant="gold" size="sm" disabled={isSubmitting} onClick={handleCreateRule}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Rule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
