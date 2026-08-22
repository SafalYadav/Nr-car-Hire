import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/rbac';
import { uploadVehicleImage } from '@/lib/db/storage';
import { handleError } from '@/lib/utils/errors';

export async function POST(req: Request) {
  try {
    await requireAdmin(req);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const vehicleId = (formData.get('vehicleId') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const result = await uploadVehicleImage(vehicleId, buffer, file.name, file.type);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        path: result.path,
        fileName: file.name,
      },
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
