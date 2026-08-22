import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(_request: NextRequest) {
  // Foundation for rate limiting and global auth checks
  // Rate limiting requires external storage (e.g., Redis) to work correctly in serverless
  // Setting up header passing here for future tracking

  const response = NextResponse.next();

  // Example placeholder for ip-based rate limiting preparation
  // const ip = request.ip ?? '127.0.0.1';
  // const rateLimitStatus = await checkRateLimit(ip);
  // if (!rateLimitStatus.success) { return new NextResponse('Too Many Requests', { status: 429 }); }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> will handle separately if needed
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
