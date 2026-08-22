import { NextResponse } from 'next/server';
import { adminService } from '@/lib/services/admin-service';
import { requireAdmin } from '@/lib/auth/rbac';
import { handleError } from '@/lib/utils/errors';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const metrics = await adminService.getDashboardMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
