/**
 * NR Car Hire — Authoritative Customer-Safe Business Knowledge Base
 * Phase 5D: Single source of truth for policies, airport hubs, driving rules, and service catalog.
 */

export interface PolicyTopic {
  id: string;
  title: string;
  summary: string;
  details: string;
  spokenSummary: string;
}

export interface AirportHubInfo {
  code: string;
  airportName: string;
  city: string;
  terminals: string;
  deskLocation: string;
  operatingHours: string;
  shuttleOrWalk: string;
  afterHoursReturn: string;
}

export interface VehicleComparison {
  vehicleA: string;
  vehicleB: string;
  comparisonText: string;
  spokenComparison: string;
}

export const RENTAL_POLICIES: Record<string, PolicyTopic> = {
  cancellation: {
    id: 'cancellation',
    title: 'Cancellation & Refund Policy',
    summary: 'Free cancellation with 100% refund up to 48 hours before pickup.',
    details:
      'You can cancel your booking for a full 100% refund up to 48 hours prior to your scheduled pickup time. Cancellations made within 48 hours of pickup receive a 50% refund or a full 100% credit voucher. No-shows are non-refundable.',
    spokenSummary: 'We offer free cancellation with a 100% refund up to 48 hours before pickup.',
  },
  modification: {
    id: 'modification',
    title: 'Booking Modification Policy',
    summary: 'Free date, time, or location changes up to 24 hours prior to pickup.',
    details:
      'You can modify your booking dates, vehicle selection, pickup location, or optional extras up to 24 hours before pickup without modification fees. Rate adjustments may apply if seasonal or duration pricing changes.',
    spokenSummary: 'You can change your dates or details for free up to 24 hours before pickup.',
  },
  age: {
    id: 'age',
    title: 'Driver Age Requirements',
    summary: 'Minimum driver age is 21 years. Young driver surcharge applies for ages 21–24.',
    details:
      'Drivers must be at least 21 years of age. A Young Driver Surcharge ($15/day) applies to drivers aged 21 to 24, who can rent Sedans and Compact SUVs. Drivers aged 25 and over have full access to all fleet categories including Luxury and Utilities without surcharge.',
    spokenSummary:
      'The minimum driver age is 21 years old. Drivers aged 21 to 24 have a small young driver surcharge, while drivers 25 and over have standard access to all cars.',
  },
  licence: {
    id: 'licence',
    title: 'Driver Licence Requirements',
    summary:
      'Valid Australian state licence or International Driving Permit with passport accepted.',
    details:
      'All drivers must hold a full, valid driver licence held for at least 12 months. Australian state licences, digital state licences, and overseas English-language licences are accepted. Non-English overseas licences require an International Driving Permit (IDP) or NAATI-certified translation alongside the original physical licence and passport. Learner permits are not permitted.',
    spokenSummary:
      'You need a full valid driver licence. We accept all Australian state licences and English overseas licences, or an International Driving Permit with your passport.',
  },
  fuel: {
    id: 'fuel',
    title: 'Fuel Policy (Full-to-Full)',
    summary: 'Vehicles are supplied full and must be returned full.',
    details:
      'We operate a fair Full-to-Full fuel policy. Your vehicle will be handed over with a full tank of fuel and should be returned full. If returned with less fuel, refuelling is charged at current local retail pump rates plus a $15 service charge.',
    spokenSummary:
      'We use a Full-to-Full fuel policy. The car comes with a full tank and should be returned full to avoid extra refuelling fees.',
  },
  mileage: {
    id: 'mileage',
    title: 'Unlimited Kilometres Policy',
    summary: 'Unlimited kilometres are included on all standard rentals across Australia.',
    details:
      'All passenger vehicle hires include 100% unlimited kilometres throughout Australia. There are no hidden distance caps or per-kilometre charges on standard rentals.',
    spokenSummary: 'Unlimited kilometres are included on all standard rentals across Australia.',
  },
  late_return: {
    id: 'late_return',
    title: 'Late Return Policy & Grace Period',
    summary: '59-minute grace period applies to all vehicle returns.',
    details:
      'We provide a complimentary 59-minute grace period on returns. Returns delayed past 1 hour are charged at $20/hour up to a maximum of 1 full day rental rate. Please notify us if you anticipate running late.',
    spokenSummary:
      'We give you a 59-minute grace period. Returns past one hour are billed at 20 dollars an hour up to one day rate.',
  },
  insurance: {
    id: 'insurance',
    title: 'Insurance & Damage Liability Waiver',
    summary: 'Standard Comprehensive Cover included; Zero Excess Protection available at ₹25/day.',
    details:
      'Standard Comprehensive Insurance is included on all bookings with a standard $2,500 damage excess liability. You can upgrade to Zero Excess Protection (ext-zero-excess at ₹25/day) to reduce your accidental damage liability to $0, including single-vehicle incidents, windscreens, and tyres.',
    spokenSummary:
      'Standard insurance is included. You can also add Zero Excess Protection for 25 rupees a day to reduce your liability to zero.',
  },
  deposit: {
    id: 'deposit',
    title: 'Security Deposit & Bond Pre-Authorisation',
    summary:
      'Security bond ($200 standard / $500 luxury) held on card and released within 3–5 days.',
    details:
      'A pre-authorisation security bond ($200 for standard sedans/SUVs, $500 for luxury or 4x4 utilities) is held on your payment card at pickup. The hold is automatically released within 3 to 5 business days after returning the vehicle in good order.',
    spokenSummary:
      'A security bond of 200 dollars for standard cars or 500 dollars for luxury cars is held on your card and released within three to five business days after return.',
  },
  one_way: {
    id: 'one_way',
    title: 'One-Way Interstate & Hub Rentals',
    summary:
      'One-way hire supported between Sydney, Melbourne, Brisbane, Gold Coast, Perth, and Adelaide.',
    details:
      'One-way rentals are supported between any of our official hub cities (e.g. collect in Sydney and return in Brisbane or Melbourne). A one-way relocation surcharge may apply depending on route and vehicle availability.',
    spokenSummary:
      'Yes, you can pick up in one city like Sydney and return in another like Brisbane or Melbourne.',
  },
  roadside: {
    id: 'roadside',
    title: '24/7 Roadside Assistance',
    summary: 'National mechanical breakdown assistance included 24/7 across Australia.',
    details:
      'Standard 24/7 mechanical breakdown support is included complimentary on every hire. For added peace of mind, Roadside Assistance Plus (ext-roadside-plus at ₹8/day) covers driver faults including key lockouts, lost keys, flat tyres, jump-starts, and emergency fuel delivery.',
    spokenSummary:
      '24/7 mechanical breakdown support is included everywhere in Australia. You can also add Roadside Plus for 8 rupees a day for key lockouts and flat tyre assistance.',
  },
  child_seats: {
    id: 'child_seats',
    title: 'Child Safety & Booster Seats',
    summary:
      'Australian standard AS/NZS 1754 approved baby capsules, toddler seats, and booster seats.',
    details:
      'We offer AS/NZS 1754 certified child seats for ₹12/day: rear-facing baby capsules (0–6 months), forward-facing toddler seats (6 months–4 years), and booster seats (4–7 years). Fitted ISOFIX attachment points are standard across our SUVs and Sedans.',
    spokenSummary:
      'We have Australian certified baby capsules, toddler seats, and booster seats available for 12 rupees a day.',
  },
  gps: {
    id: 'gps',
    title: 'GPS Navigation & Connectivity',
    summary: 'Dedicated GPS satellite navigation unit available for ₹10/day.',
    details:
      'Dedicated portable GPS units with turn-by-turn guidance, speed camera warnings, and live traffic re-routing are available for ₹10/day. Most fleet vehicles also feature Apple CarPlay and Android Auto.',
    spokenSummary:
      'Dedicated GPS satellite navigation is available for 10 rupees a day, and most of our cars also support Apple CarPlay and Android Auto.',
  },
};

export const AIRPORT_HUBS: Record<string, AirportHubInfo> = {
  sydney: {
    code: 'SYD',
    airportName: 'Sydney Kingsford Smith Airport',
    city: 'Sydney',
    terminals: 'Terminal 1 (International) & Terminal 2/3 (Domestic)',
    deskLocation: 'Arrivals Hall Car Rental concourse, directly opposite Baggage Carousel 3.',
    operatingHours: '05:30 AM – 11:30 PM, 7 days a week',
    shuttleOrWalk: 'Dedicated bays on-site within walking distance from terminal arrivals.',
    afterHoursReturn:
      '24/7 key drop box available at Terminal 1 and Terminal 2 rental return car parks.',
  },
  melbourne: {
    code: 'MEL',
    airportName: 'Melbourne Tullamarine Airport',
    city: 'Melbourne',
    terminals: 'Terminal 1, 2, 3, and 4',
    deskLocation: 'Ground Floor, Terminal 2 International Arrivals concourse.',
    operatingHours: '06:00 AM – 11:00 PM, 7 days a week',
    shuttleOrWalk: 'On-site terminal car park bays, 2 minutes walk from baggage claim.',
    afterHoursReturn: '24/7 key drop box located next to the rental return booth.',
  },
  brisbane: {
    code: 'BNE',
    airportName: 'Brisbane Airport',
    city: 'Brisbane',
    terminals: 'Domestic & International Terminals',
    deskLocation: 'Level 1 Domestic Terminal concourse near central check-in.',
    operatingHours: '06:00 AM – 11:00 PM, 7 days a week',
    shuttleOrWalk: 'Covered pedestrian skywalk directly to vehicle collection bays.',
    afterHoursReturn: '24/7 secure key return slot at terminal drop-off lane.',
  },
  gold_coast: {
    code: 'OOL',
    airportName: 'Gold Coast Airport (Coolangatta)',
    city: 'Gold Coast',
    terminals: 'Main Terminal',
    deskLocation: 'Opposite Domestic Baggage Reclaim Area.',
    operatingHours: '06:30 AM – 10:00 PM, 7 days a week',
    shuttleOrWalk: 'Direct terminal walking access (150m from exit).',
    afterHoursReturn: 'Key drop box at main customer counter.',
  },
  perth: {
    code: 'PER',
    airportName: 'Perth Airport',
    city: 'Perth',
    terminals: 'Terminal 1/2 Precinct & Terminal 3/4 Precinct',
    deskLocation: 'Ground Floor Arrivals Hall in Terminal 1 and Terminal 4.',
    operatingHours: '06:00 AM – Midnight, 7 days a week',
    shuttleOrWalk: 'On-site vehicle parking bays directly outside terminal exits.',
    afterHoursReturn: '24/7 key drop box at car park exit boom-gate.',
  },
  adelaide: {
    code: 'ADL',
    airportName: 'Adelaide Airport',
    city: 'Adelaide',
    terminals: 'Main Terminal',
    deskLocation: 'Ground Floor adjacent to baggage carousels.',
    operatingHours: '06:00 AM – 11:00 PM, 7 days a week',
    shuttleOrWalk: 'Multi-level car park on Ground Level opposite terminal.',
    afterHoursReturn: 'Secure drop box located on Ground Floor car park desk.',
  },
};

/**
 * Intelligent vehicle comparisons grounded in real fleet specs
 */
export const VEHICLE_COMPARISONS: VehicleComparison[] = [
  {
    vehicleA: 'camry',
    vehicleB: 'tucson',
    comparisonText:
      'The 2024 Toyota Camry (Sedan, ₹89/day) offers exceptional hybrid fuel economy and a 524L boot, making it ideal for city and highway cruising. The 2024 Hyundai Tucson (SUV, ₹99/day) provides higher ride height, 539L boot, and versatile family luggage capacity.',
    spokenComparison:
      'The Camry is a sedan at 89 rupees a day with great fuel economy, while the Tucson is an SUV at 99 rupees a day with a higher ride height and slightly more luggage room.',
  },
  {
    vehicleA: 'cx5',
    vehicleB: 'tucson',
    comparisonText:
      'The Mazda CX-5 (₹109/day) features a sporty premium interior and refined handling, while the Hyundai Tucson (₹99/day) offers slightly more luggage room and a more affordable daily rate.',
    spokenComparison:
      'The Mazda CX-5 is 109 rupees a day with sporty handling, whereas the Tucson is 99 rupees a day and slightly more budget-friendly for families.',
  },
  {
    vehicleA: '3series',
    vehicleB: 'cclass',
    comparisonText:
      'Both are flagship German executive sedans. The BMW 3 Series (₹179/day) delivers dynamic rear-wheel performance and M-Sport styling. The Mercedes-Benz C-Class (₹199/day) focuses on ultra-luxurious cabin comfort, ambient lighting, and serene ride quality.',
    spokenComparison:
      'The BMW 3 Series is 179 rupees a day with sporty performance, while the Mercedes C-Class is 199 rupees a day focusing on executive luxury and cabin comfort.',
  },
];
