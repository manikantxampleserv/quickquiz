import { NextRequest, NextResponse } from "next/server";
import { RequestContext } from "./types";

export function extractRequestContext(request: NextRequest): RequestContext {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    url: request.url,
    method: request.method,
    headers,
    userAgent: request.headers.get("user-agent") || "",
    ip: request.headers.get("x-forwarded-for") || "unknown",
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(
  message: string,
  status: number
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/admin',
    '/api/auth',
    '/login',
    '/register',
    '/public'
  ];
  
  return publicPaths.some(path => pathname.startsWith(path));
}
