import { discountStore, type DiscountRecord } from '@/lib/db/discount-store';
import {
  ValidatePromoSchema,
  type ValidatePromoInput,
  type DiscountCreateInput,
  type DiscountUpdateInput,
} from '@/lib/validation/discount';
import { NotFoundError } from '@/lib/utils/errors';

export interface PromoValidationResult {
  isValid: boolean;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  discountAmount: number;
  message: string;
}

export class DiscountService {
  /**
   * Validate a promotional discount code and calculate discount amount authoritatively.
   */
  public async validatePromo(input: ValidatePromoInput): Promise<PromoValidationResult> {
    const validated = ValidatePromoSchema.parse(input);
    const code = validated.code.toUpperCase().trim();

    const promo = await discountStore.findByCode(code);
    if (!promo || !promo.isActive) {
      return {
        isValid: false,
        code,
        discountType: 'PERCENTAGE',
        value: 0,
        discountAmount: 0,
        message: 'Invalid or inactive promotional code',
      };
    }

    const now = new Date();

    // Check date boundaries
    if (promo.startDate && promo.startDate > now) {
      return {
        isValid: false,
        code,
        discountType: promo.discountType,
        value: promo.value,
        discountAmount: 0,
        message: 'This promotional code is not active yet',
      };
    }

    if (promo.endDate && promo.endDate < now) {
      return {
        isValid: false,
        code,
        discountType: promo.discountType,
        value: promo.value,
        discountAmount: 0,
        message: 'This promotional code has expired',
      };
    }

    // Check overall usage limit
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return {
        isValid: false,
        code,
        discountType: promo.discountType,
        value: promo.value,
        discountAmount: 0,
        message: 'This promotional code has reached its maximum usage limit',
      };
    }

    // Check minimum rental days
    if (promo.minRentalDays && validated.rentalDays < promo.minRentalDays) {
      return {
        isValid: false,
        code,
        discountType: promo.discountType,
        value: promo.value,
        discountAmount: 0,
        message: `This promo code requires a minimum rental period of ${promo.minRentalDays} days`,
      };
    }

    // Check minimum booking value
    if (promo.minBookingValue && validated.baseAmount < promo.minBookingValue) {
      return {
        isValid: false,
        code,
        discountType: promo.discountType,
        value: promo.value,
        discountAmount: 0,
        message: `This promo code requires a minimum booking spend of ₹${promo.minBookingValue}`,
      };
    }

    // Check category restrictions
    if (promo.applicableCategories && promo.applicableCategories.length > 0) {
      if (!promo.applicableCategories.includes(validated.category)) {
        return {
          isValid: false,
          code,
          discountType: promo.discountType,
          value: promo.value,
          discountAmount: 0,
          message: `This promo code is only valid for ${promo.applicableCategories.join(', ')} categories`,
        };
      }
    }

    // Check vehicle restrictions
    if (promo.applicableVehicles && promo.applicableVehicles.length > 0) {
      if (!promo.applicableVehicles.includes(validated.vehicleId)) {
        return {
          isValid: false,
          code,
          discountType: promo.discountType,
          value: promo.value,
          discountAmount: 0,
          message: 'This promo code is not applicable to the selected vehicle',
        };
      }
    }

    // Calculate Authoritative Discount Amount
    let discountAmount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discountAmount = (validated.baseAmount * promo.value) / 100;
      if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
        discountAmount = promo.maxDiscountAmount;
      }
    } else {
      discountAmount = promo.value;
    }

    // Ensure discount never exceeds the base amount
    discountAmount = Math.min(discountAmount, validated.baseAmount);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      isValid: true,
      code,
      discountType: promo.discountType,
      value: promo.value,
      discountAmount,
      message: `Promo code ${code} applied successfully! (₹${discountAmount} off)`,
    };
  }

  public async listDiscounts(): Promise<DiscountRecord[]> {
    return discountStore.list();
  }

  public async createDiscount(input: DiscountCreateInput): Promise<DiscountRecord> {
    return discountStore.create(input);
  }

  public async updateDiscount(id: string, input: DiscountUpdateInput): Promise<DiscountRecord> {
    const updated = await discountStore.update(id, input);
    if (!updated) throw new NotFoundError(`Discount with ID "${id}" not found`);
    return updated;
  }

  public async toggleDiscount(id: string, isActive: boolean): Promise<DiscountRecord> {
    const toggled = await discountStore.toggleStatus(id, isActive);
    if (!toggled) throw new NotFoundError(`Discount with ID "${id}" not found`);
    return toggled;
  }

  public async applyPromoUsage(code: string): Promise<void> {
    await discountStore.incrementUsage(code);
  }
}

export const discountService = new DiscountService();
