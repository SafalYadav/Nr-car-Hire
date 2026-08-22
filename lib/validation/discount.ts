import { z } from 'zod';

export const discountTypes = ['PERCENTAGE', 'FIXED_AMOUNT'] as const;
export type DiscountType = (typeof discountTypes)[number];

export const DiscountCreateSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Code must contain uppercase letters, numbers, hyphens, or underscores',
    ),
  description: z.string().max(255).optional(),
  discountType: z.enum(discountTypes).default('PERCENTAGE'),
  value: z.number().positive('Discount value must be greater than 0'),
  minBookingValue: z.number().min(0).optional(),
  minRentalDays: z.number().int().min(1).optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().min(1).optional(),
  perCustomerLimit: z.number().int().min(1).default(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  applicableCategories: z.array(z.string()).optional(),
  applicableVehicles: z.array(z.string()).optional(),
});

export type DiscountCreateInput = z.infer<typeof DiscountCreateSchema>;

export const DiscountUpdateSchema = DiscountCreateSchema.partial();
export type DiscountUpdateInput = z.infer<typeof DiscountUpdateSchema>;

export const ValidatePromoSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  category: z.string().min(1, 'Vehicle category is required'),
  rentalDays: z.number().int().min(1),
  baseAmount: z.number().positive(),
  customerId: z.string().optional(),
});

export type ValidatePromoInput = z.infer<typeof ValidatePromoSchema>;
