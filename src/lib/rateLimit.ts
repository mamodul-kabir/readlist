import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: { [key: string]: RateLimitStore } = {};

// Periodic cleanup to avoid memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const key in stores) {
      const store = stores[key];
      for (const ip in store) {
        if (store[ip].resetTime < now) {
          delete store[ip];
        }
      }
    }
  }, 5 * 60 * 1000);
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export function checkRateLimit(
  req: NextRequest,
  bucketName: string,
  maxRequests: number,
  windowMs: number = 60 * 1000
): { success: boolean; response?: NextResponse } {
  const ip = getClientIp(req);
  const now = Date.now();

  if (!stores[bucketName]) {
    stores[bucketName] = {};
  }

  const store = stores[bucketName];
  const record = store[ip];

  if (!record || record.resetTime < now) {
    store[ip] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { success: true };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      ),
    };
  }

  record.count++;
  return { success: true };
}
