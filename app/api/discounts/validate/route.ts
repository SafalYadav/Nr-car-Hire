import { NextResponse } from 'next/server';
import { discountService } from '@/lib/services/discount-service';
import { ValidatePromoSchema } from '@/lib/validation/discount';
import { handleError } from '@/lib/utils/errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = ValidatePromoSchema.parse(body);
    const result = await discountService.validatePromo(validated);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
