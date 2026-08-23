import type { VehicleRecord } from '@/lib/db/vehicle-store';
import {
  normalizeUserText,
  extractNaturalDates,
  resolveVehicleWithTypoTolerance,
  type AgentIntent,
} from '@/lib/utils/ai-nlp';

export type SupportedLanguage = 'en' | 'hi' | 'hinglish' | 'gu';

export type BookingStage =
  | 'INQUIRING'
  | 'DATES_SET'
  | 'VEHICLE_CHOSEN'
  | 'PRICED'
  | 'AWAITING_CONFIRMATION'
  | 'DRAFTED'
  | 'READY_FOR_PAYMENT';

export interface CustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ManagedConversationState {
  intent: AgentIntent;
  detectedLanguage: SupportedLanguage;
  
  // Booking Entities
  selectedVehicle: VehicleRecord | null;
  category: string | null;
  pickupDate: string | null;
  dropoffDate: string | null;
  formattedPickup: string | null;
  formattedDropoff: string | null;
  durationDays: number | null;
  pickupTime: string | null;
  returnTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  customer: CustomerInfo;
  
  // Constraints & Preferences
  seatsMin: number | null;
  transmission: 'Automatic' | 'Manual' | 'Any' | null;
  maxDailyRate: number | null;
  budgetPreference: 'cheaper' | 'luxury' | null;
  promoCode: string | null;
  extraIds: string[];
  
  // Tracking Lists (Critical for exclusion logic)
  suggestedVehicles: string[];   // Vehicle IDs already suggested in conversation
  rejectedVehicles: string[];    // Vehicle IDs customer explicitly rejected/disliked
  unavailableVehicles: string[]; // Vehicle IDs checked and confirmed unavailable for current dates/location
  
  // Lifecycle
  bookingStage: BookingStage;
  currentBookingId: string | null;
  currentBookingNumber: string | null;
  paymentCheckoutUrl: string | null;
  isCancelled: boolean;
  confirmedByCustomer: boolean;
}

export class ConversationManager {
  /**
   * Detects customer language: English, Hindi, Hinglish, or Gujarati
   */
  public detectLanguage(text: string): SupportedLanguage {
    const raw = text.trim();
    const norm = normalizeUserText(text);

    // 1. Gujarati Script Detection (\u0A80-\u0AFF) or Gujarati romanized keywords
    const hasGujaratiScript = /[\u0A80-\u0AFF]/.test(raw);
    if (
      hasGujaratiScript ||
      norm.includes('joiye chhe') ||
      norm.includes('kem chho') ||
      norm.includes('car joiye') ||
      norm.includes('aavse') ||
      norm.includes('karo chho') ||
      norm.includes('ketla rupiya')
    ) {
      return 'gu';
    }

    // 2. Hindi Devanagari Script Detection (\u0900-\u097F)
    const hasDevanagariScript = /[\u0900-\u097F]/.test(raw);
    if (hasDevanagariScript) {
      return 'hi';
    }

    // 3. Hinglish Detection (Romanized Hindi words)
    const hinglishMarkers = [
      'bhai', 'mujhe', 'chahiye', 'kya', 'hai', 'kitna', 'kaise', 'hoga', 'hogi', 'milega', 'milegi',
      'gaadi', 'gadi', 'dikhaye', 'batao', 'bataye', 'bata', 'kar do', 'kardo', 'sasta', 'sasti',
      'mehnga', 'mehngi', 'nahi', 'chahiye', 'rehne do', 'mat karo', 'pehla', 'dusra', 'teesra',
      'shukriya', 'dhanyawad', 'namaste', 'acha', 'theek', 'lekin', 'aur', 'sirf', 'wale', 'wali',
      'log', 'din', 'kal', 'parso', 'agle hafte', 'karna hai', 'book karo', 'kiraya', 'paisa', 'paise'
    ];

    let matchCount = 0;
    for (const marker of hinglishMarkers) {
      if (new RegExp(`\\b${marker}\\b`, 'i').test(norm)) {
        matchCount++;
      }
    }

    if (matchCount >= 1) {
      return 'hinglish';
    }

    return 'en';
  }

  /**
   * Checks if the customer is starting a completely new booking / fresh inquiry
   */
  public isNewBookingRequest(text: string): boolean {
    const norm = normalizeUserText(text);
    return (
      norm.includes('new booking') ||
      norm.includes('another booking') ||
      norm.includes('different booking') ||
      norm.includes('start over') ||
      norm.includes('reset booking') ||
      norm.includes('fresh booking') ||
      norm.includes('nayi booking') ||
      norm.includes('ek aur car book') ||
      norm.includes('dusri booking') ||
      norm.includes('nava trip')
    );
  }

  /**
   * Creates a fresh default conversation state
   */
  public createInitialState(): ManagedConversationState {
    return {
      intent: 'UNKNOWN',
      detectedLanguage: 'en',
      selectedVehicle: null,
      category: null,
      pickupDate: null,
      dropoffDate: null,
      formattedPickup: null,
      formattedDropoff: null,
      durationDays: null,
      pickupTime: null,
      returnTime: null,
      pickupLocation: null,
      dropoffLocation: null,
      customer: {},
      seatsMin: null,
      transmission: null,
      maxDailyRate: null,
      budgetPreference: null,
      promoCode: null,
      extraIds: [],
      suggestedVehicles: [],
      rejectedVehicles: [],
      unavailableVehicles: [],
      bookingStage: 'INQUIRING',
      currentBookingId: null,
      currentBookingNumber: null,
      paymentCheckoutUrl: null,
      isCancelled: false,
      confirmedByCustomer: false,
    };
  }

  /**
   * Resets temporary booking-specific exclusions when user initiates a fresh booking
   */
  public resetTemporaryBookingState(state: ManagedConversationState): ManagedConversationState {
    return {
      ...state,
      selectedVehicle: null,
      category: null,
      pickupDate: null,
      dropoffDate: null,
      formattedPickup: null,
      formattedDropoff: null,
      durationDays: null,
      pickupTime: null,
      returnTime: null,
      pickupLocation: null,
      dropoffLocation: null,
      suggestedVehicles: [],
      rejectedVehicles: [],
      unavailableVehicles: [],
      bookingStage: 'INQUIRING',
      currentBookingId: null,
      currentBookingNumber: null,
      paymentCheckoutUrl: null,
      isCancelled: false,
      confirmedByCustomer: false,
    };
  }

  /**
   * Resets date-dependent availability exclusions when pickup or dropoff dates change
   */
  public handleDateOrLocationChange(
    state: ManagedConversationState,
    newPickupDate?: string | null,
    newDropoffDate?: string | null,
    newLocation?: string | null
  ): void {
    const datesChanged =
      (newPickupDate && newPickupDate !== state.pickupDate) ||
      (newDropoffDate && newDropoffDate !== state.dropoffDate);
    const locationChanged = newLocation && newLocation !== state.pickupLocation;

    if (datesChanged || locationChanged) {
      // Re-open unavailable vehicles for newly chosen dates/location
      state.unavailableVehicles = [];
      if (state.bookingStage === 'PRICED' || state.bookingStage === 'AWAITING_CONFIRMATION') {
        state.bookingStage = 'DATES_SET';
      }
    }
  }

  /**
   * Parses the conversation history sequentially and builds an accurate, cumulative state
   */
  public extractState(
    messages: Array<{ role: string; content: string }>,
    vehicles: VehicleRecord[]
  ): ManagedConversationState {
    let state = this.createInitialState();

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const raw = m.content;
      const norm = normalizeUserText(raw);

      if (m.role === 'assistant') {
        // Track vehicles the assistant previously suggested
        for (const v of vehicles) {
          const vName = `${v.year} ${v.make} ${v.model}`.toLowerCase();
          if (norm.includes(v.model.toLowerCase()) || norm.includes(vName)) {
            if (!state.suggestedVehicles.includes(v.id)) {
              state.suggestedVehicles.push(v.id);
            }
          }
        }
        continue;
      }

      // User Message Processing:
      
      // 0. Check language
      state.detectedLanguage = this.detectLanguage(raw);

      // 1. Check for new booking reset
      if (this.isNewBookingRequest(raw)) {
        state = this.resetTemporaryBookingState(state);
        continue;
      }

      // 2. Cancellation of active booking draft
      if (
        norm.includes('cancel draft') ||
        norm.includes('abort booking') ||
        norm.includes('stop booking') ||
        norm.includes('rehne do mat book karo') ||
        norm.includes('mat book karo') ||
        norm.includes('booking mat karo') ||
        norm.includes('cancel booking')
      ) {
        state.isCancelled = true;
        state.bookingStage = 'INQUIRING';
      } else if (norm.includes('proceed') || norm.includes('book kar do') || norm.includes('yes book it') || norm.includes('confirm booking')) {
        state.isCancelled = false;
        state.confirmedByCustomer = true;
      }

      // 3. Customer explicit rejection ("no Camry", "not this one", "I don't want HiLux", "manual nahi chahiye")
      for (const v of vehicles) {
        const vModel = v.model.toLowerCase();
        const vMake = v.make.toLowerCase();
        const vFullName = `${vMake} ${vModel}`;
        if (
          norm.includes(`no ${vModel}`) ||
          norm.includes(`not ${vModel}`) ||
          norm.includes(`dont want ${vModel}`) ||
          norm.includes(`don't want ${vModel}`) ||
          norm.includes(`${vModel} nahi`) ||
          norm.includes(`${vModel} mat`) ||
          norm.includes(`no ${vFullName}`) ||
          norm.includes(`not ${vFullName}`)
        ) {
          if (!state.rejectedVehicles.includes(v.id)) {
            state.rejectedVehicles.push(v.id);
          }
          if (state.selectedVehicle?.id === v.id) {
            state.selectedVehicle = null;
          }
        }
      }

      // 4. Budget Preference
      if (norm.includes('cheaper') || norm.includes('sasta') || norm.includes('sasti') || norm.includes('budget')) {
        state.budgetPreference = 'cheaper';
      } else if (norm.includes('luxury') || norm.includes('premium') || norm.includes('best car') || norm.includes('top model')) {
        state.budgetPreference = 'luxury';
      }

      // 5. Category Selection
      if (norm.includes('suv') || norm.includes('suvs')) {
        state.category = 'suv';
        if (state.selectedVehicle && state.selectedVehicle.category.toLowerCase() !== 'suv') {
          state.selectedVehicle = null;
        }
      } else if (norm.includes('sedan') || norm.includes('sedans')) {
        state.category = 'sedan';
        if (state.selectedVehicle && state.selectedVehicle.category.toLowerCase() !== 'sedan') {
          state.selectedVehicle = null;
        }
      } else if (norm.includes('luxury') || norm.includes('premium')) {
        state.category = 'luxury';
        if (state.selectedVehicle && state.selectedVehicle.category.toLowerCase() !== 'luxury' && state.selectedVehicle.category.toLowerCase() !== 'premium') {
          state.selectedVehicle = null;
        }
      } else if (norm.includes('utility') || norm.includes('ute') || norm.includes('4x4') || norm.includes('truck')) {
        state.category = 'utility';
        if (state.selectedVehicle && state.selectedVehicle.category.toLowerCase() !== 'utility') {
          state.selectedVehicle = null;
        }
      }

      // 6. Specific Vehicle Named
      const vehicleInMsg = resolveVehicleWithTypoTolerance(raw, vehicles);
      if (vehicleInMsg && !state.rejectedVehicles.includes(vehicleInMsg.id)) {
        state.selectedVehicle = vehicleInMsg;
        state.category = vehicleInMsg.category.toLowerCase();
        state.bookingStage = state.pickupDate ? 'VEHICLE_CHOSEN' : state.bookingStage;
      }

      // 7. Dates Extraction (with reset of availability exclusions if dates changed)
      const datesInMsg = extractNaturalDates(raw);
      if (datesInMsg) {
        this.handleDateOrLocationChange(state, datesInMsg.pickupDate, datesInMsg.dropoffDate, null);
        state.pickupDate = datesInMsg.pickupDate;
        state.dropoffDate = datesInMsg.dropoffDate;
        state.formattedPickup = datesInMsg.formattedPickup;
        state.formattedDropoff = datesInMsg.formattedDropoff;
        const diffMs = new Date(datesInMsg.dropoffDate).getTime() - new Date(datesInMsg.pickupDate).getTime();
        state.durationDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        if (state.bookingStage === 'INQUIRING') {
          state.bookingStage = 'DATES_SET';
        }
      } else {
        // Duration in days check e.g. "for 5 days", "3 din"
        const dMatch = norm.match(/(\d+)\s*(?:days|day|din)/i);
        if (dMatch) {
          state.durationDays = parseInt(dMatch[1], 10);
          const basePickup = state.pickupDate || new Date().toISOString().split('T')[0];
          const dObj = new Date(basePickup);
          dObj.setDate(dObj.getDate() + state.durationDays);
          const newDropoff = dObj.toISOString().split('T')[0];
          this.handleDateOrLocationChange(state, basePickup, newDropoff, null);
          state.pickupDate = basePickup;
          state.dropoffDate = newDropoff;
          state.formattedPickup = basePickup;
          state.formattedDropoff = newDropoff;
        }
      }

      // 8. Location Extraction
      const locations = [
        'Sydney',
        'Melbourne',
        'Brisbane',
        'Gold Coast',
        'Perth',
        'Adelaide',
        'Hobart',
        'Cairns',
      ];
      for (const loc of locations) {
        if (norm.includes(loc.toLowerCase())) {
          this.handleDateOrLocationChange(state, null, null, loc);
          state.pickupLocation = loc;
          state.dropoffLocation = loc;
        }
      }

      // 9. Time Extraction
      const timeMatch = raw.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)|\d{1,2}:\d{2})/);
      if (timeMatch) {
        if (!state.pickupTime) {
          state.pickupTime = timeMatch[1].trim();
        } else if (!state.returnTime) {
          state.returnTime = timeMatch[1].trim();
        }
      }

      // 10. Customer Contact Details Extraction (Email, Phone, Name)
      const emailMatch = raw.match(/[\w.-]+@[\w.-]+\.\w+/i);
      if (emailMatch) {
        state.customer.email = emailMatch[0].trim();
      }

      const phoneMatch = raw.match(/(?:\+?61|0)?[45]\d{8}|\+?\d{10,13}/);
      if (phoneMatch) {
        state.customer.phone = phoneMatch[0].trim();
      }

      const nameMatch = raw.match(/(?:my name is|i am|name is|naam hai)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
      if (nameMatch) {
        state.customer.name = nameMatch[1].trim();
      }

      // 11. Transmission Constraint
      if (norm.includes('manual nahi') || norm.includes('no manual') || norm.includes('not manual')) {
        state.transmission = 'Automatic';
      } else if (norm.includes('automatic nahi') || norm.includes('no auto') || norm.includes('not auto')) {
        state.transmission = 'Manual';
      } else if (norm.includes('any transmission') || norm.includes('dono chalenge')) {
        state.transmission = 'Any';
      } else if (norm.includes('manual') || norm.includes('stick shift')) {
        state.transmission = 'Manual';
      } else if (norm.includes('automatic') || norm.match(/\bauto\b/)) {
        state.transmission = 'Automatic';
      }

      // 12. Seats Constraint
      const seatMatch = norm.match(/(\d+)\s*(?:seat|seater|people|log|passenger)/i);
      if (seatMatch) {
        state.seatsMin = parseInt(seatMatch[1], 10);
      } else if (norm.includes('family of five')) {
        state.seatsMin = 5;
      } else if (norm.includes('family')) {
        state.seatsMin = Math.max(state.seatsMin || 0, 4);
      }

      // 13. Max Budget / Price constraint
      const priceMatch =
        raw.match(/under\s*[₹$]?\s*(\d+)/i) ||
        raw.match(/less than\s*[₹$]?\s*(\d+)/i) ||
        raw.match(/max\s*[₹$]?\s*(\d+)/i) ||
        raw.match(/below\s*[₹$]?\s*(\d+)/i) ||
        norm.match(/under\s*(\d+)/i) ||
        norm.match(/less than\s*(\d+)/i) ||
        norm.match(/max\s*(\d+)/i);
      if (priceMatch) {
        state.maxDailyRate = parseInt(priceMatch[1], 10);
      }

      // 14. Promo Codes & Extras
      if (norm.includes('save10')) state.promoCode = 'SAVE10';
      if (norm.includes('weekend50')) state.promoCode = 'WEEKEND50';
      if (norm.includes('summer15')) state.promoCode = 'SUMMER15';

      if (norm.includes('zero excess') || norm.includes('full insurance')) {
        if (!state.extraIds.includes('ext-zero-excess')) state.extraIds.push('ext-zero-excess');
      }
      if (norm.includes('child seat') || norm.includes('baby seat')) {
        if (!state.extraIds.includes('ext-child-seat')) state.extraIds.push('ext-child-seat');
      }
      if (norm.includes('gps') || norm.includes('navigation')) {
        if (!state.extraIds.includes('ext-gps')) state.extraIds.push('ext-gps');
      }
    }

    return state;
  }
}

export const conversationManager = new ConversationManager();
