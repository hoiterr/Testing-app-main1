// Vercel Serverless Function: /api/ai.ts
// This is our secure backend endpoint for all Gemini AI operations.

import { IncomingMessage, ServerResponse } from 'http';

// Custom response class that implements our required methods
class ApiResponse extends ServerResponse {
  statusCode: number = 200;
  
  status(code: number): this {
    this.statusCode = code;
    return this;
  }
  
  json(body: any): void {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(body));
  }
  
  send(body: any): void {
    if (typeof body === 'object') {
      this.json(body);
    } else {
      this.end(body);
    }
  }
  
  redirect(url: string): void {
    this.writeHead(302, { Location: url });
    this.end();
  }
}

// Request type
type ApiRequest = IncomingMessage & {
  body: any;
  method?: string;
  query: {
    [key: string]: string | string[] | undefined;
  };
  cookies: {
    [key: string]: string;
  };
  headers: NodeJS.Dict<string | string[]>;
  socket: any;
};
import { 
  analyzePob, 
  preflightCheckPob, 
  generateLootFilter, 
  runSimulation, 
  generateCraftingPlan, 
  generateFarmingStrategy, 
  getMetagamePulse, 
  compareAnalyses, 
  generateBuildGuide, 
  generateLevelingPlan, 
  tuneBuildForContent, 
  generateBossingStrategy, 
  scoreBuildForLibrary, 
  convertPoeJsonToPobXml
} from './geminiService';
import { logService } from '@/services/logService';
import { apiRequestSchema } from '@/schemas/apiSchemas';
import type { 
  PoeAnalysisResult, 
  PoeApiBuildData, 
  AnalysisGoal,
  TuningGoal 
} from '../src/types';

// Type guard to check if an object is a valid PoeAnalysisResult
function isPoeAnalysisResult(obj: unknown): obj is PoeAnalysisResult {
  if (typeof obj !== 'object' || obj === null) return false;
  const analysis = obj as Record<string, unknown>;
  return (
    typeof analysis.buildTitle === 'string' &&
    typeof analysis.overallSummary === 'string' &&
    'keyStats' in analysis &&
    'gearAnalysis' in analysis
  );
}

// Type guard to check if an object is a valid PoeApiBuildData
function isPoeApiBuildData(obj: unknown): obj is PoeApiBuildData {
  if (typeof obj !== 'object' || obj === null) return false;
  const buildData = obj as Record<string, unknown>;
  return 'character' in buildData && buildData.character !== null;
}

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Rate limiting configuration
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  // Per-endpoint limits (requests per window)
  ENDPOINT_LIMITS: {
    '/api/ai/analyze': 30,
    '/api/ai/simulate': 20,
    '/api/ai/upgrade': 50,
    DEFAULT: 100
  }
} as const;

// In-memory rate limit store (fallback if Redis is not available)
const inMemoryRateLimit = new Map<string, { count: number; resetTime: number }>();

// Initialize Redis if available
let redis: any = null;
let rateLimiter: any = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT.MAX_REQUESTS, `${RATE_LIMIT.WINDOW_MS}ms`),
      analytics: true,
      prefix: 'rate-limit:ai',
    });
    
    logService.info('Redis rate limiter initialized successfully');
  } catch (error) {
    logService.error('Failed to initialize Redis rate limiter, falling back to in-memory', { error });
  }
}

interface RateLimitResult {
  isRateLimited: boolean;
  retryAfter: number;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

/**
 * Check if a request from the given IP is rate limited using Redis if available, otherwise fallback to in-memory
 */
async function checkRateLimit(ip: string, endpoint: string): Promise<RateLimitResult> {
  const now = Date.now();
  const limit = RATE_LIMIT.ENDPOINT_LIMITS[endpoint as keyof typeof RATE_LIMIT.ENDPOINT_LIMITS] || 
               RATE_LIMIT.ENDPOINT_LIMITS.DEFAULT;
  
  // Default response for when rate limiting is not available
  const defaultResponse = (isLimited: boolean): RateLimitResult => ({
    isRateLimited: isLimited,
    retryAfter: isLimited ? RATE_LIMIT.WINDOW_MS / 1000 : 0,
    limit,
    remaining: isLimited ? 0 : limit - 1,
    reset: now + RATE_LIMIT.WINDOW_MS,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': isLimited ? '0' : (limit - 1).toString(),
      'X-RateLimit-Reset': Math.ceil((now + RATE_LIMIT.WINDOW_MS) / 1000).toString(),
    },
  });

  // Try Redis rate limiter first if available
  if (rateLimiter) {
    try {
      const result = await rateLimiter.limit(`${ip}:${endpoint}`);
      const remaining = Math.max(0, limit - result.pending);
      
      return {
        isRateLimited: !result.success,
        retryAfter: result.success ? 0 : Math.ceil((result.reset - now) / 1000),
        limit,
        remaining,
        reset: result.reset,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
        },
      };
    } catch (error) {
      logService.error('Redis rate limit check failed', { error });
      // Fall through to in-memory rate limiting
    }
  }

  // Fallback to in-memory rate limiting
  const key = `${ip}:${endpoint}`;
  const current = inMemoryRateLimit.get(key) || { 
    count: 0, 
    resetTime: now + RATE_LIMIT.WINDOW_MS 
  };

  // Reset the counter if the window has passed
  if (now >= current.resetTime) {
    current.count = 0;
    current.resetTime = now + RATE_LIMIT.WINDOW_MS;
  }

  current.count++;
  inMemoryRateLimit.set(key, current);

  const isRateLimited = current.count > limit;
  const result = defaultResponse(isRateLimited);
  
  // Update remaining based on current count
  result.remaining = Math.max(0, limit - current.count);
  result.headers['X-RateLimit-Remaining'] = result.remaining.toString();
  
  return result;
}

// Custom error class for API errors
class ApiError extends Error {
    statusCode: number;
    details?: any;
    
    constructor(message: string, statusCode: number, details?: any) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Helper function to send error responses
function sendErrorResponse(res: ApiResponse, error: Error | ApiError) {
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message = error.message || 'Internal server error';
    
    // Log the error with appropriate level
    const logData = {
        error: message,
        statusCode,
        stack: error.stack,
        ...(error instanceof ApiError ? { details: error.details } : {})
    };
    
    // Use logService with appropriate log level based on status code
    if (statusCode >= 500) {
        logService.error('Server error', logData);
    } else {
        logService.info('Client error', logData);
    }
    
    // Send error response
    return res.status(statusCode).json({
        error: message,
        details: error instanceof ApiError ? error.details : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
}

// Main API handler
export default async function handler(request: ApiRequest, response: ApiResponse) {
  // Initialize request timeout
  const requestTimeout = setTimeout(() => {
    logService.error('Request timed out');
  }, 29000); // 29 seconds (Vercel has a 30s timeout)

  try {
    // Set security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response.status(204).end();
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return response.status(405).json({ 
        error: 'Method not allowed',
        allowedMethods: ['POST']
      });
    }
    
    // Signal is available via controller.signal for any async operations

    // Get client IP with proper header handling
    const clientIp = (
      (Array.isArray(request.headers['x-forwarded-for']) 
        ? request.headers['x-forwarded-for'][0] 
        : request.headers['x-forwarded-for']) || 
      request.socket.remoteAddress ||
      'unknown'
    ).split(',')[0].trim();

    // Check rate limit
    const endpoint = request.url?.split('?')[0] || '/api/ai';
    const rateLimit = await checkRateLimit(clientIp, endpoint);
    
    // Set rate limit headers
    Object.entries(rateLimit.headers).forEach(([key, value]) => {
      response.setHeader(key, value);
    });
    
    if (rateLimit.isRateLimited) {
      logService.error('Rate limit exceeded', { 
        ip: clientIp, 
        endpoint,
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: new Date(rateLimit.reset).toISOString()
      });
      
      response.setHeader('Retry-After', rateLimit.retryAfter.toString());
      return response.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${rateLimit.retryAfter} seconds.`,
        retryAfter: rateLimit.retryAfter,
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset
      });
    }

    try {
    // Validate content type
    const contentType = request.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new ApiError('Content type must be application/json', 415);
    }

    // Parse and validate request body
    if (!request.body) {
      throw new ApiError('Request body is required', 400);
    }

    // Parse the request body if it's a string (Next.js sometimes parses it, sometimes not)
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

    // Validate the request against our schema
    const result = apiRequestSchema.safeParse(body);
    
    if (!result.success) {
      throw new ApiError('Invalid request data', 400, result.error.format());
    }

    const { action, data } = result.data;
    
    // Log the request (redacting sensitive data)
    const logData = { ...data } as Record<string, unknown>;
    if ('pobData' in logData) logData.pobData = '[REDACTED]';
    if ('buildData' in logData) logData.buildData = '[REDACTED]';
    
    logService.info(`Processing ${action} request`, { 
      action,
      data: logData,
      ip: clientIp 
    });

    let resultData: unknown;

    try {
      switch (action) {
        case 'analyzePob': {
          const { pobData, pobUrl, leagueContext, analysisGoal } = data;
          if (!pobData) throw new ApiError('pobData is required', 400);
          
          // Validate pobData is a non-empty string (raw PoB XML/code)
          if (typeof pobData !== 'string' || pobData.trim().length === 0) {
            throw new ApiError('pobData must be a non-empty string', 400);
          }
          const validGoals: AnalysisGoal[] = ['All-Rounder', 'Mapping', 'Bossing'];
          const goal = (analysisGoal && validGoals.includes(analysisGoal as AnalysisGoal) 
            ? analysisGoal as AnalysisGoal 
            : 'All-Rounder');
              
          resultData = await analyzePob(
            pobData, 
            pobUrl || '', 
            leagueContext || 'Standard', 
            goal
          );
          break;
        }
          
        case 'preflightCheckPob':
          if (!data.pobData) throw new ApiError('pobData is required', 400);
          resultData = await preflightCheckPob(data.pobData);
          break;
          
        
          
        case 'generateLootFilter': {
          if (!data.analysis || typeof data.analysis !== 'object') {
            throw new ApiError('Valid analysis data is required', 400);
          }
          // Type assertion with validation
          if (!isPoeAnalysisResult(data.analysis)) {
            throw new ApiError('Invalid analysis data format', 400);
          }
          const analysis = data.analysis as PoeAnalysisResult;
          resultData = await generateLootFilter(analysis, data.leagueContext || 'Standard');
          break;
        }
          
        case 'runSimulation': {
          const { pobData, pobUrl, leagueContext } = data;
          if (!pobData) throw new ApiError('pobData is required', 400);
          resultData = await runSimulation(pobData, pobUrl || '', leagueContext || 'Standard');
          break;
        }
          
        case 'generateCraftingPlan': {
          const { pobData, slot, leagueContext } = data;
          if (!pobData || !slot) throw new ApiError('pobData and slot are required', 400);
          resultData = await generateCraftingPlan(pobData, slot, leagueContext || 'Standard');
          break;
        }
          
        case 'generateFarmingStrategy': {
          const { pobData, craftingCost, leagueContext } = data;
          if (!pobData) throw new ApiError('pobData is required', 400);
          resultData = await generateFarmingStrategy(pobData, String(craftingCost || '0'), leagueContext || 'Standard');
          break;
        }
          
        case 'getMetagamePulse':
          resultData = await getMetagamePulse(data.leagueContext || 'Standard');
          break;
          
        case 'compareAnalyses': {
          if (!data.analysisA || !data.analysisB || 
              typeof data.analysisA !== 'object' || typeof data.analysisB !== 'object') {
            throw new ApiError('Two valid analysis objects are required', 400);
          }
          // Type assertion with validation
          if (!isPoeAnalysisResult(data.analysisA) || !isPoeAnalysisResult(data.analysisB)) {
            throw new ApiError('Invalid analysis data format', 400);
          }
          const analysisA = data.analysisA as PoeAnalysisResult;
          const analysisB = data.analysisB as PoeAnalysisResult;
          resultData = await compareAnalyses(analysisA, analysisB);
          break;
        }
          
        case 'generateBuildGuide': {
          if (!data.analysis || typeof data.analysis !== 'object') {
            throw new ApiError('Valid analysis data is required', 400);
          }
          // Type assertion with validation
          if (!isPoeAnalysisResult(data.analysis)) {
            throw new ApiError('Invalid analysis data format', 400);
          }
          const analysis = data.analysis as PoeAnalysisResult;
          resultData = await generateBuildGuide(analysis);
          break;
        }
          
        case 'generateLevelingPlan': {
          if (!data.pobData) throw new ApiError('pobData is required', 400);
          resultData = await generateLevelingPlan(data.pobData, data.leagueContext || 'Standard');
          break;
        }
          
        case 'tuneBuildForContent': {
          if (!data.analysis || typeof data.analysis !== 'object' || !data.goal) {
            throw new ApiError('Valid analysis and goal are required', 400);
          }
          // Type assertion with validation
          if (!isPoeAnalysisResult(data.analysis)) {
            throw new ApiError('Invalid analysis data format', 400);
          }
          
          // Validate TuningGoal
          const validTuningGoals: TuningGoal[] = ['Simulacrum', 'Deep Delve', 'Legion Farming', 'Boss Rushing'];
          const goal = (validTuningGoals.includes(data.goal as TuningGoal))
            ? data.goal as TuningGoal
            : 'Simulacrum';
            
          const analysis = data.analysis as PoeAnalysisResult;
          resultData = await tuneBuildForContent(
            analysis, 
            goal, 
            data.leagueContext || 'Standard'
          );
          break;
        }
          
        case 'generateBossingStrategy': {
          if (!data.analysis || typeof data.analysis !== 'object') {
            throw new ApiError('Valid analysis data is required', 400);
          }
          // Type assertion with validation
          if (!isPoeAnalysisResult(data.analysis)) {
            throw new ApiError('Invalid analysis data format', 400);
          }
          const analysis = data.analysis as PoeAnalysisResult;
          resultData = await generateBossingStrategy(analysis);
          break;
        }
          
        case 'scoreBuildForLibrary': {
          if (!data.analysis || typeof data.analysis !== 'object') {
            throw new ApiError('Valid analysis data is required', 400);
          }
          // Type assertion with validation
          if (!isPoeAnalysisResult(data.analysis)) {
            throw new ApiError('Invalid analysis data format', 400);
          }
          const analysis = data.analysis as PoeAnalysisResult;
          resultData = await scoreBuildForLibrary(analysis);
          break;
        }
          
        case 'convertPoeJsonToPobXml': {
          if (!data.buildData || typeof data.buildData !== 'object' || !('character' in data.buildData)) {
            throw new ApiError('Valid build data is required', 400);
          }
          // Type assertion with validation
          if (!isPoeApiBuildData(data.buildData)) {
            throw new ApiError('Invalid build data format', 400);
          }
          resultData = await convertPoeJsonToPobXml(data.buildData);
          break;
        }
        
        default:
          throw new ApiError(`Unsupported action: ${action}`, 400);
      }

      // If we have a result, send it back
      if (resultData !== undefined) {
        return response.status(200).json(resultData);
      }
      
      // If we get here, no action was matched
      throw new ApiError('No action specified or action not implemented', 400);
      
    } catch (error: unknown) {
      // Handle any errors that occur during request processing
      if (error instanceof Error) {
        if (error.name === 'AbortError' || /aborted|timeout/i.test(error.message)) {
          return sendErrorResponse(response, new ApiError('Request timed out', 504));
        }
        
        if (error instanceof ApiError) {
          return sendErrorResponse(response, error);
        }
        
        // Log unexpected errors with stack trace
        logService.error('Unexpected error processing request', { 
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      } else {
        logService.error('Unexpected non-Error thrown', { error: String(error) });
      }
      
      return sendErrorResponse(response, new ApiError('Internal server error', 500));
    }
  } catch (error: unknown) {
    // Handle any errors in the outer try block
    if (error instanceof Error) {
      logService.error('Error in API handler', { 
        message: error.message,
        name: error.name,
        stack: error.stack 
      });
    }
    return sendErrorResponse(response, error instanceof Error ? error : new Error('Unknown error'));
  } finally {
    // Clear the timeout to prevent memory leaks
    clearTimeout(requestTimeout);
  }
}
