import { NextRequest } from "next/server";

export interface AIMiddlewareConfig {
  enableAuth?: boolean;
  enableRateLimit?: boolean;
  enableErrorHandling?: boolean;
  enableResponseTransform?: boolean;
  customRules?: string[];
}

export interface RequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  userAgent: string;
  ip: string;
  timestamp: string;
}

export interface AIAnalysis {
  shouldAllow: boolean;
  action: "allow" | "block" | "redirect" | "transform" | "error";
  response?: any;
  reasoning: string;
  modifications?: any;
  statusCode?: number;
  redirectUrl?: string;
}

export interface MiddlewareResult {
  success: boolean;
  analysis: AIAnalysis;
  executionTime: number;
  error?: string;
}
