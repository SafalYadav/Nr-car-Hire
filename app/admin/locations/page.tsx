'use client';

import { useState, useEffect } from 'react';
import type { LocationRecord } from '@/lib/db/location-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Loader2 } from 'lucide-react';

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isCreating, setIsCreating] = useState(false);
  const [newLoc, setNewLoc] = useState({
    code: 'CBR_APT',
    name: 'Canberra Airport (CBR)',
    airportOrCity: 'Canberra Airport',
    address: 'Terminal Circuit, Pialligo ACT 2609',
    state: 'ACT',
    pickupAvailable: true,
    dropoffAvailable: true,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadLocations() {
      try {
        const res = await fetch('/api/locations?all=true', {
          headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
        });
        const data = await res.json();
        if (isMounted && data.success) {
          setLocations(data.data);
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadLocations();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshLocations = async () => {
    try {
      const res = await fetch('/api/locations?all=true', {
        headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
      });
      const data = await res.json();
      if (data.success) {
        setLocations(data.data);
      }
    } catch (err) {
      console.error('Failed to refresh locations:', err);
    }
  };

  const handleCreateLocation = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify(newLoc),
      });

      const data = await res.json();
      if (data.success) {
        await refreshLocations();
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Failed to create location:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Locations & Hubs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage Australian airport pickup hubs, city depots, and return locations.
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Location Hub
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
                <th className="px-5 py-3">Location Name</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">State</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {locations.map((l) => (
                <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-4 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-gold" />
                      {l.name}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-300">{l.code}</td>
                  <td className="px-5 py-4 text-slate-300 font-bold">{l.state}</td>
                  <td className="px-5 py-4 text-slate-400 text-[11px]">{l.address}</td>
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
            <h3 className="text-base font-display font-bold text-white">Add Location Hub</h3>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-slate-300">Hub Code</Label>
                <Input
                  value={newLoc.code}
                  onChange={(e) => setNewLoc({ ...newLoc, code: e.target.value.toUpperCase() })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white font-mono uppercase"
                />
              </div>

              <div>
                <Label className="text-slate-300">Name</Label>
                <Input
                  value={newLoc.name}
                  onChange={(e) => setNewLoc({ ...newLoc, name: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">City / Airport Area</Label>
                <Input
                  value={newLoc.airportOrCity}
                  onChange={(e) => setNewLoc({ ...newLoc, airportOrCity: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Full Address</Label>
                <Input
                  value={newLoc.address}
                  onChange={(e) => setNewLoc({ ...newLoc, address: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">State (e.g. NSW, VIC, QLD, WA, ACT)</Label>
                <Input
                  value={newLoc.state}
                  onChange={(e) => setNewLoc({ ...newLoc, state: e.target.value.toUpperCase() })}
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
              <Button
                variant="gold"
                size="sm"
                disabled={isSubmitting}
                onClick={handleCreateLocation}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Location'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
