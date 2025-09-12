import { NextRequest, NextResponse } from "next/server";
import { analyzeRequest } from "../lib/gemini";
import { AIMiddlewareConfig, RequestContext, MiddlewareResult } from "./types";
import { extractRequestContext, createErrorResponse } from "./utils";

// Global state for caching and rate limiting
const requestCount = new Map<string, number>();
const cache = new Map<string, any>();
const lastRequestTime = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MIN_REQUEST_INTERVAL = 1000; // 1 second between AI calls

// Initialize configuration
export function createAIMiddlewareConfig(
  config: AIMiddlewareConfig = {}
): AIMiddlewareConfig {
  return {
    enableAuth: true,
    enableRateLimit: true,
    enableErrorHandling: true,
    enableResponseTransform: true,
    ...config,
  };
}

// Main processing function
export async function processAIMiddleware(
  request: NextRequest,
  config: AIMiddlewareConfig
): Promise<NextResponse | null> {
  const startTime = Date.now();

  try {
    const context = extractRequestContext(request);
    const cacheKey = generateCacheKey(context);

    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log("🚀 Using cached AI decision");
      return executeAction(cached, request);
    }

    // Rate limit AI calls
    if (!shouldMakeAICall(context.ip)) {
      console.log("⏱️ AI call rate limited, using fallback logic");
      return fallbackLogic(context, request);
    }

    // Make AI call
    const analysis = await analyzeRequest(
      {
        context,
        config,
        requestHistory: getRequestHistory(context.ip),
      },
      buildAnalysisContext(context, config)
    );

    // Cache the result
    setCache(cacheKey, analysis);
    lastRequestTime.set(context.ip, Date.now());

    const result = await executeAction(analysis, request);

    logResult({
      success: true,
      analysis,
      executionTime: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    console.error("AI Middleware Error:", error);
    return handleError(error, request);
  }
}

// Cache functions
function generateCacheKey(context: RequestContext): string {
  return `${context.method}-${context.url}-${context.userAgent.substring(
    0,
    20
  )}`;
}

function getFromCache(key: string): any {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// Rate limiting functions
function shouldMakeAICall(ip: string): boolean {
  const lastCall = lastRequestTime.get(ip);
  return !lastCall || Date.now() - lastCall > MIN_REQUEST_INTERVAL;
}

function getRequestHistory(ip: string): number {
  return requestCount.get(ip) || 0;
}

function updateRequestCount(ip: string): void {
  const current = requestCount.get(ip) || 0;
  requestCount.set(ip, current + 1);
}

// Fallback logic function
function fallbackLogic(
  context: RequestContext,
  request: NextRequest
): NextResponse | null {
  // Simple rule-based fallback when AI is unavailable
  const suspiciousPatterns = [
    "DROP TABLE",
    "SELECT * FROM",
    "../../../",
    "<script>",
    "eval(",
    "javascript:",
  ];

  const requestStr = JSON.stringify(context).toLowerCase();
  const isSuspicious = suspiciousPatterns.some((pattern) =>
    requestStr.includes(pattern.toLowerCase())
  );

  if (isSuspicious) {
    return new NextResponse(
      JSON.stringify({
        error: "Request blocked by security rules",
        reason: "Suspicious pattern detected",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Allow request to continue
  console.log("✅ Fallback logic: Request allowed");
  return null;
}

// Analysis context builder
function buildAnalysisContext(
  context: RequestContext,
  config: AIMiddlewareConfig
): string {
  const contextParts = [];

  if (config.enableAuth) {
    contextParts.push(
      "AUTHENTICATION: Analyze if user has valid authentication"
    );
  }

  if (config.enableRateLimit) {
    contextParts.push("RATE_LIMITING: Check if request exceeds rate limits");
  }

  if (config.enableErrorHandling) {
    contextParts.push(
      "ERROR_HANDLING: Identify potential errors and handle appropriately"
    );
  }

  if (config.enableResponseTransform) {
    contextParts.push(
      "RESPONSE_TRANSFORM: Determine if response needs transformation"
    );
  }

  if (config.customRules) {
    contextParts.push(`CUSTOM_RULES: ${config.customRules.join(", ")}`);
  }

  return contextParts.join(" | ");
}

// Action execution function
async function executeAction(
  analysis: any,
  request: NextRequest
): Promise<NextResponse | null> {
  switch (analysis.action) {
    case "block":
      return new NextResponse(
        JSON.stringify({
          error: "Request blocked by AI middleware",
          reason: analysis.reasoning,
        }),
        {
          status: analysis.statusCode || 403,
          headers: { "Content-Type": "application/json" },
        }
      );

    case "redirect":
      return NextResponse.redirect(
        new URL(analysis.redirectUrl || "/", request.url)
      );

    case "transform":
      // Apply transformations to the request
      transformRequest(request, analysis.modifications);
      return null; // Let the request continue with modifications

    case "error":
      return createErrorResponse(analysis.reasoning, 500);

    case "allow":
    default:
      // Update request count for rate limiting
      updateRequestCount(extractRequestContext(request).ip);
      return null; // Continue to next middleware/handler
  }
}

// Request transformation function
function transformRequest(
  request: NextRequest,
  modifications: any
): NextRequest {
  // Apply AI-suggested modifications to the request
  if (modifications?.headers) {
    Object.entries(modifications.headers).forEach(([key, value]) => {
      request.headers.set(key, value as string);
    });
  }
  return request;
}

// Error handling function
function handleError(error: any, request: NextRequest): NextResponse {
  return createErrorResponse(
    `AI Middleware Error: ${
      error instanceof Error ? error.message : String(error)
    }`,
    500
  );
}

// Logging function
function logResult(result: MiddlewareResult): void {
  console.log("AI Middleware Result:", {
    timestamp: new Date().toISOString(),
    ...result,
  });
}
