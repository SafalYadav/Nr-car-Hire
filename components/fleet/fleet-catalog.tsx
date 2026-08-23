'use client';

import { useState, useMemo } from 'react';
import { allVehicles, vehicleCategories, type VehicleCategoryFilter } from '@/lib/data/vehicles';
import { VehicleCard } from '@/components/shared/vehicle-card';
import { ScrollReveal } from '@/components/shared/scroll-reveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, RotateCcw, Car } from 'lucide-react';

export function FleetCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategoryFilter>('All');
  const [selectedTransmission, setSelectedTransmission] = useState<'All' | 'Automatic' | 'Manual'>(
    'All',
  );
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name-asc'>('price-asc');

  const filteredVehicles = useMemo(() => {
    return allVehicles
      .filter((vehicle) => {
        // Search query filter (make, model, or year)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const fullName = `${vehicle.make} ${vehicle.model} ${vehicle.category}`.toLowerCase();
          if (!fullName.includes(query)) return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && vehicle.category !== selectedCategory) {
          return false;
        }

        // Transmission filter
        if (
          selectedTransmission !== 'All' &&
          vehicle.features?.transmission !== selectedTransmission
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.dailyRate - b.dailyRate;
        if (sortBy === 'price-desc') return b.dailyRate - a.dailyRate;
        if (sortBy === 'name-asc')
          return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
        return 0;
      });
  }, [searchQuery, selectedCategory, selectedTransmission, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedCategory !== 'All' || selectedTransmission !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTransmission('All');
    setSortBy('price-asc');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Search & Filter Bar */}
      <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Search by make, model or category (e.g. Camry, BMW, SUV)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl border-input bg-background/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-gold/30 focus-visible:border-gold shadow-xs"
              aria-label="Search vehicles"
            />
          </div>

          {/* Sort & Transmission Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="transmission-filter"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Gearbox:
              </label>
              <select
                id="transmission-filter"
                value={selectedTransmission}
                onChange={(e) =>
                  setSelectedTransmission(e.target.value as 'All' | 'Automatic' | 'Manual')
                }
                className="h-12 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:border-gold shadow-xs"
              >
                <option value="All">All Transmissions</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-by" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sort:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'price-asc' | 'price-desc' | 'name-asc')
                }
                className="h-12 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:border-gold shadow-xs"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Vehicle: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-5">
          <span className="mr-2 flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <SlidersHorizontal className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            Categories:
          </span>
          {vehicleCategories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gold text-midnight shadow-md shadow-gold/20'
                    : 'bg-muted text-foreground/80 hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {category}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-gold hover:text-gold/80 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="mt-8 flex items-center justify-between px-1">
        <p className="text-sm font-medium text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredVehicles.length}</span>{' '}
          {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'} available across Australia
        </p>
      </div>

      {/* Vehicle Grid */}
      {filteredVehicles.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle, i) => (
            <ScrollReveal key={vehicle.id} delay={i * 0.05}>
              <VehicleCard vehicle={vehicle} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Car className="h-8 w-8 text-gold" />
          </div>
          <h3 className="text-lg font-display font-bold text-card-foreground">No vehicles found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            We couldn&apos;t find any vehicles matching your current search and filter criteria.
          </p>
          <Button variant="gold" size="default" onClick={resetFilters} className="mt-6 rounded-full shadow-md shadow-gold/20">
            <RotateCcw className="h-4 w-4" />
            <span>Reset all filters</span>
          </Button>
        </div>
      )}
    </div>
  );
}

