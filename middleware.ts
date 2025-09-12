import { NextRequest } from "next/server";
import {
  processAIMiddleware,
  createAIMiddlewareConfig,
} from "./middleware/ai-middleware";
import { isPublicPath } from "./middleware/utils";

// Initialize AI Middleware configuration
const aiConfig = createAIMiddlewareConfig({
  enableAuth: true,
  enableRateLimit: true,
  enableErrorHandling: true,
  enableResponseTransform: true,
  customRules: [
    "Block suspicious bot traffic",
    "Allow authenticated users to protected routes",
    "Transform response format for mobile clients",
    "Rate limit based on user tier",
  ],
});

export async function middleware(request: NextRequest) {
  // Skip middleware for public paths
  console.log("Middleware called for path:", request.nextUrl.pathname);
  if (isPublicPath(request.nextUrl.pathname)) {
    return;
  }

  // Process request through AI middleware
  const result = await processAIMiddleware(request, aiConfig);
  console.log("AI middleware result:", result);
  if (result) {
    console.log("AI middleware result:", result);
    return result;
  }

  // If no result returned, continue to next middleware/handler
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
