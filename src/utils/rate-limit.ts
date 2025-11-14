// Simple client-side rate limiting to prevent excessive requests
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export function getRemainingTime(key: string): number {
  const record = requestCounts.get(key);
  if (!record) return 0;
  
  const remaining = record.resetTime - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}