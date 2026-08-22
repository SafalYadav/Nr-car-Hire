import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nerswxfbytxooyxcnvnc.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcnN3eGZieXR4b295eGNudm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTc5MDksImV4cCI6MjEwMjk5MzkwOX0.xAembHmcOfGQS1HqVTnDzPI4HILaLxng6-zggxMYppY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Production Seed Data
const seedVehicles = [
  {
    id: 'v-001-camry',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    category: 'Sedan',
    description:
      'The definitive Australian executive and family sedan. Exceptional fuel economy, smooth ride, and advanced safety assistance.',
    seats: 5,
    doors: 4,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    luggage: 3,
    daily_rate: 89,
    location: 'Sydney',
    status: 'AVAILABLE',
    is_active: true,
    image_url: '/images/vehicles/toyota-camry.jpg',
    gallery: ['/images/vehicles/toyota-camry.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 3,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
  },
  {
    id: 'v-002-cx5',
    make: 'Mazda',
    model: 'CX-5',
    year: 2024,
    category: 'SUV',
    description:
      'A refined mid-size SUV offering premium Japanese craftsmanship, elevated seating, and versatile cargo capacity for family trips.',
    seats: 5,
    doors: 5,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    luggage: 4,
    daily_rate: 109,
    location: 'Melbourne',
    status: 'AVAILABLE',
    is_active: true,
    image_url: '/images/vehicles/mazda-cx5.jpg',
    gallery: ['/images/vehicles/mazda-cx5.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 4,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
  },
  {
    id: 'v-003-3series',
    make: 'BMW',
    model: '3 Series',
    year: 2024,
    category: 'Premium',
    description:
      'The benchmark in sports luxury sedans. Dynamic handling, bespoke leather interior, and cutting-edge digital cockpit technology.',
    seats: 5,
    doors: 4,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    luggage: 3,
    daily_rate: 179,
    location: 'Sydney',
    status: 'AVAILABLE',
    is_active: true,
    image_url: '/images/vehicles/bmw-3series.jpg',
    gallery: ['/images/vehicles/bmw-3series.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 3,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
  },
  {
    id: 'v-004-hilux',
    make: 'Toyota',
    model: 'HiLux',
    year: 2024,
    category: 'Utility',
    description:
      'Australia’s most dependable dual-cab ute. Rugged 4x4 capability, strong towing performance, and heavy-duty utility for regional adventures.',
    seats: 5,
    doors: 4,
    transmission: 'Manual',
    fuel_type: 'Diesel',
    luggage: 2,
    daily_rate: 129,
    location: 'Brisbane',
    status: 'AVAILABLE',
    is_active: true,
    image_url: '/images/vehicles/toyota-hilux.jpg',
    gallery: ['/images/vehicles/toyota-hilux.jpg'],
    features: {
      seats: 5,
      transmission: 'Manual',
      fuelType: 'Diesel',
      luggage: 2,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
  },
  {
    id: 'v-005-cclass',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2024,
    category: 'Luxury',
    description:
      'Prestige and supreme comfort. Engineered for effortless long-distance touring with executive styling and whisper-quiet cabin acoustics.',
    seats: 5,
    doors: 4,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    luggage: 3,
    daily_rate: 199,
    location: 'Perth',
    status: 'AVAILABLE',
    is_active: true,
    image_url: '/images/vehicles/mercedes-cclass.jpg',
    gallery: ['/images/vehicles/mercedes-cclass.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      luggage: 3,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
  },
  {
    id: 'v-006-tucson',
    make: 'Hyundai',
    model: 'Tucson',
    year: 2024,
    category: 'SUV',
    description:
      'Modern hybrid crossover SUV with high fuel efficiency, spacious 5-passenger cabin, and comprehensive active safety suite.',
    seats: 5,
    doors: 5,
    transmission: 'Automatic',
    fuel_type: 'Hybrid',
    luggage: 4,
    daily_rate: 99,
    location: 'Gold Coast',
    status: 'AVAILABLE',
    is_active: true,
    image_url: '/images/vehicles/hyundai-tucson.jpg',
    gallery: ['/images/vehicles/hyundai-tucson.jpg'],
    features: {
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Hybrid',
      luggage: 4,
      airConditioning: true,
      bluetooth: true,
      navigation: true,
      cruiseControl: true,
      reverseCamera: true,
    },
  },
];

const seedMaintenances = [
  {
    id: 'm-seed-001-hilux',
    vehicle_id: 'v-004-hilux',
    start_date: '2026-09-01T00:00:00.000Z',
    end_date: '2026-09-05T23:59:59.999Z',
    reason: 'Scheduled maintenance: transmission rebuild and mechanical inspection',
  },
  {
    id: 'm-seed-002-tucson',
    vehicle_id: 'v-006-tucson',
    start_date: '2026-09-01T00:00:00.000Z',
    end_date: '2026-09-05T23:59:59.999Z',
    reason: 'Scheduled maintenance: 50,000km hybrid battery and brake system overhaul',
  },
];

const seedLocations = [
  {
    id: 'loc-syd-airport',
    code: 'SYD_APT',
    name: 'Sydney Airport Hub (SYD)',
    airport_or_city: 'Sydney Airport',
    address: 'Terminal 1 Arrivals & Car Rental Centre, Mascot NSW 2020',
    state: 'NSW',
    pickup_available: true,
    dropoff_available: true,
    is_active: true,
  },
  {
    id: 'loc-syd-cbd',
    code: 'SYD_CBD',
    name: 'Sydney CBD — Central Station',
    airport_or_city: 'Sydney CBD',
    address: '200 Elizabeth Street, Surry Hills NSW 2010',
    state: 'NSW',
    pickup_available: true,
    dropoff_available: true,
    is_active: true,
  },
  {
    id: 'loc-mel-airport',
    code: 'MEL_APT',
    name: 'Melbourne Tullamarine Airport (MEL)',
    airport_or_city: 'Melbourne Airport',
    address: 'Terminal Drive, Melbourne Airport VIC 3045',
    state: 'VIC',
    pickup_available: true,
    dropoff_available: true,
    is_active: true,
  },
  {
    id: 'loc-bne-airport',
    code: 'BNE_APT',
    name: 'Brisbane Airport (BNE)',
    airport_or_city: 'Brisbane Airport',
    address: 'Airport Drive, Brisbane Airport QLD 4008',
    state: 'QLD',
    pickup_available: true,
    dropoff_available: true,
    is_active: true,
  },
  {
    id: 'loc-per-airport',
    code: 'PER_APT',
    name: 'Perth International Airport (PER)',
    airport_or_city: 'Perth Airport',
    address: 'Airport Way, Redcliffe WA 6105',
    state: 'WA',
    pickup_available: true,
    dropoff_available: true,
    is_active: true,
  },
  {
    id: 'loc-ool-airport',
    code: 'OOL_APT',
    name: 'Gold Coast Airport (OOL)',
    airport_or_city: 'Coolangatta Airport',
    address: 'Eastern Avenue, Bilinga QLD 4225',
    state: 'QLD',
    pickup_available: true,
    dropoff_available: true,
    is_active: true,
  },
];

const seedDiscounts = [
  {
    id: 'disc-save10',
    code: 'SAVE10',
    description: '10% discount on all Australian rentals',
    discount_type: 'PERCENTAGE',
    value: 10,
    min_rental_days: 2,
    max_discount_amount: 100,
    usage_limit: 1000,
    usage_count: 0,
    per_customer_limit: 2,
    is_active: true,
  },
  {
    id: 'disc-weekend50',
    code: 'WEEKEND50',
    description: '₹50 flat discount for bookings over 3 days',
    discount_type: 'FIXED_AMOUNT',
    value: 50,
    min_rental_days: 3,
    min_booking_value: 200,
    usage_limit: 500,
    usage_count: 0,
    per_customer_limit: 1,
    is_active: true,
  },
  {
    id: 'disc-summer15',
    code: 'SUMMER15',
    description: '15% summer holiday discount on Premium & Luxury sedans',
    discount_type: 'PERCENTAGE',
    value: 15,
    min_rental_days: 4,
    applicable_categories: ['Premium', 'Luxury', 'SUV'],
    usage_limit: 250,
    usage_count: 0,
    per_customer_limit: 1,
    is_active: true,
  },
];

const seedExtras = [
  {
    id: 'ext-zero-excess',
    code: 'ZERO_EXCESS',
    name: 'Zero Excess Premium Protection',
    description: 'Comprehensive damage waiver reducing accidental liability to $0',
    pricing_type: 'PER_DAY',
    price: 25,
    icon: 'ShieldCheck',
    is_active: true,
    max_quantity: 1,
  },
  {
    id: 'ext-add-driver',
    code: 'ADD_DRIVER',
    name: 'Additional Authorised Driver',
    description: 'Allow a second eligible licensed driver to operate the vehicle',
    pricing_type: 'FLAT',
    price: 15,
    icon: 'UserPlus',
    is_active: true,
    max_quantity: 2,
  },
  {
    id: 'ext-child-seat',
    code: 'CHILD_SEAT',
    name: 'Child Safety Baby / Booster Seat',
    description:
      'Australian standard AS/NZS 1754 approved rear or forward facing child safety seat',
    pricing_type: 'PER_DAY',
    price: 12,
    icon: 'Baby',
    is_active: true,
    max_quantity: 2,
  },
  {
    id: 'ext-gps',
    code: 'GPS_NAV',
    name: 'GPS Satellite Navigation Unit',
    description: 'Dedicated GPS with live traffic re-routing and speed camera alerts',
    pricing_type: 'PER_DAY',
    price: 10,
    icon: 'Compass',
    is_active: true,
    max_quantity: 1,
  },
  {
    id: 'ext-roadside-plus',
    code: 'ROADSIDE_PLUS',
    name: '24/7 Roadside Assistance Plus',
    description:
      'Covers key loss, flat tyre replacement, jump-starts and emergency towing anywhere in Australia',
    pricing_type: 'PER_DAY',
    price: 8,
    icon: 'Wrench',
    is_active: true,
    max_quantity: 1,
  },
];

export async function migrateSeedToSupabase() {
  console.log('🚀 Starting NR Car Hire Supabase Data Migration...');

  try {
    // 1. Seed Vehicles
    console.log('📦 Seeding Vehicles...');
    const { error: vErr } = await supabase.from('vehicles').upsert(seedVehicles, { onConflict: 'id' });
    if (vErr) console.warn('Vehicle seed note:', vErr.message);
    else console.log(`✅ Upserted ${seedVehicles.length} vehicles.`);

    // 2. Seed Locations
    console.log('📦 Seeding Locations...');
    const { error: lErr } = await supabase.from('locations').upsert(seedLocations, { onConflict: 'id' });
    if (lErr) console.warn('Locations seed note:', lErr.message);
    else console.log(`✅ Upserted ${seedLocations.length} locations.`);

    // 3. Seed Discounts
    console.log('📦 Seeding Discounts...');
    const { error: dErr } = await supabase.from('discounts').upsert(seedDiscounts, { onConflict: 'id' });
    if (dErr) console.warn('Discounts seed note:', dErr.message);
    else console.log(`✅ Upserted ${seedDiscounts.length} discounts.`);

    // 4. Seed Extras
    console.log('📦 Seeding Extras...');
    const { error: eErr } = await supabase.from('extras').upsert(seedExtras, { onConflict: 'id' });
    if (eErr) console.warn('Extras seed note:', eErr.message);
    else console.log(`✅ Upserted ${seedExtras.length} extras.`);

    // 5. Seed Maintenances
    console.log('📦 Seeding Maintenances...');
    const { error: mErr } = await supabase.from('vehicle_maintenances').upsert(seedMaintenances, { onConflict: 'id' });
    if (mErr) console.warn('Maintenances seed note:', mErr.message);
    else console.log(`✅ Upserted ${seedMaintenances.length} maintenances.`);

    console.log('🎉 Supabase Data Migration Complete!');
    return { success: true };
  } catch (err: unknown) {
    console.error('❌ Migration Error:', err);
    return { success: false, error: err };
  }
}

if (process.argv[1] && process.argv[1].includes('migrate-seed-supabase')) {
  migrateSeedToSupabase();
}
