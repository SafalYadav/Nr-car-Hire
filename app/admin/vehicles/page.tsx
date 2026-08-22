'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { VehicleRecord } from '@/lib/db/vehicle-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit2,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  Star,
  X,
  ImageIcon,
} from 'lucide-react';

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingVehicle, setEditingVehicle] = useState<VehicleRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<VehicleRecord>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // New vehicle modal
  const [isCreating, setIsCreating] = useState(false);
  const [newVehicle, setNewVehicle] = useState<{
    make: string;
    model: string;
    year: number;
    category: 'Sedan' | 'SUV' | 'Premium' | 'Luxury' | 'Utility';
    dailyRate: number;
    location: string;
    seats: number;
    doors: number;
    transmission: 'Automatic' | 'Manual';
    fuelType: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
    luggage: number;
    description: string;
    imageUrl: string;
    gallery: string[];
  }>({
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
    description: 'Spacious hybrid family SUV with exceptional range and comfort.',
    imageUrl: '/images/vehicles/toyota-camry.jpg',
    gallery: ['/images/vehicles/toyota-camry.jpg'],
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Image upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleOpenEdit = (v: VehicleRecord) => {
    setEditingVehicle(v);
    setEditForm({
      make: v.make,
      model: v.model,
      year: v.year,
      category: v.category,
      dailyRate: v.dailyRate,
      location: v.location,
      status: v.status || 'AVAILABLE',
      seats: v.seats,
      doors: v.doors,
      transmission: v.transmission,
      fuelType: v.fuelType,
      luggage: v.luggage,
      description: v.description || '',
      imageUrl: v.imageUrl || '',
      gallery: v.gallery || (v.imageUrl ? [v.imageUrl] : []),
    });
    setUploadError(null);
  };

  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return;
    setIsUpdating(true);
    setUploadError(null);

    try {
      const res = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (data.success) {
        await refreshVehicles();
        setEditingVehicle(null);
      } else {
        setUploadError(data.error || 'Failed to update vehicle');
      }
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      setUploadError('Network error updating vehicle');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to deactivate/delete this vehicle from the fleet?')) {
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
      });
      const data = await res.json();
      if (data.success) {
        await refreshVehicles();
      }
    } catch (err) {
      console.error('Failed to deactivate vehicle:', err);
    }
  };

  const handleCreateVehicle = async () => {
    setIsSubmittingCreate(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: JSON.stringify({
          ...newVehicle,
          gallery: newVehicle.gallery.length > 0 ? newVehicle.gallery : [newVehicle.imageUrl],
        }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshVehicles();
        setIsCreating(false);
      } else {
        setUploadError(data.error || 'Failed to create vehicle');
      }
    } catch (err) {
      console.error('Failed to create vehicle:', err);
      setUploadError('Network error creating vehicle');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Image Upload Handler (Create flow)
  const handleUploadNewImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('vehicleId', `v-new-${Date.now()}`);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.data?.url) {
        const uploadedUrl = data.data.url;
        setNewVehicle((prev) => ({
          ...prev,
          imageUrl: uploadedUrl,
          gallery: [...prev.gallery, uploadedUrl],
        }));
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch {
      setUploadError('Network error uploading image to Supabase Storage');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Image Upload Handler (Edit flow)
  const handleUploadEditImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingVehicle) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('vehicleId', editingVehicle.id);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'x-admin-key': 'nr-car-hire-admin-secret-2024',
        },
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.data?.url) {
        const uploadedUrl = data.data.url;
        setEditForm((prev) => {
          const currentGallery = prev.gallery || [];
          return {
            ...prev,
            imageUrl: prev.imageUrl || uploadedUrl,
            gallery: [...currentGallery, uploadedUrl],
          };
        });
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch {
      setUploadError('Network error uploading image to Supabase Storage');
    } finally {
      setIsUploadingImage(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
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
            Connected to Supabase PostgreSQL & Storage. Changes reflect live across the customer
            website and AI Concierge.
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
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add New Car
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
            <p className="mt-3 text-xs text-slate-400">Loading fleet inventory from Supabase...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Specs</th>
                  <th className="px-5 py-3">Daily Rate</th>
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
                        <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                          {v.imageUrl ? (
                            <Image src={v.imageUrl} alt={v.model} fill className="object-cover" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-slate-600 m-auto mt-3" />
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

                    <td className="px-5 py-4 text-slate-400 text-[11px]">
                      {v.transmission} • {v.fuelType} • {v.seats} seats
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

                    <td className="px-5 py-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(v)}
                        className="h-7 text-[11px] border-slate-700 bg-slate-800 text-slate-200"
                      >
                        <Edit2 className="h-3 w-3 mr-1" /> Edit / Images
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="h-7 text-[11px]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Vehicle & Image Management Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-display font-bold text-white">
                Edit Vehicle & Images: {editingVehicle.year} {editingVehicle.make}{' '}
                {editingVehicle.model}
              </h3>
              <button
                onClick={() => setEditingVehicle(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadError && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">
                {uploadError}
              </p>
            )}

            {/* Image Gallery Management */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gold uppercase tracking-wider">
                  Car Image Gallery & Primary Image
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={handleUploadEditImage}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUploadingImage}
                  onClick={() => editFileInputRef.current?.click()}
                  className="h-7 text-xs border-slate-700 bg-slate-800 text-slate-200"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <UploadCloud className="h-3.5 w-3.5 mr-1 text-gold" />
                  )}
                  Upload to Supabase Storage
                </Button>
              </div>

              {/* Thumbnails list */}
              <div className="grid grid-cols-4 gap-3 pt-2">
                {(editForm.gallery || []).map((imgUrl, idx) => {
                  const isPrimary = editForm.imageUrl === imgUrl;
                  return (
                    <div
                      key={idx}
                      className={`group relative h-20 rounded-lg overflow-hidden border ${
                        isPrimary ? 'border-gold ring-1 ring-gold' : 'border-slate-800'
                      } bg-slate-950`}
                    >
                      <Image src={imgUrl} alt="Vehicle thumbnail" fill className="object-cover" />
                      {isPrimary && (
                        <span className="absolute top-1 left-1 rounded bg-gold/90 px-1 py-0.5 text-[8px] font-bold text-midnight flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-midnight" /> Primary
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {!isPrimary && (
                          <button
                            title="Set as Primary"
                            onClick={() => setEditForm({ ...editForm, imageUrl: imgUrl })}
                            className="p-1 rounded bg-gold text-midnight hover:bg-gold/90 text-[10px]"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          title="Remove Image"
                          onClick={() => {
                            const newGallery = (editForm.gallery || []).filter(
                              (_, i) => i !== idx,
                            );
                            setEditForm({
                              ...editForm,
                              gallery: newGallery,
                              imageUrl:
                                isPrimary && newGallery.length > 0
                                  ? newGallery[0]
                                  : isPrimary
                                    ? ''
                                    : editForm.imageUrl,
                            });
                          }}
                          className="p-1 rounded bg-red-600 text-white hover:bg-red-700 text-[10px]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Details Form */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <Label className="text-slate-300">Daily Rate (INR ₹)</Label>
                <Input
                  type="number"
                  value={editForm.dailyRate || 0}
                  onChange={(e) => setEditForm({ ...editForm, dailyRate: Number(e.target.value) })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white font-mono text-sm"
                />
              </div>

              <div>
                <Label className="text-slate-300">Operational Status</Label>
                <select
                  value={editForm.status || 'AVAILABLE'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value as VehicleRecord['status'] })
                  }
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="RENTED">RENTED</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Location</Label>
                <Input
                  value={editForm.location || ''}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300">Transmission</Label>
                <select
                  value={editForm.transmission || 'Automatic'}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      transmission: e.target.value as 'Automatic' | 'Manual',
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Fuel Type</Label>
                <select
                  value={editForm.fuelType || 'Petrol'}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      fuelType: e.target.value as 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric',
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Seats</Label>
                <Input
                  type="number"
                  value={editForm.seats || 5}
                  onChange={(e) => setEditForm({ ...editForm, seats: Number(e.target.value) })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>

              <div className="col-span-2 sm:col-span-3">
                <Label className="text-slate-300">Description</Label>
                <Input
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1 bg-slate-900 border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
                disabled={isUpdating || (editForm.dailyRate || 0) <= 0}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-display font-bold text-white">
                Add New Vehicle to Fleet
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploadError && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">
                {uploadError}
              </p>
            )}

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
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      category: e.target.value as typeof newVehicle.category,
                    })
                  }
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
                  className="mt-1 bg-slate-900 border-slate-800 text-white font-mono text-sm"
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

              <div>
                <Label className="text-slate-300">Transmission</Label>
                <select
                  value={newVehicle.transmission}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      transmission: e.target.value as 'Automatic' | 'Manual',
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <Label className="text-slate-300">Fuel Type</Label>
                <select
                  value={newVehicle.fuelType}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      fuelType: e.target.value as 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric',
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div className="col-span-2">
                <Label className="text-slate-300">Upload Image to Supabase</Label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleUploadNewImage}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-slate-700 bg-slate-900 text-slate-200 text-xs"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5 mr-1.5 text-gold" />
                    )}
                    Upload Image
                  </Button>
                  {newVehicle.imageUrl && (
                    <span className="text-[11px] text-emerald-400 font-mono truncate max-w-xs">
                      {newVehicle.imageUrl}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
                disabled={isSubmittingCreate || newVehicle.dailyRate <= 0}
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
