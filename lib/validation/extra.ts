import { z } from 'zod';

export const extraPricingTypes = ['PER_DAY', 'FLAT'] as const;
export type ExtraPricingType = (typeof extraPricingTypes)[number];

export const ExtraCreateSchema = z.object({
  code: z.string().min(2).max(30),
  name: z.string().min(2, 'Name is required').max(100),
  description: z.string().max(255).optional(),
  pricingType: z.enum(extraPricingTypes).default('PER_DAY'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  maxQuantity: z.number().int().min(1).max(5).default(1),
});

export type ExtraCreateInput = z.infer<typeof ExtraCreateSchema>;

export const ExtraUpdateSchema = ExtraCreateSchema.partial();
export type ExtraUpdateInput = z.infer<typeof ExtraUpdateSchema>;

export const SelectedExtraItemSchema = z.object({
  extraId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  pricingType: z.enum(extraPricingTypes),
  price: z.number().min(0),
  quantity: z.number().int().min(1).default(1),
});

export type SelectedExtraItem = z.infer<typeof SelectedExtraItemSchema>;
