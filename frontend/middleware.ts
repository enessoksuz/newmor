import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 404 durumlarını logla
  if (response.status === 404) {
    const url = request.nextUrl.pathname;
    
    // API ve static dosyaları loglamayı atla
    if (!url.startsWith('/api/') && 
        !url.startsWith('/_next/') && 
        !url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      
      try {
        // 404 log'u kaydet
        await fetch(`${request.nextUrl.origin}/api/log-404`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            referrer: request.headers.get('referer') || null,
            userAgent: request.headers.get('user-agent') || null,
          }),
        });
      } catch (error) {
        // Hata olursa sessizce devam et
        console.error('404 log error:', error);
      }
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

