/**
 * Простой in-memory rate limiter (fixed window).
 * Подходит для локального одноинстансного развёртывания:
 * состояние не переживает перезапуск процесса и не шарится между инстансами.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Периодическая очистка просроченных бакетов, чтобы Map не рос бесконечно.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Секунд до сброса окна (для заголовка Retry-After). */
  retryAfterSec: number;
}

/**
 * Проверяет и фиксирует попытку.
 * @param key уникальный ключ (route + ip + email и т.п.)
 * @param limit максимум попыток в окне
 * @param windowMs размер окна в миллисекундах
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  b.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  return { allowed: b.count <= limit, retryAfterSec };
}

/** IP клиента из заголовков прокси (x-forwarded-for) или "local". */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}
