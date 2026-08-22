import { extraStore, type ExtraRecord } from '@/lib/db/extra-store';
import type { SelectedExtraItem, ExtraCreateInput, ExtraUpdateInput } from '@/lib/validation/extra';
import { NotFoundError } from '@/lib/utils/errors';

export interface ExtraCalculationResult {
  items: SelectedExtraItem[];
  totalExtrasAmount: number;
}

export class ExtraService {
  public async listActiveExtras(): Promise<ExtraRecord[]> {
    return extraStore.list(true);
  }

  public async listAllExtras(): Promise<ExtraRecord[]> {
    return extraStore.list(false);
  }

  public async createExtra(input: ExtraCreateInput): Promise<ExtraRecord> {
    return extraStore.create(input);
  }

  public async updateExtra(id: string, input: ExtraUpdateInput): Promise<ExtraRecord> {
    const updated = await extraStore.update(id, input);
    if (!updated) throw new NotFoundError(`Extra with ID "${id}" not found`);
    return updated;
  }

  public async toggleExtra(id: string, isActive: boolean): Promise<ExtraRecord> {
    const toggled = await extraStore.toggleStatus(id, isActive);
    if (!toggled) throw new NotFoundError(`Extra with ID "${id}" not found`);
    return toggled;
  }

  /**
   * Authoritatively calculate extras total for a given rental duration
   */
  public async calculateExtras(
    selectedExtras: SelectedExtraItem[],
    rentalDays: number,
  ): Promise<ExtraCalculationResult> {
    let totalExtrasAmount = 0;
    const validatedItems: SelectedExtraItem[] = [];

    for (const item of selectedExtras) {
      const extra = await extraStore.findById(item.extraId);
      if (!extra || !extra.isActive) continue;

      const quantity = Math.max(1, Math.min(item.quantity || 1, extra.maxQuantity || 1));
      let itemCost = 0;

      if (extra.pricingType === 'PER_DAY') {
        itemCost = extra.price * quantity * rentalDays;
      } else {
        itemCost = extra.price * quantity;
      }

      totalExtrasAmount += itemCost;
      validatedItems.push({
        extraId: extra.id,
        code: extra.code,
        name: extra.name,
        pricingType: extra.pricingType,
        price: extra.price,
        quantity,
      });
    }

    return {
      items: validatedItems,
      totalExtrasAmount: Math.round(totalExtrasAmount * 100) / 100,
    };
  }
}

export const extraService = new ExtraService();
