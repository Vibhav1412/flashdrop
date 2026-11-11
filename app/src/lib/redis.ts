// =====================================================================
// FLASHDROP: app/src/lib/redis.ts
// Redis 7 Connection & Atomic Lua Operations Helper
// Component 9: NoSQL Feature & Full RUD (7 Marks)
// =====================================================================

import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});

// Load Lua Scripts from project root / redis directory
const LUA_DIR = path.join(process.cwd(), '..', 'redis', 'lua');

let acquireHoldScript: string;
let releaseHoldScript: string;

try {
  acquireHoldScript = fs.readFileSync(path.join(LUA_DIR, 'acquire_hold.lua'), 'utf8');
  releaseHoldScript = fs.readFileSync(path.join(LUA_DIR, 'release_hold.lua'), 'utf8');
} catch (e) {
  // Fallback inline scripts if running from different working directory
  acquireHoldScript = `
    local stock = tonumber(redis.call('GET', KEYS[1]) or 0)
    if stock <= 0 then return {0, "OUT_OF_STOCK", "0"} end
    if redis.call('EXISTS', KEYS[2]) == 1 then return {0, "ALREADY_HOLDING", tostring(stock)} end
    local new_stock = redis.call('DECR', KEYS[1])
    redis.call('SETEX', KEYS[2], ARGV[1], "RESERVED")
    return {1, "HOLD_ACQUIRED", tostring(new_stock)}
  `;
  releaseHoldScript = `
    if redis.call('DEL', KEYS[2]) == 1 then
      local restored = redis.call('INCR', KEYS[1])
      return {1, "HOLD_RELEASED", tostring(restored)}
    else
      return {0, "HOLD_NOT_FOUND", redis.call('GET', KEYS[1]) or "0"}
    end
  `;
}

/**
 * Atomically acquires a 5-minute checkout hold via Lua script
 */
export async function acquireHold(dropId: number | string, userId: number | string, ttlSeconds: number = 300) {
  const stockKey = `drop:${dropId}:stock`;
  const holdKey = `hold:${dropId}:${userId}`;

  const result = await redis.eval(
    acquireHoldScript,
    2,
    stockKey,
    holdKey,
    String(ttlSeconds),
    String(userId)
  ) as [number, string, string];

  return {
    success: result[0] === 1,
    code: result[1],
    remainingStock: Number(result[2]),
    holdKey,
  };
}

/**
 * Atomically releases an active hold and increments available stock back
 */
export async function releaseHold(dropId: number | string, userId: number | string) {
  const stockKey = `drop:${dropId}:stock`;
  const holdKey = `hold:${dropId}:${userId}`;

  const result = await redis.eval(
    releaseHoldScript,
    2,
    stockKey,
    holdKey
  ) as [number, string, string];

  return {
    success: result[0] === 1,
    code: result[1],
    restoredStock: Number(result[2]),
  };
}

/**
 * Inspect live available stock from Redis counter
 */
export async function getLiveStock(dropId: number | string): Promise<number> {
  const val = await redis.get(`drop:${dropId}:stock`);
  return val ? parseInt(val, 10) : 0;
}

/**
 * Inspect remaining hold TTL in seconds
 */
export async function getHoldTtl(dropId: number | string, userId: number | string): Promise<number> {
  return await redis.ttl(`hold:${dropId}:${userId}`);
}

/**
 * Enqueue user into drop waiting room
 */
export async function enqueueUser(dropId: number | string, userId: number | string): Promise<number> {
  const key = `drop:${dropId}:queue`;
  const now = Date.now();
  await redis.zadd(key, now, String(userId));
  const rank = await redis.zrank(key, String(userId));
  return (rank ?? 0) + 1;
}

/**
 * Get user rank in waiting room
 */
export async function getQueuePosition(dropId: number | string, userId: number | string): Promise<number | null> {
  const rank = await redis.zrank(`drop:${dropId}:queue`, String(userId));
  return rank !== null ? rank + 1 : null;
}

