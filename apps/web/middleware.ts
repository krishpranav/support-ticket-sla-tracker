import { NextResponse, type NextRequest } from "next/server";
export function middleware(request: NextRequest): NextResponse { const protectedPath = ["/dashboard", "/tickets", "/holidays"].some((path) => request.nextUrl.pathname.startsWith(path)); if (protectedPath && !request.cookies.get("support_session")) return NextResponse.redirect(new URL("/login", request.url)); return NextResponse.next(); }
export const config = { matcher: ["/dashboard/:path*", "/tickets/:path*", "/holidays/:path*"] };
