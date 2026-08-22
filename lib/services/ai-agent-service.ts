import { GoogleGenAI } from '@google/genai';
import { vehicleStore, type VehicleRecord } from '@/lib/db/vehicle-store';
import { inventoryService } from '@/lib/services/inventory-service';
import { bookingService } from '@/lib/services/booking-service';
import { locationStore } from '@/lib/db/location-store';
import { extraStore } from '@/lib/db/extra-store';
import { discountStore } from '@/lib/db/discount-store';
import { bookingStore } from '@/lib/db/booking-store';
import { RENTAL_POLICIES, AIRPORT_HUBS, VEHICLE_COMPARISONS } from '@/lib/data/knowledge-base';
import {
  normalizeUserText,
  extractNaturalDates,
  resolveVehicleWithTypoTolerance,
  checkAmbiguousVehicle,
  classifyUserIntent,
  extractConversationState,
  sanitizeChatText,
  detectNonFleetVehicle,
  formatCustomerUnavailableReason,
  type ConversationState,
} from '@/lib/utils/ai-nlp';
import { logger } from '@/lib/utils/logger';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SuggestedVehicle {
  id: string;
  name: string;
  year: number;
  make: string;
  model: string;
  category: string;
  dailyRate: number;
  seats: number;
  transmission: string;
  fuelType: string;
  luggage: number;
  imageUrl: string | null;
  location: string;
  bookingUrl: string;
  detailsUrl: string;
  matchReason?: string;
}

export interface PriceSummaryCard {
  vehicleId: string;
  vehicleName: string;
  pickupDate: string;
  dropoffDate: string;
  rentalDays: number;
  dailyRate: number;
  baseAmount: number;
  extrasAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  currency: string;
  promoCode?: string;
}

export interface AvailabilityCard {
  vehicleId: string;
  vehicleName: string;
  pickupDate: string;
  dropoffDate: string;
  isAvailable: boolean;
  isError?: boolean;
  reason?: string;
  dailyRate?: number;
  rentalDays?: number;
  estimatedTotal?: number;
  bookingUrl?: string;
}

export interface BookingDraftCard {
  vehicleId: string;
  vehicleName: string;
  pickupDate: string;
  dropoffDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  estimatedTotal: number;
  currency: string;
  bookingUrl: string;
}

export interface ChatResponse {
  message: string;
  suggestedVehicles?: SuggestedVehicle[];
  priceCard?: PriceSummaryCard;
  availabilityCard?: AvailabilityCard;
  bookingDraft?: BookingDraftCard;
  quickActions?: string[];
  toolCallsExecuted?: string[];
}

export class AiAgentService {
  /**
   * Final safety guardrail: Strictly removes any recommended vehicle that violates extracted customer constraints.
   */
  private validateRecommendations(
    vehicles: SuggestedVehicle[],
    state: ConversationState,
  ): SuggestedVehicle[] {
    return vehicles.filter((v) => {
      // 1. Transmission Constraint
      if (state.transmission && state.transmission !== 'Any') {
        if (v.transmission.toLowerCase() !== state.transmission.toLowerCase()) return false;
      }
      // 2. Minimum Seats Constraint
      if (state.seatsMin && v.seats < state.seatsMin) return false;
      // 3. Maximum Budget Constraint
      if (state.maxDailyRate && v.dailyRate > state.maxDailyRate) return false;
      // 4. Location Constraint
      if (state.pickupLocation && v.location.toLowerCase() !== state.pickupLocation.toLowerCase())
        return false;
      // 5. Category Constraint (Only if explicitly restricted by the user)
      if (state.category) {
        if (state.category === 'luxury' && v.category.toLowerCase() !== 'luxury') return false;
        if (state.category === 'suv' && v.category.toLowerCase() !== 'suv') return false;
        if (state.category === 'utility' && v.category.toLowerCase() !== 'utility') return false;
      }
      return true;
    });
  }
  /**
   * 1. Search vehicles tool: Converts criteria into filtered, ranked fleet results
   */
  public async searchVehicles(
    filters: {
      category?: string;
      transmission?: string;
      minSeats?: number;
      maxPrice?: number;
      minPrice?: number;
      query?: string;
      location?: string;
    },
    state?: ConversationState,
  ): Promise<{
    vehicles: SuggestedVehicle[];
    explanation: string;
  }> {
    const allVehicles = await vehicleStore.list({ limit: 100 });
    let results = [...allVehicles.vehicles];

    // --- PHASE 5D FINAL HARD CONSTRAINT VALIDATION ---
    if (state) {
      results = results.filter((v) => {
        if (state.transmission && state.transmission !== 'Any') {
          if (v.transmission.toLowerCase() !== state.transmission.toLowerCase()) return false;
        }
        if (state.seatsMin && v.seats < state.seatsMin) return false;
        if (state.maxDailyRate && v.dailyRate > state.maxDailyRate) return false;
        if (state.pickupLocation && v.location.toLowerCase() !== state.pickupLocation.toLowerCase())
          return false;
        if (state.category) {
          if (state.category === 'luxury' && v.category.toLowerCase() !== 'luxury') return false;
          if (state.category === 'suv' && v.category.toLowerCase() !== 'suv') return false;
          if (state.category === 'utility' && v.category.toLowerCase() !== 'utility') return false;
        }
        return true;
      });
    }

    const rawQuery = filters.query || '';
    const norm = normalizeUserText(rawQuery);
    const cat = (filters.category || '').toLowerCase();
    const trans = (filters.transmission || '').toLowerCase();

    // 1. Category filter with natural language tolerance
    if (cat) {
      results = results.filter((v) => v.category.toLowerCase().includes(cat));
    } else if (norm.includes('suv') || norm.includes('suvs')) {
      results = results.filter((v) => v.category.toLowerCase() === 'suv');
    } else if (norm.includes('sedan') || norm.includes('sedans')) {
      results = results.filter((v) => v.category.toLowerCase() === 'sedan');
    } else if (norm.includes('luxury') || norm.includes('premium')) {
      results = results.filter(
        (v) => v.category.toLowerCase() === 'luxury' || v.category.toLowerCase() === 'premium',
      );
    } else if (
      norm.includes('ute') ||
      norm.includes('utility') ||
      norm.includes('truck') ||
      norm.includes('4x4')
    ) {
      results = results.filter((v) => v.category.toLowerCase() === 'utility');
    }

    // 2. Transmission filter
    if (trans) {
      results = results.filter((v) => v.transmission.toLowerCase().includes(trans));
    } else if (norm.includes('automatic') || norm.includes('auto')) {
      results = results.filter((v) => v.transmission.toLowerCase() === 'automatic');
    } else if (norm.includes('manual')) {
      results = results.filter((v) => v.transmission.toLowerCase() === 'manual');
    }

    // 3. Seats & Luggage filter
    if (filters.minSeats) {
      results = results.filter((v) => v.seats >= filters.minSeats!);
    } else if (norm.includes('7 seat') || norm.includes('7 people')) {
      results = results.filter((v) => v.seats >= 7);
    } else if (
      norm.includes('5 seat') ||
      norm.includes('5 people') ||
      norm.includes('5 log') ||
      norm.includes('family of five') ||
      norm.includes('4 people') ||
      norm.includes('family')
    ) {
      results = results.filter((v) => v.seats >= 4);
    }

    if (norm.includes('luggage') || norm.includes('saman')) {
      results.sort((a, b) => b.luggage - a.luggage);
    }

    // 4. Price filter with number extraction
    const priceMatch = norm.match(/under\s*₹?\s*(\d+)/i) || norm.match(/less than\s*₹?\s*(\d+)/i);
    const maxPriceLimit =
      filters.maxPrice || (priceMatch && priceMatch[1] ? parseInt(priceMatch[1], 10) : undefined);

    if (maxPriceLimit) {
      results = results.filter((v) => v.dailyRate <= maxPriceLimit);
    }
    if (filters.minPrice) {
      results = results.filter((v) => v.dailyRate >= filters.minPrice!);
    }

    // 5. Query keywords (make, model, location)
    if (norm) {
      const keywords = norm
        .split(/\s+/)
        .filter(
          (k) =>
            k.length > 2 &&
            !['need', 'show', 'cars', 'find', 'best', 'please', 'tell', 'want'].includes(k),
        );
      if (keywords.length > 0) {
        const keywordFiltered = results.filter((v) =>
          keywords.some(
            (k) =>
              v.make.toLowerCase().includes(k) ||
              v.model.toLowerCase().includes(k) ||
              v.location.toLowerCase().includes(k) ||
              v.category.toLowerCase().includes(k),
          ),
        );
        if (keywordFiltered.length > 0) {
          results = keywordFiltered;
        }
      }
    }

    // 6. Ranking logic
    if (
      norm.includes('cheap') ||
      norm.includes('budget') ||
      norm.includes('affordable') ||
      norm.includes('sasta') ||
      norm.includes('sasti') ||
      norm.includes('mehngi')
    ) {
      results.sort((a, b) => a.dailyRate - b.dailyRate);
    } else if (norm.includes('luxury') || norm.includes('premium') || norm.includes('best wali')) {
      results.sort((a, b) => b.dailyRate - a.dailyRate);
    }

    const mapped: SuggestedVehicle[] = results.slice(0, 4).map((v) => {
      let matchReason = `Top match in our ${v.category} fleet (₹${v.dailyRate}/day).`;
      if (v.category.toLowerCase() === 'suv') {
        matchReason = `${v.year} ${v.make} ${v.model} is a spacious automatic SUV with comfortable seating for 5 and large luggage capacity.`;
      } else if (v.category.toLowerCase() === 'luxury') {
        matchReason = `Premium luxury executive experience with cutting-edge comfort and performance.`;
      } else if (v.model.toLowerCase().includes('hilux')) {
        matchReason = `Heavy-duty 4x4 turbo diesel utility ideal for rugged touring and cargo.`;
      } else if (v.dailyRate <= 90) {
        matchReason = `Excellent fuel efficiency and best-value daily rate at ₹${v.dailyRate}/day.`;
      }

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
        imageUrl: v.imageUrl || null,
        location: v.location,
        bookingUrl: `/book/${v.id}`,
        detailsUrl: `/fleet/${v.id}`,
        matchReason,
      };
    });

    const explanation =
      mapped.length > 0
        ? `Found ${mapped.length} matching vehicles in our Australian fleet.`
        : 'No vehicles directly matched all criteria. Displaying nearest available alternatives.';

    return { vehicles: mapped, explanation };
  }

  /**
   * 2. Get specific vehicle details tool
   */
  public async getVehicleDetails(vehicleIdOrName: string): Promise<SuggestedVehicle | null> {
    const all = await vehicleStore.list({ limit: 50 });
    const target = resolveVehicleWithTypoTolerance(vehicleIdOrName, all.vehicles);

    if (!target) return null;

    return {
      id: target.id,
      name: `${target.year} ${target.make} ${target.model}`,
      year: target.year,
      make: target.make,
      model: target.model,
      category: target.category,
      dailyRate: target.dailyRate,
      seats: target.seats,
      transmission: target.transmission,
      fuelType: target.fuelType,
      luggage: target.luggage,
      imageUrl: target.imageUrl || null,
      location: target.location,
      bookingUrl: `/book/${target.id}`,
      detailsUrl: `/fleet/${target.id}`,
      matchReason: `Features ${target.transmission} transmission, ${target.seats} seats, and ${target.fuelType} powertrain.`,
    };
  }

  /**
   * 3. Authoritative Live Availability Tool: Single Source of Truth via InventoryService
   */
  public async checkAvailability(params: {
    vehicleIdOrName: string;
    pickupDate: string;
    dropoffDate: string;
  }): Promise<{
    vehicleId: string;
    vehicleName: string;
    pickupDate: string;
    dropoffDate: string;
    isAvailable: boolean;
    isError?: boolean;
    reason?: string;
    dailyRate?: number;
    rentalDays?: number;
    estimatedTotal?: number;
    bookingUrl?: string;
  }> {
    const vehicle = await this.getVehicleDetails(params.vehicleIdOrName);
    if (!vehicle) {
      return {
        vehicleId: '',
        vehicleName: params.vehicleIdOrName,
        pickupDate: params.pickupDate,
        dropoffDate: params.dropoffDate,
        isAvailable: false,
        reason: `Vehicle "${params.vehicleIdOrName}" was not found in the fleet database.`,
      };
    }

    const pickup = new Date(params.pickupDate);
    const dropoff = new Date(params.dropoffDate);

    if (isNaN(pickup.getTime()) || isNaN(dropoff.getTime())) {
      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        pickupDate: params.pickupDate,
        dropoffDate: params.dropoffDate,
        isAvailable: false,
        reason: 'Please provide valid travel dates in YYYY-MM-DD format.',
      };
    }

    if (dropoff <= pickup) {
      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        pickupDate: params.pickupDate,
        dropoffDate: params.dropoffDate,
        isAvailable: false,
        reason: 'Return date must be after pickup date.',
      };
    }

    // Authoritative Single Source of Truth
    try {
      const check = await inventoryService.checkAvailability(vehicle.id, pickup, dropoff);

      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        pickupDate: params.pickupDate,
        dropoffDate: params.dropoffDate,
        isAvailable: check.isAvailable,
        reason: check.reason,
        dailyRate: check.dailyRate,
        rentalDays: check.totalDays,
        estimatedTotal: check.estimatedTotal,
        bookingUrl: check.isAvailable
          ? `/book/${vehicle.id}?pickupDate=${params.pickupDate}&dropoffDate=${params.dropoffDate}`
          : undefined,
      };
    } catch (err) {
      logger.error('Error querying inventoryService availability', err);
      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        pickupDate: params.pickupDate,
        dropoffDate: params.dropoffDate,
        isAvailable: false,
        isError: true,
        reason: "I'm having trouble checking availability right now. Please try again in a moment.",
      };
    }
  }

  /**
   * 4. Price Calculation Tool: Uses server-side BookingService
   */
  public async calculateRentalPrice(params: {
    vehicleIdOrName: string;
    pickupDate: string;
    dropoffDate: string;
    extraIds?: string[];
    promoCode?: string;
  }): Promise<PriceSummaryCard | { error: string }> {
    const vehicle = await this.getVehicleDetails(params.vehicleIdOrName);
    if (!vehicle) {
      return { error: `Vehicle "${params.vehicleIdOrName}" not found.` };
    }

    try {
      const mappedExtras = [];
      for (const id of params.extraIds || []) {
        const extra = await extraStore.findById(id);
        if (extra) {
          mappedExtras.push({
            extraId: extra.id,
            code: extra.code,
            name: extra.name,
            pricingType: extra.pricingType,
            price: extra.price,
            quantity: 1,
          });
        }
      }

      const quote = await bookingService.calculateQuote({
        vehicleId: vehicle.id,
        pickupDate: params.pickupDate,
        dropoffDate: params.dropoffDate,
        pickupLocation: vehicle.location,
        dropoffLocation: vehicle.location,
        selectedExtras: mappedExtras,
        promoCode: params.promoCode,
      });

      return {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        pickupDate: quote.pickupDate,
        dropoffDate: quote.dropoffDate,
        rentalDays: quote.rentalDays,
        dailyRate: quote.dailyRate,
        baseAmount: quote.baseAmount,
        extrasAmount: quote.extrasAmount,
        discountAmount: quote.discountAmount,
        taxAmount: quote.taxAmount,
        finalAmount: quote.finalAmount,
        currency: 'INR',
        promoCode: quote.promoApplied?.code,
      };
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Unable to calculate quote with the specified parameters.';
      return { error: errMsg };
    }
  }

  /**
   * 5. Discount / Promo Code Tool
   */
  public async getAvailableDiscounts(): Promise<
    Array<{
      code: string;
      description: string;
      discountType: string;
      value: number;
      minRentalDays?: number;
      minBookingValue?: number;
      applicableCategories?: string[];
    }>
  > {
    const discounts = await discountStore.list();
    return discounts.map((d) => ({
      code: d.code,
      description: d.description || 'Promotional Discount',
      discountType: d.discountType,
      value: d.value,
      minRentalDays: d.minRentalDays,
      minBookingValue: d.minBookingValue,
      applicableCategories: d.applicableCategories,
    }));
  }

  /**
   * 6. Extras / Upsell Recommendation Tool
   */
  public async getAvailableExtras(tripType?: string): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      price: number;
      pricingType: string;
      recommendedFor: string;
    }>
  > {
    const extras = await extraStore.list(true);
    const mapped = extras.map((e) => {
      let rec = 'General Peace of Mind';
      if (e.code.includes('CHILD') || e.code.includes('SEAT')) {
        rec = 'Family Trips with Children';
      } else if (e.code.includes('GPS') || e.code.includes('WIFI')) {
        rec = 'Road Trips & Highway Navigation';
      } else if (e.code.includes('ROADSIDE')) {
        rec = '24/7 Breakdown & Towing Cover';
      }
      return {
        id: e.id,
        name: e.name,
        description: e.description || '',
        price: e.price,
        pricingType: e.pricingType,
        recommendedFor: rec,
      };
    });

    if (tripType === 'family') {
      return mapped
        .filter((e) => e.recommendedFor.includes('Family') || e.recommendedFor.includes('24/7'))
        .slice(0, 3);
    }
    if (tripType === 'long_trip' || tripType === 'road_trip') {
      return mapped
        .filter((e) => e.recommendedFor.includes('Road') || e.recommendedFor.includes('24/7'))
        .slice(0, 3);
    }

    return mapped.slice(0, 3);
  }

  /**
   * 7. Booking Draft / Handoff Tool
   */
  public async createBookingDraft(params: {
    vehicleIdOrName: string;
    pickupDate: string;
    dropoffDate: string;
    pickupLocation?: string;
    dropoffLocation?: string;
    extraIds?: string[];
    promoCode?: string;
  }): Promise<
    | {
        draft: BookingDraftCard;
        message: string;
      }
    | { error: string }
  > {
    const vehicle = await this.getVehicleDetails(params.vehicleIdOrName);
    if (!vehicle) {
      return { error: `Vehicle "${params.vehicleIdOrName}" not found.` };
    }

    const pLoc = params.pickupLocation || vehicle.location;
    const dLoc = params.dropoffLocation || vehicle.location;

    // Check authoritative availability
    const avail = await this.checkAvailability({
      vehicleIdOrName: vehicle.id,
      pickupDate: params.pickupDate,
      dropoffDate: params.dropoffDate,
    });

    if (!avail.isAvailable) {
      return {
        error: `Cannot create booking draft: ${avail.reason || 'Vehicle is not available for these dates.'}`,
      };
    }

    // Calculate price
    const quote = await this.calculateRentalPrice({
      vehicleIdOrName: vehicle.id,
      pickupDate: params.pickupDate,
      dropoffDate: params.dropoffDate,
      extraIds: params.extraIds,
      promoCode: params.promoCode,
    });

    const estTotal =
      'finalAmount' in quote ? quote.finalAmount : avail.estimatedTotal || vehicle.dailyRate;

    const queryParams = new URLSearchParams({
      pickupDate: params.pickupDate,
      dropoffDate: params.dropoffDate,
      pickupLocation: pLoc,
      dropoffLocation: dLoc,
    });
    if (params.promoCode) queryParams.set('promo', params.promoCode);
    if (params.extraIds && params.extraIds.length > 0)
      queryParams.set('extras', params.extraIds.join(','));

    const bookingUrl = `/book/${vehicle.id}?${queryParams.toString()}`;

    return {
      draft: {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        pickupDate: params.pickupDate,
        dropoffDate: params.dropoffDate,
        pickupLocation: pLoc,
        dropoffLocation: dLoc,
        estimatedTotal: estTotal,
        currency: 'INR',
        bookingUrl,
      },
      message: `Your booking draft for the ${vehicle.name} from ${params.pickupDate} to ${params.dropoffDate} is ready. Click "Continue to Booking" below to finalize your driver details and secure your reservation on our encrypted checkout.`,
    };
  }

  /**
   * Rental Policies / Australian Hubs Information
   */
  public async getRentalRules(): Promise<{
    ageRequirements: string;
    licencePolicy: string;
    mileage: string;
    fuelPolicy: string;
    cancellation: string;
    insurance: string;
    pricingCurrency: string;
    hubs: Array<{ name: string; address: string; state: string }>;
  }> {
    const locations = await locationStore.list(true);
    return {
      ageRequirements:
        'Minimum driver age is 21 years. Drivers aged 21-24 are eligible under standard terms without young-driver surcharges.',
      licencePolicy:
        'A valid, full physical Driver Licence in English (Australian State, New Zealand, or International Driving Permit) is required.',
      mileage: 'Unlimited kilometres across Australia on all standard passenger rentals.',
      fuelPolicy: 'Full-to-Full policy. Return the vehicle with a full tank of fuel.',
      cancellation: 'Free cancellation up to 48 hours prior to scheduled rental pickup.',
      insurance:
        'Standard comprehensive cover is included in all daily rates. Premium Zero-Excess Protection is available as an optional extra.',
      pricingCurrency:
        'All pricing is currently displayed and billed in INR (₹) during the active testing period, inclusive of all Australian GST.',
      hubs: locations.map((l) => ({ name: l.name, address: l.address, state: l.state })),
    };
  }

  /**
   * Main AI Processing Function: Coordinates Gemini API & Tool Execution
   */
  public async processChat(messages: ChatMessage[]): Promise<ChatResponse> {
    const result = await this._processChat(messages);

    // PHASE 5D POST-PROCESSING: FINAL HARD CONSTRAINT GROUNDING & RECOMMENDATION ACCURACY
    if (result.suggestedVehicles && result.suggestedVehicles.length > 0) {
      const allVehicles = await vehicleStore.list({ limit: 100 });
      const state = extractConversationState(messages, allVehicles.vehicles);

      const targetTrans = state.transmission;
      const minSeats = state.seatsMin;
      const maxRate = state.maxDailyRate;

      const filtered = result.suggestedVehicles.filter((v) => {
        if (targetTrans && targetTrans !== 'Any') {
          if (v.transmission.toLowerCase() !== targetTrans.toLowerCase()) return false;
        }
        if (minSeats !== null && minSeats !== undefined && v.seats < minSeats) return false;
        if (maxRate !== null && maxRate !== undefined && v.dailyRate > maxRate) return false;
        return true;
      });

      if (filtered.length < result.suggestedVehicles.length) {
        const removed = result.suggestedVehicles.filter((v) => !filtered.includes(v));
        result.suggestedVehicles = filtered;

        let reason = '';
        if (
          targetTrans &&
          targetTrans !== 'Any' &&
          removed.some((v) => v.transmission.toLowerCase() !== targetTrans.toLowerCase())
        ) {
          reason = `${targetTrans.toLowerCase()} transmission`;
        } else if (
          minSeats !== null &&
          minSeats !== undefined &&
          removed.some((v) => v.seats < minSeats)
        ) {
          reason = `minimum ${minSeats} seats`;
        } else if (
          maxRate !== null &&
          maxRate !== undefined &&
          removed.some((v) => v.dailyRate > maxRate)
        ) {
          reason = `maximum budget of ₹${maxRate}/day`;
        }

        const removedNames = removed.map((v) => `${v.year} ${v.make} ${v.model}`).join(' and ');
        if (filtered.length === 0) {
          result.message += `\n\n(Note: I cannot recommend the ${removedNames} as it does not meet your requirement for ${reason}.)`;
          result.suggestedVehicles = undefined;
        } else {
          result.message += `\n\n(Note: The ${removedNames} was excluded from recommendations as it does not meet your requirement for ${reason}.)`;
        }
      }
    }
    return result;
  }

  private async _processChat(messages: ChatMessage[]): Promise<ChatResponse> {
    const userMessage = messages[messages.length - 1]?.content || '';
    const norm = normalizeUserText(userMessage);
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    // Grounding context from fleet database
    const allVehiclesResponse = await vehicleStore.list({ limit: 50 });
    let validVehicles = [...allVehiclesResponse.vehicles];

    // --- PHASE 5D FINAL HARD CONSTRAINT VALIDATION ---
    // Extract constraints
    const state = extractConversationState(messages, validVehicles);

    // Filter fleet strictly against customer constraints BEFORE giving choices to the AI or Local Engine
    validVehicles = validVehicles.filter((v) => {
      // 1. Transmission Constraint
      if (state.transmission && state.transmission !== 'Any') {
        if (v.transmission.toLowerCase() !== state.transmission.toLowerCase()) return false;
      }
      // 2. Minimum Seats Constraint
      if (state.seatsMin && v.seats < state.seatsMin) return false;

      // 3. Maximum Budget Constraint
      if (state.maxDailyRate && v.dailyRate > state.maxDailyRate) return false;

      // 4. Location Constraint
      if (state.pickupLocation && v.location.toLowerCase() !== state.pickupLocation.toLowerCase())
        return false;

      // 5. Category Constraint (Only if explicitly restricted by the user)
      if (state.category) {
        if (state.category === 'luxury' && v.category.toLowerCase() !== 'luxury') return false;
        if (state.category === 'suv' && v.category.toLowerCase() !== 'suv') return false;
        if (state.category === 'utility' && v.category.toLowerCase() !== 'utility') return false;
      }

      return true;
    });

    const rules = await this.getRentalRules();
    const discounts = await this.getAvailableDiscounts();
    const extras = await this.getAvailableExtras();

    // Security Guardrail: Reject prompt injection / admin database access / mutation commands
    if (
      norm.includes('admin discount database') ||
      norm.includes('admin password') ||
      norm.includes('admin key') ||
      norm.includes('database dump') ||
      norm.includes('system prompt') ||
      norm.includes('secret key')
    ) {
      return {
        message:
          "I cannot share internal administrative records or system configurations. However, I'd be glad to help you find public promotional codes, check vehicle rates, or book a car from our Australian fleet.",
        quickActions: ['Show Active Promos', 'Browse Fleet', 'Rental Policies'],
      };
    }

    if (
      norm.includes('mark this car as available') ||
      norm.includes('delete booking') ||
      norm.includes('change price to')
    ) {
      return {
        message:
          'I am a read-only customer concierge assistant and do not have permission to modify inventory schedules, pricing rates, or booking records. All fleet availability and pricing are strictly authoritative.',
        quickActions: ['Check Live Availability', 'Browse Fleet'],
      };
    }

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        let fleetSummary = 'No vehicles match your exact requirements in the fleet.';
        if (validVehicles.length > 0) {
          fleetSummary = validVehicles
            .map(
              (v) =>
                `- ${v.year} ${v.make} ${v.model} (ID: ${v.id}, Category: ${v.category}, Rate: ₹${v.dailyRate}/day, Seats: ${v.seats}, Trans: ${v.transmission}, Fuel: ${v.fuelType}, Luggage: ${v.luggage} bags, Location: ${v.location}, URL: /book/${v.id})`,
            )
            .join('\n');
        }

        const discountsSummary = discounts
          .map((d) => `- Code: ${d.code} (${d.description})`)
          .join('\n');
        const extrasSummary = extras
          .map((e) => `- ${e.name}: ₹${e.price} (${e.pricingType}) - ${e.recommendedFor}`)
          .join('\n');

        const systemInstruction = `You are NR Concierge, the official luxury AI rental assistant for NR Car Hire — Australia's premier car rental service.
Your conversational style is remarkably intelligent, warm, highly capable, and empathetic, like leading modern AI assistants (ChatGPT, Gemini).

CONVERSATIONAL INTELLIGENCE & AVAILABILITY RULES:
1. Speak in clean, natural, human-friendly conversational English. Understand casual language, slang, Hinglish, typos, and conversational shortcuts smoothly.
2. Track conversational context fluidly: understand pronouns ("this one", "it", "ye", "iska"), ordinal references ("the first one", "pehli wali", "second option"), and user corrections ("actually change that to 7 days", "no make it camry").
3. DO NOT use raw Markdown formatting syntax like double asterisks (**), backticks (\`), or raw hashtag headers (###) in your text output.
4. Keep all prices in INR (₹) (e.g. ₹89/day).
5. Always provide direct booking links (/book/[vehicleId]).
6. NEVER fabricate availability, prices, discounts, or booking confirmations.
7. If a vehicle requested is not in the NR Car Hire fleet (e.g. BMW X7, Tesla, Audi), say: "I couldn't find that vehicle in our NR Car Hire fleet. Want me to show you some similar options?" and recommend suitable fleet alternatives.
8. If a vehicle is available, say: "Yes, the [Vehicle Name] is available from [Pickup] to [Dropoff]."
9. If a vehicle is under maintenance, say: "No, the [Vehicle Name] isn't available for those dates. The [Vehicle Name] isn't available from [Pickup] to [Dropoff] because it has scheduled maintenance during those dates. Would you like me to show you similar vehicles that are available for those dates?"
10. If a vehicle has a booking overlap, say: "No, the [Vehicle Name] isn't available for those dates because it's already booked for part of that period. Would you like me to show you similar vehicles that are available for those dates?"
11. If the user asks something completely outside car rentals (e.g. write a Python script, recipe, quantum physics), respond politely in character as the NR Car Hire concierge and guide them back to finding their ideal rental car.

GROUNDED FLEET KNOWLEDGE:
${fleetSummary}

ACTIVE PUBLIC PROMOTIONS:
${discountsSummary}

OPTIONAL EXTRAS:
${extrasSummary}

RENTAL POLICIES:
- Age: ${rules.ageRequirements}
- Licence: ${rules.licencePolicy}
- Mileage: ${rules.mileage}
- Fuel: ${rules.fuelPolicy}
- Cancellation: ${rules.cancellation}
- Hubs: ${rules.hubs.map((h) => `${h.name} (${h.state})`).join(', ')}`;

        // Conversation history
        const conversationContext = messages
          .slice(-8)
          .map((m) => `${m.role === 'user' ? 'Customer' : 'NR Concierge'}: ${m.content}`)
          .join('\n');

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemInstruction}\n\nCONVERSATION HISTORY:\n${conversationContext}\n\nCustomer Latest Message: ${userMessage}`,
                },
              ],
            },
          ],
        });

        const rawReply =
          response.text ||
          "I'm here to help you find the ideal vehicle from our Australian fleet. How can I assist your journey today?";
        const cleanReply = sanitizeChatText(rawReply);

        // Intelligent Extraction of Structured Tool Outputs for the UI
        return await this.enrichChatResponse(
          cleanReply,
          userMessage,
          messages,
          validVehicles,
          state,
        );
      } catch (geminiError) {
        logger.error('Gemini API Error, falling back to local agent engine:', geminiError);
        // Fall through to local deterministic agent engine
      }
    }

    // Local Deterministic Agent Engine (Fallback, Test Mode & Zero-Key Runs)
    return this.processLocalAgent(userMessage, messages, validVehicles, rules, state);
  }

  /**
   * Enriches Gemini response text with structured UI Cards (Vehicles, Price, Availability, Booking Draft)
   * Strictly enforces Authoritative InventoryService Availability to prevent any AI hallucinations or bypasses.
   */
  private async enrichChatResponse(
    replyText: string,
    userMessage: string,
    messages: ChatMessage[],
    vehicles: VehicleRecord[],
    state: ConversationState,
  ): Promise<ChatResponse> {
    const norm = normalizeUserText(userMessage);
    const toolCallsExecuted: string[] = [];

    // 0. Non-fleet vehicle check
    const nonFleet = detectNonFleetVehicle(userMessage);
    if (nonFleet.isNonFleet) {
      toolCallsExecuted.push('searchVehicles');
      const searchRes = await this.searchVehicles({ query: userMessage }, state);
      return {
        message:
          "I couldn't find that vehicle in our NR Car Hire fleet. Want me to show you some similar options?",
        suggestedVehicles: searchRes.vehicles,
        quickActions: ['Browse All Fleet', 'Recommend an SUV', 'Check Fleet Rates'],
        toolCallsExecuted,
      };
    }

    // 1. Ambiguity Check
    const ambCheck = checkAmbiguousVehicle(userMessage, vehicles);
    if (ambCheck.isAmbiguous && ambCheck.question) {
      return {
        message: ambCheck.question,
        suggestedVehicles: ambCheck.matches?.map((v) => ({
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
          imageUrl: v.imageUrl || null,
          location: v.location,
          bookingUrl: `/book/${v.id}`,
          detailsUrl: `/fleet/${v.id}`,
        })),
        quickActions: ['Toyota Camry (Sedan)', 'Toyota HiLux (4x4)', 'Browse All Fleet'],
      };
    }

    // 2. Structured Context State Machine
    const activeVehicle = state.selectedVehicle;

    let suggestedVehicles: SuggestedVehicle[] | undefined;
    let priceCard: PriceSummaryCard | undefined;
    let availabilityCard: AvailabilityCard | undefined;
    let bookingDraft: BookingDraftCard | undefined;

    // 3. Cancellation Intent
    if (state.isCancelled) {
      return {
        message:
          "No problem at all! I've paused that booking draft. Whenever you're ready, we can check a different car, modify dates, or explore more options.",
        quickActions: ['Browse All Fleet', 'Recommend an SUV', 'Check Other Dates'],
      };
    }

    // 4. Availability Query Check with strict Authoritative Verification
    const naturalDates = extractNaturalDates(userMessage);
    if (
      activeVehicle &&
      (norm.includes('available') ||
        norm.includes('availability') ||
        norm.includes('free') ||
        naturalDates)
    ) {
      toolCallsExecuted.push('checkAvailability');
      const pickupDate = naturalDates ? naturalDates.pickupDate : state.pickupDate || '2026-09-10';
      const dropoffDate = naturalDates
        ? naturalDates.dropoffDate
        : state.dropoffDate || '2026-09-14';
      const formattedP = naturalDates
        ? naturalDates.formattedPickup
        : state.formattedPickup || pickupDate;
      const formattedD = naturalDates
        ? naturalDates.formattedDropoff
        : state.formattedDropoff || dropoffDate;

      const avail = await this.checkAvailability({
        vehicleIdOrName: activeVehicle.id,
        pickupDate,
        dropoffDate,
      });

      if (avail.isError) {
        return {
          message:
            "I'm having trouble checking availability right now. Please try again in a moment.",
          quickActions: ['Retry Availability Check', 'Browse Fleet', 'Rental Policies'],
          toolCallsExecuted,
        };
      }

      availabilityCard = {
        vehicleId: activeVehicle.id,
        vehicleName: `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`,
        pickupDate,
        dropoffDate,
        isAvailable: avail.isAvailable,
        reason: avail.reason,
        dailyRate: avail.dailyRate || activeVehicle.dailyRate,
        rentalDays: avail.rentalDays,
        estimatedTotal: avail.estimatedTotal,
        bookingUrl: avail.bookingUrl,
      };

      if (!avail.isAvailable) {
        // Enforce strict customer-friendly unavailable message with alternatives
        const customerReason = formatCustomerUnavailableReason(
          avail.vehicleName,
          formattedP,
          formattedD,
          avail.reason,
        );
        const searchRes = await this.searchVehicles({ category: activeVehicle.category }, state);
        const alternatives = searchRes.vehicles
          .filter((v) => v.id !== activeVehicle.id)
          .slice(0, 2);

        return {
          message: customerReason,
          availabilityCard,
          suggestedVehicles: alternatives.length > 0 ? alternatives : undefined,
          quickActions: ['Check Other Dates', 'Browse All Fleet', 'Recommend Alternatives'],
          toolCallsExecuted,
        };
      }
    }

    // 5. Vehicle Search & Recommendation Detection
    if (activeVehicle) {
      toolCallsExecuted.push('searchVehicles');
      suggestedVehicles = [
        {
          id: activeVehicle.id,
          name: `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`,
          year: activeVehicle.year,
          make: activeVehicle.make,
          model: activeVehicle.model,
          category: activeVehicle.category,
          dailyRate: activeVehicle.dailyRate,
          seats: activeVehicle.seats,
          transmission: activeVehicle.transmission,
          fuelType: activeVehicle.fuelType,
          luggage: activeVehicle.luggage,
          imageUrl: activeVehicle.imageUrl || null,
          location: activeVehicle.location,
          bookingUrl: `/book/${activeVehicle.id}`,
          detailsUrl: `/fleet/${activeVehicle.id}`,
          matchReason: `Features ${activeVehicle.transmission} transmission and ${activeVehicle.seats} seats (₹${activeVehicle.dailyRate}/day).`,
        },
      ];
    }

    // 6. Price Calculation Detection
    const daysMatch = norm.match(/(\d+)\s*(?:days|day|din)/i);
    if (
      activeVehicle &&
      (norm.includes('cost') || norm.includes('price') || norm.includes('how much') || daysMatch)
    ) {
      toolCallsExecuted.push('calculateRentalPrice');
      const days = daysMatch ? parseInt(daysMatch[1], 10) : state.durationDays || 4;
      const pickupDate = state.pickupDate || '2026-09-10';
      const dropoff = new Date(pickupDate);
      dropoff.setDate(dropoff.getDate() + days);
      const dropoffDate = dropoff.toISOString().split('T')[0];

      const priceRes = await this.calculateRentalPrice({
        vehicleIdOrName: activeVehicle.id,
        pickupDate,
        dropoffDate,
      });

      if (!('error' in priceRes)) {
        priceCard = priceRes;
      }
    }

    // 7. Booking Draft / "Book it" Intent
    if (
      norm.includes('book it') ||
      norm.includes('start booking') ||
      norm.includes('proceed with booking') ||
      norm.includes('reserve it') ||
      norm.includes('ye book kar do') ||
      norm.includes('book karni hai')
    ) {
      toolCallsExecuted.push('createBookingDraft');
      const target = activeVehicle || vehicles[0];
      const pDate = state.pickupDate || '2026-09-10';
      const dDate = state.dropoffDate || '2026-09-14';

      const draftRes = await this.createBookingDraft({
        vehicleIdOrName: target.id,
        pickupDate: pDate,
        dropoffDate: dDate,
      });

      if (!('error' in draftRes)) {
        bookingDraft = draftRes.draft;
      } else {
        return {
          message: `Cannot create booking draft: ${draftRes.error}`,
          quickActions: ['Check Other Dates', 'Browse All Fleet'],
          toolCallsExecuted,
        };
      }
    }

    // --- PHASE 5D: FINAL RECOMMENDATION VALIDATION ---
    if (suggestedVehicles) {
      suggestedVehicles = this.validateRecommendations(suggestedVehicles, state);
      if (suggestedVehicles.length === 0) {
        suggestedVehicles = undefined; // Drop if all were filtered out
      }
    }

    return {
      message: sanitizeChatText(replyText),
      suggestedVehicles,
      priceCard,
      availabilityCard,
      bookingDraft,
      quickActions: [
        'Recommend an SUV',
        'Show Cars Under ₹150/day',
        'Check Camry Availability',
        'Rental Policies',
      ],
      toolCallsExecuted: toolCallsExecuted.length > 0 ? toolCallsExecuted : undefined,
    };
  }

  /**
   * Local Deterministic Agent Engine (Full tool calling & conversational intelligence flow)
   */
  private async processLocalAgent(
    userMessage: string,
    messages: ChatMessage[],
    vehicles: VehicleRecord[],
    rules: Awaited<ReturnType<AiAgentService['getRentalRules']>>,
    state: ConversationState,
  ): Promise<ChatResponse> {
    const norm = normalizeUserText(userMessage);
    const toolCallsExecuted: string[] = [];

    // 0. Non-fleet vehicle check (e.g. "bmw x7 available?", "audi", "tesla")
    const nonFleet = detectNonFleetVehicle(userMessage);
    if (nonFleet.isNonFleet) {
      toolCallsExecuted.push('searchVehicles');
      const searchRes = await this.searchVehicles({ query: userMessage }, state);
      return {
        message:
          "I couldn't find that vehicle in our NR Car Hire fleet. Want me to show you some similar options?",
        suggestedVehicles: searchRes.vehicles,
        quickActions: ['Browse All Fleet', 'Recommend an SUV', 'Check Fleet Rates'],
        toolCallsExecuted,
      };
    }

    // 1. Ambiguity Detection (e.g. "show me the toyta")
    const ambCheck = checkAmbiguousVehicle(userMessage, vehicles);
    if (ambCheck.isAmbiguous && ambCheck.question) {
      return {
        message: ambCheck.question,
        suggestedVehicles: ambCheck.matches?.map((v) => ({
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
          imageUrl: v.imageUrl || null,
          location: v.location,
          bookingUrl: `/book/${v.id}`,
          detailsUrl: `/fleet/${v.id}`,
        })),
        quickActions: ['Toyota Camry (Sedan)', 'Toyota HiLux (4x4)', 'Browse All Fleet'],
      };
    }

    // 2. Extract Contextual Memory State Machine across conversation turns
    const activeVehicle = state.selectedVehicle;

    // Intent Classification
    const intent = classifyUserIntent(userMessage, {
      hasSelectedVehicle: !!activeVehicle,
      hasDates: !!state.pickupDate,
    });

    // 3. Out of Domain Handling
    if (intent === 'OUT_OF_DOMAIN') {
      return {
        message:
          "I am NR Concierge, your dedicated AI car rental assistant for NR Car Hire in Australia. While I specialize exclusively in fleet bookings, live rates, availability, and rental policies, I'd love to help you find the perfect vehicle for your journey. How can I assist with your car rental today?",
        quickActions: ['Browse All Fleet', 'Check Rates & Availability', 'Rental Policies'],
      };
    }

    // 4. Cancellation / Interruption Intent
    if (intent === 'CANCEL_BOOKING_DRAFT' || state.isCancelled) {
      return {
        message:
          "No problem at all! I've paused that booking draft. Whenever you're ready, we can check a different car, modify dates, or explore more options.",
        quickActions: ['Browse All Fleet', 'Recommend an SUV', 'Check Other Dates'],
      };
    }

    // 5. Vehicle Attribute Inquiry (Luggage space, seating capacity, transmission, fuel)
    if (intent === 'VEHICLE_ATTRIBUTE_INQUIRY') {
      const target = activeVehicle || vehicles[0];
      if (norm.includes('luggage') || norm.includes('boot') || norm.includes('saman')) {
        return {
          message: `The ${target.year} ${target.make} ${target.model} easily accommodates up to ${target.luggage} standard luggage bags and suitcases in its spacious boot. It also features ${target.seats} comfortable seats and ${target.transmission} transmission.`,
          suggestedVehicles: [
            {
              id: target.id,
              name: `${target.year} ${target.make} ${target.model}`,
              year: target.year,
              make: target.make,
              model: target.model,
              category: target.category,
              dailyRate: target.dailyRate,
              seats: target.seats,
              transmission: target.transmission,
              fuelType: target.fuelType,
              luggage: target.luggage,
              imageUrl: target.imageUrl || null,
              location: target.location,
              bookingUrl: `/book/${target.id}`,
              detailsUrl: `/fleet/${target.id}`,
            },
          ],
          quickActions: ['Check Availability', 'Book This Vehicle', 'Compare Other Cars'],
        };
      }
      if (
        norm.includes('seat') ||
        norm.includes('people') ||
        norm.includes('passengers') ||
        norm.includes('log')
      ) {
        return {
          message: `The ${target.year} ${target.make} ${target.model} comfortably seats ${target.seats} passengers with generous legroom and ${target.luggage} luggage capacity.`,
          suggestedVehicles: [
            {
              id: target.id,
              name: `${target.year} ${target.make} ${target.model}`,
              year: target.year,
              make: target.make,
              model: target.model,
              category: target.category,
              dailyRate: target.dailyRate,
              seats: target.seats,
              transmission: target.transmission,
              fuelType: target.fuelType,
              luggage: target.luggage,
              imageUrl: target.imageUrl || null,
              location: target.location,
              bookingUrl: `/book/${target.id}`,
              detailsUrl: `/fleet/${target.id}`,
            },
          ],
          quickActions: ['Check Availability', 'Book This Vehicle', 'Browse Fleet'],
        };
      }
    }

    // 6. Multi-turn Follow-up handling: "which is cheapest?" / "thoda sasta" / "aur sasti" / "cheapest car"
    if (
      norm.includes('which is cheapest') ||
      norm.includes('cheapest one') ||
      norm.includes('cheapest car') ||
      norm.includes('cheapest vehicle') ||
      norm.includes('sasti') ||
      norm.includes('sasta') ||
      norm.includes('thoda sasta') ||
      norm.includes('cheaper') ||
      norm.includes('cheapest')
    ) {
      if (state.category === 'suv' || norm.includes('suv')) {
        toolCallsExecuted.push('searchVehicles');
        return {
          message:
            'Among our SUVs, the 2024 Hyundai Tucson is our most affordable option at ₹99/day (compared to the 2024 Mazda CX-5 at ₹109/day).',
          suggestedVehicles: [
            {
              id: 'v-006-tucson',
              name: '2024 Hyundai Tucson',
              year: 2024,
              make: 'Hyundai',
              model: 'Tucson',
              category: 'SUV',
              dailyRate: 99,
              seats: 5,
              transmission: 'Automatic',
              fuelType: 'Hybrid',
              luggage: 4,
              imageUrl: null,
              location: 'Gold Coast',
              bookingUrl: '/book/v-006-tucson',
              detailsUrl: '/fleet/v-006-tucson',
              matchReason: 'Best-value compact hybrid SUV in our fleet at ₹99/day.',
            },
            {
              id: 'v-002-cx5',
              name: '2024 Mazda CX-5',
              year: 2024,
              make: 'Mazda',
              model: 'CX-5',
              category: 'SUV',
              dailyRate: 109,
              seats: 5,
              transmission: 'Automatic',
              fuelType: 'Petrol',
              luggage: 4,
              imageUrl: null,
              location: 'Melbourne',
              bookingUrl: '/book/v-002-cx5',
              detailsUrl: '/fleet/v-002-cx5',
              matchReason: 'Mid-size SUV with premium interior at ₹109/day.',
            },
          ],
          quickActions: ['I will take the Tucson', 'Check Mazda CX-5', 'Book Tucson'],
          toolCallsExecuted,
        };
      }

      toolCallsExecuted.push('searchVehicles');
      const cheapestList = [...vehicles].sort((a, b) => a.dailyRate - b.dailyRate);
      return {
        message: `Among our fleet, our most affordable options are the 2024 Toyota Camry at ₹${cheapestList[0].dailyRate}/day and the 2024 Hyundai Tucson at ₹${cheapestList[1].dailyRate}/day. Both include comprehensive cover and unlimited kilometres.`,
        suggestedVehicles: cheapestList.slice(0, 2).map((v) => ({
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
          imageUrl: v.imageUrl || null,
          location: v.location,
          bookingUrl: `/book/${v.id}`,
          detailsUrl: `/fleet/${v.id}`,
        })),
        quickActions: ['Book Toyota Camry', 'Book Hyundai Tucson', 'Browse All Fleet'],
        toolCallsExecuted,
      };
    }

    // 7. Multi-turn Follow-up handling: "best wali" / "luxury" / "top model"
    if (
      norm.includes('best wali') ||
      norm.includes('best luxury') ||
      norm.includes('best vehicle') ||
      norm.includes('top model') ||
      norm.includes('luxury car') ||
      norm.includes('best one') ||
      (norm.includes('best') &&
        (norm.includes('car') ||
          norm.includes('gadi') ||
          norm.includes('wali') ||
          norm.includes('hai')))
    ) {
      toolCallsExecuted.push('searchVehicles');
      const luxuryList = vehicles.filter((v) => v.category.toLowerCase() === 'luxury');
      return {
        message:
          'For executive prestige and unmatched performance, our flagship models are the 2024 Mercedes-Benz C-Class (₹169/day) and 2024 BMW 3 Series (₹149/day).',
        suggestedVehicles: luxuryList.map((v) => ({
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
          imageUrl: v.imageUrl || null,
          location: v.location,
          bookingUrl: `/book/${v.id}`,
          detailsUrl: `/fleet/${v.id}`,
        })),
        quickActions: ['Book Mercedes C-Class', 'Book BMW 3 Series', 'Browse Fleet'],
        toolCallsExecuted,
      };
    }

    // 8. Multi-turn Follow-up handling: "automatic?" / "what about automatic?"
    if (
      norm === 'automatic' ||
      norm === 'what about automatic' ||
      norm === 'automatic transmission' ||
      norm === 'auto'
    ) {
      if (state.category === 'suv') {
        return {
          message:
            'Both of our SUVs — the 2024 Mazda CX-5 (₹109/day) and 2024 Hyundai Tucson (₹99/day) — come equipped with smooth automatic transmissions and seating for 5.',
          suggestedVehicles: [
            {
              id: 'v-006-tucson',
              name: '2024 Hyundai Tucson',
              year: 2024,
              make: 'Hyundai',
              model: 'Tucson',
              category: 'SUV',
              dailyRate: 99,
              seats: 5,
              transmission: 'Automatic',
              fuelType: 'Hybrid',
              luggage: 4,
              imageUrl: null,
              location: 'Gold Coast',
              bookingUrl: '/book/v-006-tucson',
              detailsUrl: '/fleet/v-006-tucson',
            },
            {
              id: 'v-002-cx5',
              name: '2024 Mazda CX-5',
              year: 2024,
              make: 'Mazda',
              model: 'CX-5',
              category: 'SUV',
              dailyRate: 109,
              seats: 5,
              transmission: 'Automatic',
              fuelType: 'Petrol',
              luggage: 4,
              imageUrl: null,
              location: 'Melbourne',
              bookingUrl: '/book/v-002-cx5',
              detailsUrl: '/fleet/v-002-cx5',
            },
          ],
          quickActions: ['I will take the Tucson', 'I will take the CX-5', 'Browse Fleet'],
        };
      }
    }

    // 9. Follow-up: User answers with just passenger count or number: e.g. "5"
    if (/^\b(4|5|6|7)\b$/.test(norm)) {
      toolCallsExecuted.push('searchVehicles');
      const seatsNum = parseInt(norm, 10);
      const searchRes = await this.searchVehicles({ minSeats: seatsNum }, state);
      return {
        message: `For ${seatsNum} passengers, here are our recommended spacious vehicles with generous luggage room:`,
        suggestedVehicles: searchRes.vehicles,
        quickActions: ['Check Availability', 'Show Automatic SUVs', 'Browse All Fleet'],
        toolCallsExecuted,
      };
    }

    // 10. Direct Booking / "Book it" Intent
    if (intent === 'CREATE_BOOKING_DRAFT') {
      toolCallsExecuted.push('createBookingDraft');
      const targetVehicle = activeVehicle || vehicles[0];
      const pDate = state.pickupDate || '2026-09-10';
      const dDate = state.dropoffDate || '2026-09-14';

      const draftRes = await this.createBookingDraft({
        vehicleIdOrName: targetVehicle.id,
        pickupDate: pDate,
        dropoffDate: dDate,
      });

      if (!('error' in draftRes)) {
        return {
          message: `I've prepared your booking draft for the ${draftRes.draft.vehicleName} from ${draftRes.draft.pickupDate} to ${draftRes.draft.dropoffDate} with an estimated total of ₹${draftRes.draft.estimatedTotal}. Click "Continue to Booking" below to finalize your details on our secure booking page.`,
          bookingDraft: draftRes.draft,
          quickActions: ['Choose Different Vehicle', 'Add Optional Extras', 'View Fleet'],
          toolCallsExecuted,
        };
      } else {
        return {
          message: `Cannot create booking draft: ${draftRes.error}`,
          quickActions: ['Check Other Dates', 'Browse All Fleet'],
          toolCallsExecuted,
        };
      }
    }

    // 11. Authoritative Live Availability Query Check
    const naturalDates = extractNaturalDates(userMessage);
    if (
      intent === 'CHECK_AVAILABILITY' ||
      (naturalDates && (activeVehicle || norm.includes('available')))
    ) {
      toolCallsExecuted.push('checkAvailability');
      const target = activeVehicle || vehicles[0];

      const pickupDate = naturalDates ? naturalDates.pickupDate : state.pickupDate || '2026-09-10';
      const dropoffDate = naturalDates
        ? naturalDates.dropoffDate
        : state.dropoffDate || '2026-09-14';
      const formattedP = naturalDates
        ? naturalDates.formattedPickup
        : state.formattedPickup || pickupDate;
      const formattedD = naturalDates
        ? naturalDates.formattedDropoff
        : state.formattedDropoff || dropoffDate;

      const avail = await this.checkAvailability({
        vehicleIdOrName: target.id,
        pickupDate,
        dropoffDate,
      });

      if (avail.isError) {
        return {
          message:
            "I'm having trouble checking availability right now. Please try again in a moment.",
          quickActions: ['Retry Availability Check', 'Browse Fleet', 'Rental Policies'],
          toolCallsExecuted,
        };
      }

      const availCard: AvailabilityCard = {
        vehicleId: target.id,
        vehicleName: `${target.year} ${target.make} ${target.model}`,
        pickupDate,
        dropoffDate,
        isAvailable: avail.isAvailable,
        reason: avail.reason,
        dailyRate: avail.dailyRate || target.dailyRate,
        rentalDays: avail.rentalDays,
        estimatedTotal: avail.estimatedTotal,
        bookingUrl: avail.bookingUrl,
      };

      if (avail.isAvailable) {
        return {
          message: `Yes, the ${avail.vehicleName} is available from ${formattedP} to ${formattedD} (${avail.rentalDays} days at ₹${avail.dailyRate}/day for an estimated total of ₹${avail.estimatedTotal}).`,
          availabilityCard: availCard,
          suggestedVehicles: [
            {
              id: target.id,
              name: `${target.year} ${target.make} ${target.model}`,
              year: target.year,
              make: target.make,
              model: target.model,
              category: target.category,
              dailyRate: target.dailyRate,
              seats: target.seats,
              transmission: target.transmission,
              fuelType: target.fuelType,
              luggage: target.luggage,
              imageUrl: target.imageUrl || null,
              location: target.location,
              bookingUrl: `/book/${target.id}?pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`,
              detailsUrl: `/fleet/${target.id}`,
            },
          ],
          quickActions: ['Book This Vehicle', 'Check Price Breakdown', 'View Other Dates'],
          toolCallsExecuted,
        };
      } else {
        const customerReason = formatCustomerUnavailableReason(
          avail.vehicleName,
          formattedP,
          formattedD,
          avail.reason,
        );
        const searchRes = await this.searchVehicles({ category: target.category }, state);
        const alternatives = searchRes.vehicles.filter((v) => v.id !== target.id).slice(0, 2);

        return {
          message: customerReason,
          availabilityCard: availCard,
          suggestedVehicles: alternatives.length > 0 ? alternatives : undefined,
          quickActions: ['Check Other Dates', 'Browse All Fleet', 'Recommend Alternatives'],
          toolCallsExecuted,
        };
      }
    }

    // 12. Price Calculation Query
    const daysMatch = norm.match(/(\d+)\s*(?:days|day|din)/i);
    if (intent === 'CALCULATE_PRICE' || (daysMatch && activeVehicle)) {
      toolCallsExecuted.push('calculateRentalPrice');
      const target = activeVehicle || vehicles[0];
      const days = daysMatch ? parseInt(daysMatch[1], 10) : state.durationDays || 4;
      const pickupDate = state.pickupDate || '2026-09-10';
      const dropoff = new Date(pickupDate);
      dropoff.setDate(dropoff.getDate() + days);
      const dropoffDate = dropoff.toISOString().split('T')[0];

      const priceRes = await this.calculateRentalPrice({
        vehicleIdOrName: target.id,
        pickupDate,
        dropoffDate,
      });

      if (!('error' in priceRes)) {
        return {
          message: `For ${days} days, the ${target.year} ${target.make} ${target.model} is ₹${priceRes.finalAmount} at ₹${priceRes.dailyRate}/day. Standard comprehensive cover and unlimited kilometres are included.`,
          priceCard: priceRes,
          suggestedVehicles: [
            {
              id: target.id,
              name: `${target.year} ${target.make} ${target.model}`,
              year: target.year,
              make: target.make,
              model: target.model,
              category: target.category,
              dailyRate: target.dailyRate,
              seats: target.seats,
              transmission: target.transmission,
              fuelType: target.fuelType,
              luggage: target.luggage,
              imageUrl: target.imageUrl || null,
              location: target.location,
              bookingUrl: `/book/${target.id}?pickupDate=${pickupDate}&dropoffDate=${dropoffDate}`,
              detailsUrl: `/fleet/${target.id}`,
            },
          ],
          quickActions: ['Book This Vehicle', 'Check Discounts', 'View Extras'],
          toolCallsExecuted,
        };
      }
    }

    // 13. Specific Vehicle Selection
    if (
      intent === 'GET_VEHICLE_DETAILS' ||
      (activeVehicle &&
        (norm.includes('want') ||
          norm.includes('chahiye') ||
          norm.includes('select') ||
          norm.includes('take') ||
          norm.includes('details')))
    ) {
      const target = activeVehicle || vehicles[0];
      toolCallsExecuted.push('getVehicleDetails', 'calculateRentalPrice');
      const details = await this.getVehicleDetails(target.id);
      const pDate = state.pickupDate || '2026-09-10';
      const dDate = state.dropoffDate || '2026-09-14';
      const priceRes = await this.calculateRentalPrice({
        vehicleIdOrName: target.id,
        pickupDate: pDate,
        dropoffDate: dDate,
      });

      const priceSummary = !('error' in priceRes) ? priceRes : undefined;

      return {
        message: `Great choice! The ${details?.name} is available in ${details?.location} at ₹${details?.dailyRate}/day with ${details?.transmission} transmission and ${details?.seats} seats. Would you like to check availability or continue to booking?`,
        suggestedVehicles: details ? [details] : undefined,
        priceCard: priceSummary,
        quickActions: ['Book It', 'Check Availability', 'Add Child Seat', 'Browse Other Cars'],
        toolCallsExecuted,
      };
    }

    // 14. Extras / Upsell Recommendations
    if (intent === 'GET_EXTRAS') {
      toolCallsExecuted.push('getAvailableExtras');
      const tripType = norm.includes('family')
        ? 'family'
        : norm.includes('road')
          ? 'road_trip'
          : undefined;
      const extras = await this.getAvailableExtras(tripType);

      const extrasList = extras
        .map(
          (e) =>
            `• ${e.name} (₹${e.price}/${e.pricingType === 'PER_DAY' ? 'day' : 'rental'}): ${e.description}`,
        )
        .join('\n');

      return {
        message: `Here are our recommended optional extras for your journey:\n\n${extrasList}\n\nWould you like to add any of these to your booking?`,
        quickActions: ['Add Child Safety Seat', 'Add 24/7 Roadside Care', 'Continue Booking'],
        toolCallsExecuted,
      };
    }

    // 15. Discounts / Promo Code Queries
    if (intent === 'GET_DISCOUNTS') {
      toolCallsExecuted.push('getAvailableDiscounts');
      const discounts = await this.getAvailableDiscounts();
      const list = discounts
        .map(
          (d) =>
            `• ${d.code}: ${d.description} (Requires minimum ${d.minRentalDays || 1} rental days)`,
        )
        .join('\n');

      return {
        message: `Here are our active promotional offers:\n\n${list}\n\nYou can enter any of these promo codes during Step 5 of our online checkout for instant discounts.`,
        quickActions: ['Browse Fleet', 'Book with SAVE10', 'Check Availability'],
        toolCallsExecuted,
      };
    }

    // 16. Authoritative Policy Inquiries (Cancellation, Age, Licence, Fuel, Mileage, Late Return, Damage, Deposit, One-Way)
    if (intent === 'POLICY_INQUIRY' || intent === 'GENERAL_RENTAL_POLICY') {
      toolCallsExecuted.push('getRentalPolicies');

      if (
        norm.includes('rental rules') ||
        norm.includes('rental policies') ||
        norm.includes('rental policy') ||
        (norm.includes('age') && (norm.includes('licence') || norm.includes('license'))) ||
        norm === 'policies' ||
        norm === 'rules' ||
        norm.includes('terms and conditions') ||
        (norm.includes('what are') && norm.includes('policies'))
      ) {
        return {
          message: `Here is an overview of NR Car Hire rental policies:\n\n• Driver Age: ${rules.ageRequirements}\n• Driver Licence: ${rules.licencePolicy}\n• Kilometres: ${rules.mileage}\n• Fuel Policy: ${rules.fuelPolicy}\n• Cancellation: ${rules.cancellation}\n• Insurance: ${rules.insurance}\n• Pricing: ${rules.pricingCurrency}`,
          quickActions: ['Browse Fleet', 'Find Locations', 'Book a Vehicle'],
          toolCallsExecuted,
        };
      }

      let policyKey = 'cancellation';
      if (norm.includes('cancel') || norm.includes('refund')) policyKey = 'cancellation';
      else if (norm.includes('change') || norm.includes('modify') || norm.includes('dates'))
        policyKey = 'modification';
      else if (
        norm.includes('mileage') ||
        norm.includes('kilometre') ||
        norm.includes('km') ||
        norm.includes('distance')
      )
        policyKey = 'mileage';
      else if (
        norm.includes('damage') ||
        norm.includes('accident') ||
        norm.includes('insurance') ||
        norm.includes('zero excess') ||
        norm.includes('liability')
      )
        policyKey = 'insurance';
      else if (
        norm.includes('fuel') ||
        norm.includes('petrol') ||
        norm.includes('diesel') ||
        norm.includes('full to full')
      )
        policyKey = 'fuel';
      else if (
        norm.includes('driver age') ||
        norm.includes('minimum age') ||
        norm.includes('how old') ||
        norm.includes('young driver') ||
        /\bage\b/i.test(norm)
      )
        policyKey = 'age';
      else if (
        norm.includes('licence') ||
        norm.includes('license') ||
        norm.includes('permit') ||
        norm.includes('documents')
      )
        policyKey = 'licence';
      else if (norm.includes('late') || norm.includes('grace period') || norm.includes('penalty'))
        policyKey = 'late_return';
      else if (
        norm.includes('deposit') ||
        norm.includes('bond') ||
        norm.includes('pre-authorisation')
      )
        policyKey = 'deposit';
      else if (
        norm.includes('sydney and leave') ||
        norm.includes('sydney and return in brisbane') ||
        norm.includes('one-way') ||
        norm.includes('one way') ||
        norm.includes('somewhere else')
      )
        policyKey = 'one_way';
      else if (
        norm.includes('roadside') ||
        norm.includes('breakdown') ||
        norm.includes('flat tyre')
      )
        policyKey = 'roadside';
      else if (
        norm.includes('child seat') ||
        norm.includes('baby seat') ||
        norm.includes('booster') ||
        norm.includes('children')
      )
        policyKey = 'child_seats';
      else if (norm.includes('gps') || norm.includes('navigation') || norm.includes('maps'))
        policyKey = 'gps';

      const policy = RENTAL_POLICIES[policyKey];
      if (policy) {
        return {
          message: `${policy.title}:\n\n${policy.details}`,
          quickActions: [
            'Browse Fleet',
            'Check Rates & Availability',
            'Airport Locations',
            'Rental Policies',
          ],
          toolCallsExecuted,
        };
      }

      return {
        message: `Here is an overview of NR Car Hire rental policies:\n\n• Driver Age: ${rules.ageRequirements}\n• Driver Licence: ${rules.licencePolicy}\n• Kilometres: ${rules.mileage}\n• Fuel Policy: ${rules.fuelPolicy}\n• Cancellation: ${rules.cancellation}\n• Insurance: ${rules.insurance}\n• Pricing: ${rules.pricingCurrency}`,
        quickActions: ['Browse Fleet', 'Find Locations', 'Book a Vehicle'],
        toolCallsExecuted,
      };
    }

    // 17. Airport Services & Terminal Desks (Sydney, Melbourne, Brisbane, Gold Coast, Perth, Adelaide)
    if (intent === 'AIRPORT_SERVICE_INQUIRY') {
      toolCallsExecuted.push('getAirportHubs');
      let matchedHub = null;
      if (norm.includes('sydney') || norm.includes('syd')) matchedHub = AIRPORT_HUBS.sydney;
      else if (norm.includes('melbourne') || norm.includes('mel'))
        matchedHub = AIRPORT_HUBS.melbourne;
      else if (norm.includes('brisbane') || norm.includes('bne'))
        matchedHub = AIRPORT_HUBS.brisbane;
      else if (norm.includes('gold coast') || norm.includes('ool'))
        matchedHub = AIRPORT_HUBS.gold_coast;
      else if (norm.includes('perth') || norm.includes('per')) matchedHub = AIRPORT_HUBS.perth;
      else if (norm.includes('adelaide') || norm.includes('adl'))
        matchedHub = AIRPORT_HUBS.adelaide;

      if (matchedHub) {
        return {
          message: `At ${matchedHub.airportName} (${matchedHub.city}), our customer service desk is located at: ${matchedHub.deskLocation}\n\n• Terminals: ${matchedHub.terminals}\n• Operating Hours: ${matchedHub.operatingHours}\n• Vehicle Access: ${matchedHub.shuttleOrWalk}\n• After-Hours Returns: ${matchedHub.afterHoursReturn}`,
          quickActions: ['Book Airport Car', 'Browse Fleet', 'Check Rates'],
          toolCallsExecuted,
        };
      }

      return {
        message:
          'Yes! We offer on-site airport pickup and drop-off at all major Australian airports including Sydney (SYD), Melbourne (MEL), Brisbane (BNE), Gold Coast (OOL), Perth (PER), and Adelaide (ADL). Our dedicated customer desks are located inside the terminal arrivals concourses with 24/7 after-hours key drop-off boxes.',
        quickActions: ['Sydney Airport', 'Melbourne Airport', 'Brisbane Airport', 'Browse Fleet'],
        toolCallsExecuted,
      };
    }

    // 18. Location Hub Inquiries
    if (intent === 'LOCATION_INQUIRY') {
      toolCallsExecuted.push('getLocations');
      const locations = await locationStore.list(true);
      const locList = locations
        .map((l) => `• ${l.airportOrCity} (${l.state}): ${l.name} — ${l.address}`)
        .join('\n');

      if (
        norm.includes('darwin') ||
        norm.includes('canberra') ||
        norm.includes('cairns') ||
        norm.includes('hobart') ||
        norm.includes('newcastle')
      ) {
        return {
          message:
            'NR Car Hire currently operates across Sydney, Melbourne, Brisbane, Gold Coast, Perth, and Adelaide. We do not currently have a rental hub in that specific city, but you can collect your vehicle from our nearest supported hub.',
          quickActions: ['Sydney Hub', 'Melbourne Hub', 'Brisbane Hub', 'Browse Fleet'],
          toolCallsExecuted,
        };
      }

      return {
        message: `NR Car Hire operates across 6 major Australian rental hubs with convenient on-site airport concourses and city access:\n\n${locList}\n\nOne-way rentals between these hubs are also supported.`,
        quickActions: ['Browse Fleet', 'Sydney Airport', 'Melbourne Airport', 'Check Rates'],
        toolCallsExecuted,
      };
    }

    // 19. Vehicle Comparison & Multi-Requirement Specs
    if (intent === 'VEHICLE_COMPARISON') {
      toolCallsExecuted.push('compareVehicles');
      if (norm.includes('camry') && norm.includes('tucson')) {
        const comp = VEHICLE_COMPARISONS.find(
          (c) => c.vehicleA === 'camry' && c.vehicleB === 'tucson',
        )!;
        const cVeh = vehicles.find((v) => v.id === 'v-001-camry')!;
        const tVeh = vehicles.find((v) => v.id === 'v-006-tucson')!;
        return {
          message: comp.comparisonText,
          suggestedVehicles: [cVeh, tVeh].filter(Boolean).map((v) => ({
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
            imageUrl: v.imageUrl || null,
            location: v.location,
            bookingUrl: `/book/${v.id}`,
            detailsUrl: `/fleet/${v.id}`,
          })),
          quickActions: ['Book Toyota Camry', 'Book Hyundai Tucson', 'Check Rates'],
          toolCallsExecuted,
        };
      }

      if (
        norm.includes('cx5') ||
        norm.includes('cx-5') ||
        (norm.includes('mazda') && norm.includes('tucson'))
      ) {
        const comp = VEHICLE_COMPARISONS.find(
          (c) => c.vehicleA === 'cx5' && c.vehicleB === 'tucson',
        )!;
        const tVeh = vehicles.find((v) => v.id === 'v-006-tucson')!;
        const cxVeh = vehicles.find((v) => v.id === 'v-002-cx5')!;
        return {
          message: comp.comparisonText,
          suggestedVehicles: [tVeh, cxVeh].filter(Boolean).map((v) => ({
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
            imageUrl: v.imageUrl || null,
            location: v.location,
            bookingUrl: `/book/${v.id}`,
            detailsUrl: `/fleet/${v.id}`,
          })),
          quickActions: ['Book Hyundai Tucson', 'Book Mazda CX-5', 'Check Rates'],
          toolCallsExecuted,
        };
      }

      if (
        norm.includes('3series') ||
        norm.includes('3 series') ||
        (norm.includes('bmw') && norm.includes('mercedes'))
      ) {
        const comp = VEHICLE_COMPARISONS.find(
          (c) => c.vehicleA === '3series' && c.vehicleB === 'cclass',
        )!;
        const bVeh = vehicles.find((v) => v.id === 'v-003-3series')!;
        const mVeh = vehicles.find((v) => v.id === 'v-004-cclass')!;
        return {
          message: comp.comparisonText,
          suggestedVehicles: [bVeh, mVeh].filter(Boolean).map((v) => ({
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
            imageUrl: v.imageUrl || null,
            location: v.location,
            bookingUrl: `/book/${v.id}`,
            detailsUrl: `/fleet/${v.id}`,
          })),
          quickActions: ['Book BMW 3 Series', 'Book Mercedes C-Class', 'Check Rates'],
          toolCallsExecuted,
        };
      }

      if (
        norm.includes('biggest boot') ||
        norm.includes('more luggage') ||
        norm.includes('more boot space') ||
        norm.includes('5 bags') ||
        norm.includes('six bags') ||
        norm.includes('6 bags')
      ) {
        const tucson = vehicles.find((v) => v.id === 'v-006-tucson')!;
        const camry = vehicles.find((v) => v.id === 'v-001-camry')!;
        return {
          message:
            'The 2024 Hyundai Tucson offers the largest enclosed boot capacity in our passenger fleet with 539L of cargo volume (up to 4 large suitcases plus soft bags), closely followed by the 2024 Toyota Camry with 524L. For open heavy-duty cargo carrying, our 2024 Toyota HiLux features a full utility tray.',
          suggestedVehicles: [tucson, camry].filter(Boolean).map((v) => ({
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
            imageUrl: v.imageUrl || null,
            location: v.location,
            bookingUrl: `/book/${v.id}`,
            detailsUrl: `/fleet/${v.id}`,
          })),
          quickActions: ['Book Hyundai Tucson', 'Book Toyota Camry', 'Browse Fleet'],
          toolCallsExecuted,
        };
      }

      if (
        norm.includes('five people') ||
        norm.includes('5 people') ||
        norm.includes('road trip') ||
        norm.includes('two week') ||
        norm.includes('2 week')
      ) {
        const tucson = vehicles.find((v) => v.id === 'v-006-tucson')!;
        const cx5 = vehicles.find((v) => v.id === 'v-002-cx5')!;
        return {
          message:
            'For 5 people on a long Australian road trip, we highly recommend the 2024 Hyundai Tucson (₹99/day) or 2024 Mazda CX-5 (₹109/day). Both deliver generous legroom for 5 adults, 530L+ boot space, ISOFIX child seat anchor points, and economical fuel efficiency.',
          suggestedVehicles: [tucson, cx5].filter(Boolean).map((v) => ({
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
            imageUrl: v.imageUrl || null,
            location: v.location,
            bookingUrl: `/book/${v.id}`,
            detailsUrl: `/fleet/${v.id}`,
          })),
          quickActions: ['Book Hyundai Tucson', 'Book Mazda CX-5', 'Add Child Seat'],
          toolCallsExecuted,
        };
      }
    }

    // 20. Customer Booking Inquiry / Account Status Lookups
    if (intent === 'CUSTOMER_BOOKING_INQUIRY') {
      toolCallsExecuted.push('getCustomerBookings');
      const bkMatch = userMessage.match(/\b((?:bk|nr)-[a-z0-9-]+)\b/i);
      if (bkMatch) {
        const bookingRef = bkMatch[1].toUpperCase();
        const booking =
          (await bookingStore.findByBookingNumber(bookingRef)) ||
          (await bookingStore.findById(bookingRef.toLowerCase()));
        if (booking) {
          const v = vehicles.find((veh) => veh.id === booking.vehicleId);
          const vName = v ? `${v.year} ${v.make} ${v.model}` : booking.vehicleId;
          const pDate =
            booking.pickupDate instanceof Date
              ? booking.pickupDate.toISOString().split('T')[0]
              : String(booking.pickupDate);
          const dDate =
            booking.dropoffDate instanceof Date
              ? booking.dropoffDate.toISOString().split('T')[0]
              : String(booking.dropoffDate);
          return {
            message: `Booking #${booking.bookingNumber} Details:\n\n• Vehicle: ${vName}\n• Status: ${booking.status}\n• Dates: ${pDate} to ${dDate} (${booking.rentalDays} days)\n• Pickup Location: ${booking.pickupLocation}\n• Total Amount: ₹${booking.finalAmount}\n• Payment Status: ${booking.paymentStatus}`,
            quickActions: ['Browse Fleet', 'Check Other Bookings', 'Contact Support'],
            toolCallsExecuted,
          };
        }
      }

      return {
        message:
          'To retrieve your live reservation status, please provide your Booking Reference Number (e.g. BK-XXXX) or the email address used during your booking checkout.',
        quickActions: ['Browse Fleet', 'Check Rates & Availability', 'Rental Policies'],
        toolCallsExecuted,
      };
    }

    // 17. General Vehicle Search
    toolCallsExecuted.push('searchVehicles');
    const searchRes = await this.searchVehicles(
      {
        query: `${userMessage} ${norm}`,
      },
      state,
    );

    let searchMsg = `I found ${searchRes.vehicles.length} matching vehicles in our Australian fleet:`;
    if (norm.includes('suv') || norm.includes('suvs') || norm.includes('badi car')) {
      searchMsg = `For family travel and generous luggage capacity, here are ${searchRes.vehicles.length} premium SUVs in our fleet:`;
    } else if (norm.includes('luxury') || norm.includes('premium')) {
      searchMsg = `For executive travel and premium comfort, here are ${searchRes.vehicles.length} luxury vehicles in our fleet:`;
    } else if (norm.includes('family') || norm.includes('5 log') || norm.includes('5 seater')) {
      searchMsg = `Here are our top recommended family vehicles with 5 seats and generous luggage room:`;
    } else if (searchRes.vehicles.length === 0) {
      searchMsg = `Here are our most popular vehicles from the Australian fleet:`;
    }

    return {
      message: searchMsg,
      suggestedVehicles: searchRes.vehicles,
      quickActions: [
        'Show Automatic SUVs',
        'Cars Under ₹150/day',
        'Check Availability',
        'Rental Policies',
      ],
      toolCallsExecuted,
    };
  }
}

export const aiAgentService = new AiAgentService();
