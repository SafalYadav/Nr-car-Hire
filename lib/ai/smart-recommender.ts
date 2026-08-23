import type { VehicleRecord } from '@/lib/db/vehicle-store';
import { inventoryService } from '@/lib/services/inventory-service';
import type { ManagedConversationState } from '@/lib/ai/conversation-manager';
import type { SuggestedVehicle } from '@/lib/services/ai-agent-service';
import { logger } from '@/lib/utils/logger';

export class SmartRecommender {
  /**
   * Authoritatively discovers genuine, available fleet alternatives.
   * Strictly respects unavailable, rejected, and suggested vehicle exclusions.
   */
  public async findAvailableAlternatives(
    state: ManagedConversationState,
    allVehicles: VehicleRecord[],
    limit: number = 3
  ): Promise<{
    vehicles: SuggestedVehicle[];
    explanation: string;
  }> {
    // 1. Initial Exclusion: Remove explicitly rejected or known unavailable vehicles
    let candidates = allVehicles.filter((v) => {
      if (state.rejectedVehicles.includes(v.id)) return false;
      if (state.unavailableVehicles.includes(v.id)) return false;
      return v.isActive;
    });

    // 2. Filter by hard transmission constraint
    if (state.transmission && state.transmission !== 'Any') {
      candidates = candidates.filter(
        (v) => v.transmission.toLowerCase() === state.transmission!.toLowerCase()
      );
    }

    // 3. Filter by minimum seats constraint
    if (state.seatsMin && state.seatsMin > 0) {
      candidates = candidates.filter((v) => v.seats >= state.seatsMin!);
    }

    // 4. Filter by max budget constraint
    if (state.maxDailyRate && state.maxDailyRate > 0) {
      candidates = candidates.filter((v) => v.dailyRate <= state.maxDailyRate!);
    }

    // 5. Category preference (if user explicitly requested a category like SUV, Sedan, Luxury)
    if (state.category) {
      const catMatch = candidates.filter(
        (v) => v.category.toLowerCase() === state.category!.toLowerCase()
      );
      if (catMatch.length > 0) {
        candidates = catMatch;
      }
    }

    // 6. Live Availability Verification (if dates are present in conversation state)
    const verifiedAvailable: VehicleRecord[] = [];

    if (state.pickupDate && state.dropoffDate) {
      const pDate = new Date(state.pickupDate);
      const dDate = new Date(state.dropoffDate);

      for (const vehicle of candidates) {
        try {
          const avail = await inventoryService.checkAvailability(vehicle.id, pDate, dDate);
          if (avail.isAvailable) {
            verifiedAvailable.push(vehicle);
          } else {
            // Record as unavailable so it is NEVER recommended again in this request
            if (!state.unavailableVehicles.includes(vehicle.id)) {
              state.unavailableVehicles.push(vehicle.id);
            }
          }
        } catch (err: unknown) {
          logger.warn(`Error checking candidate availability for ${vehicle.id}:`, {
            error: err instanceof Error ? err.message : String(err),
          });
          // In case of error, assume unavailable to prevent booking clashes
          if (!state.unavailableVehicles.includes(vehicle.id)) {
            state.unavailableVehicles.push(vehicle.id);
          }
        }
      }
    } else {
      // If dates not set yet, all candidates are preliminary
      verifiedAvailable.push(...candidates);
    }

    // 7. Sort: Prefer unseen vehicles, then sort by budget preference
    verifiedAvailable.sort((a, b) => {
      const aSuggested = state.suggestedVehicles.includes(a.id) ? 1 : 0;
      const bSuggested = state.suggestedVehicles.includes(b.id) ? 1 : 0;
      if (aSuggested !== bSuggested) return aSuggested - bSuggested;

      if (state.budgetPreference === 'cheaper') {
        return a.dailyRate - b.dailyRate;
      }
      if (state.budgetPreference === 'luxury') {
        return b.dailyRate - a.dailyRate;
      }
      return 0;
    });

    const topResults = verifiedAvailable.slice(0, limit);

    // Track suggested vehicles
    for (const v of topResults) {
      if (!state.suggestedVehicles.includes(v.id)) {
        state.suggestedVehicles.push(v.id);
      }
    }

    const suggested: SuggestedVehicle[] = topResults.map((v) => {
      const query = new URLSearchParams();
      if (state.pickupDate) query.set('pickupDate', state.pickupDate);
      if (state.dropoffDate) query.set('dropoffDate', state.dropoffDate);
      if (state.promoCode) query.set('promo', state.promoCode);
      const bookingUrl = `/book/${v.id}${query.toString() ? `?${query.toString()}` : ''}`;

      return {
        id: v.id,
        name: `${v.year} ${v.make} ${v.model}`,
        year: v.year,
        make: v.make,
        model: v.model,
        category: v.category,
        dailyRate: v.dailyRate,
        seats: v.seats,
        transmission: v.transmission,
        fuelType: v.fuelType,
        luggage: v.luggage,
        imageUrl: v.imageUrl || (v.gallery && v.gallery[0]) || null,
        location: v.location,
        bookingUrl,
        detailsUrl: `/fleet/${v.id}`,
        matchReason: `Verified Available • ₹${v.dailyRate}/day • ${v.seats} Seats • ${v.transmission}`,
      };
    });

    let explanation = `Found ${suggested.length} available alternative options.`;
    if (suggested.length === 0) {
      explanation = `No alternative vehicles are currently available for the selected dates.`;
    }

    return {
      vehicles: suggested,
      explanation,
    };
  }
}

export const smartRecommender = new SmartRecommender();
