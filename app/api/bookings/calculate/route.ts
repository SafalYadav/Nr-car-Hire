import { NextResponse } from 'next/server';
import { bookingService } from '@/lib/services/booking-service';
import { CalculateQuoteSchema } from '@/lib/validation/booking';
import { handleError } from '@/lib/utils/errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = CalculateQuoteSchema.parse(body);
    const quote = await bookingService.calculateQuote(validated);

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
