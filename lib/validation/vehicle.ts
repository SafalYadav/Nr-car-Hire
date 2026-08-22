import { z } from 'zod';

export const vehicleCategories = ['Sedan', 'SUV', 'Premium', 'Luxury', 'Utility'] as const;
export type VehicleCategory = (typeof vehicleCategories)[number];
export type VehicleCategoryFilter = 'All' | VehicleCategory;

export const vehicleStatuses = [
  'AVAILABLE',
  'RESERVED',
  'RENTED',
  'MAINTENANCE',
  'UNAVAILABLE',
  'INACTIVE',
] as const;
export type VehicleStatus = (typeof vehicleStatuses)[number];

export const vehicleTransmissions = ['Automatic', 'Manual'] as const;
export type VehicleTransmission = (typeof vehicleTransmissions)[number];

export const vehicleFuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const;
export type VehicleFuelType = (typeof vehicleFuelTypes)[number];

export const vehicleSortOptions = ['price-asc', 'price-desc', 'name-asc'] as const;
export type VehicleSortOption = (typeof vehicleSortOptions)[number];

export const maintenanceReasons = [
  'MAINTENANCE',
  'DAMAGE',
  'CLEANING',
  'INSPECTION',
  'ADMIN_HOLD',
] as const;
export type MaintenanceReason = (typeof maintenanceReasons)[number];

// ----------------------------------------------------
// Vehicle Creation Schema
// ----------------------------------------------------
export const VehicleCreateSchema = z.object({
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z
    .number()
    .int()
    .min(2015)
    .max(new Date().getFullYear() + 1),
  category: z.enum(vehicleCategories, {
    message: 'Category must be Sedan, SUV, Premium, Luxury, or Utility',
  }),
  description: z.string().max(1000).optional(),
  seats: z.number().int().min(2).max(12).default(5),
  doors: z.number().int().min(2).max(6).default(4),
  transmission: z.enum(vehicleTransmissions).default('Automatic'),
  fuelType: z.enum(vehicleFuelTypes).default('Petrol'),
  luggage: z.number().int().min(0).max(10).default(3),
  dailyRate: z.number().positive('Daily rate must be greater than 0'),
  location: z.string().min(1, 'Location is required').max(100),
  status: z.enum(vehicleStatuses).default('AVAILABLE'),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().or(z.string().startsWith('/')).nullable().optional(),
  gallery: z.array(z.string()).optional(),
  features: z
    .object({
      seats: z.number().int().optional(),
      transmission: z.enum(vehicleTransmissions).optional(),
      fuelType: z.string().optional(),
      luggage: z.number().int().optional(),
      airConditioning: z.boolean().optional(),
      bluetooth: z.boolean().optional(),
      navigation: z.boolean().optional(),
      cruiseControl: z.boolean().optional(),
      reverseCamera: z.boolean().optional(),
    })
    .passthrough()
    .optional(),
});

export type VehicleCreateInput = z.infer<typeof VehicleCreateSchema>;

// ----------------------------------------------------
// Vehicle Update Schema
// ----------------------------------------------------
export const VehicleUpdateSchema = VehicleCreateSchema.partial();
export type VehicleUpdateInput = z.infer<typeof VehicleUpdateSchema>;

// ----------------------------------------------------
// Vehicle Query / Search / Filter Schema
// ----------------------------------------------------
export const VehicleQuerySchema = z.object({
  search: z.string().max(100).optional(),
  category: z.enum(vehicleCategories).or(z.literal('All')).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  seats: z.coerce.number().int().min(1).optional(),
  transmission: z.enum(vehicleTransmissions).or(z.literal('All')).optional(),
  fuelType: z.enum(vehicleFuelTypes).or(z.literal('All')).optional(),
  location: z.string().max(100).optional(),
  status: z.enum(vehicleStatuses).optional(),
  includeInactive: z.coerce.boolean().default(false),
  sortBy: z.enum(vehicleSortOptions).default('price-asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type VehicleQueryParams = z.infer<typeof VehicleQuerySchema>;

// ----------------------------------------------------
// Availability Query Schema
// ----------------------------------------------------
export const AvailabilityQuerySchema = z
  .object({
    pickupDate: z.coerce.date({ message: 'Valid pickup date required' }),
    dropoffDate: z.coerce.date({ message: 'Valid dropoff date required' }),
    location: z.string().max(100).optional(),
  })
  .refine((data) => data.dropoffDate > data.pickupDate, {
    message: 'Dropoff date must be after pickup date',
    path: ['dropoffDate'],
  });

export type AvailabilityQueryParams = z.infer<typeof AvailabilityQuerySchema>;

// ----------------------------------------------------
// Maintenance Block Schema
// ----------------------------------------------------
export const VehicleMaintenanceCreateSchema = z
  .object({
    vehicleId: z.string().min(1, 'Vehicle ID is required'),
    startDate: z.coerce.date({ message: 'Valid start date required' }),
    endDate: z.coerce.date({ message: 'Valid end date required' }),
    reason: z.enum(maintenanceReasons).default('MAINTENANCE'),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

export type VehicleMaintenanceCreateInput = z.infer<typeof VehicleMaintenanceCreateSchema>;
