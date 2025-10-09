import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // WordPress resimlerine 301 redirect
  if (pathname.startsWith('/wp-content/uploads/')) {
    const wpUrl = `https://morfikirler.com${pathname}`;
    return NextResponse.redirect(wpUrl, 301);
  }

  // Yazar sayfalarına 301 redirect
  if (pathname.startsWith('/yazar/')) {
    const wpUrl = `https://morfikirler.com${pathname}`;
    return NextResponse.redirect(wpUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/wp-content/uploads/:path*',
    '/yazar/:path*',
  ],
};
