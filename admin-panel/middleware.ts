import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

async function verifyTokenMiddleware(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
}

// Korunmayan sayfalar
const publicPaths = ['/morpanel'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public path'leri kontrol et
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Token'ı kontrol et
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Token yoksa login'e yönlendir
    return NextResponse.redirect(new URL('/morpanel', request.url));
  }

  // Token'ı doğrula
  const isValid = await verifyTokenMiddleware(token);

  if (!isValid) {
    // Geçersiz token, login'e yönlendir
    const response = NextResponse.redirect(new URL('/morpanel', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  // Token geçerli, devam et
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

