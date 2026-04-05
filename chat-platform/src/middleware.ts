import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPaths = ['/chat', '/rooms', '/profile', '/notifications', '/admin', '/moderator'];
const authPaths = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Check if path is protected
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  // Admin panel protection
  if (pathname.startsWith('/admin')) {
    const roleLevel = (token as any)?.roleLevel || 0;
    if (roleLevel < 90) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  // Moderator panel protection
  if (pathname.startsWith('/moderator')) {
    const roleLevel = (token as any)?.roleLevel || 0;
    if (roleLevel < 50) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/chat/:path*', '/rooms/:path*', '/profile/:path*', '/notifications/:path*', '/admin/:path*', '/moderator/:path*', '/login', '/register'],
};
