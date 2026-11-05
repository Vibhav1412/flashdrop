-- =====================================================================
-- FLASHDROP LUA SCRIPT: acquire_hold.lua
-- Atomic Check-and-Decrement Inventory Hold Acquisition
-- Keys:
--   KEYS[1] = drop:{id}:stock (String counter)
--   KEYS[2] = hold:{drop_id}:{user_id} (String with TTL)
-- Arguments:
--   ARGV[1] = hold_ttl_seconds (e.g. 300 for 5 minutes)
--   ARGV[2] = user_id
-- Returns:
--   [status_code (1=success, 0=failure), message, remaining_stock]
-- =====================================================================

local stock_key = KEYS[1]
local hold_key  = KEYS[2]
local ttl       = tonumber(ARGV[1])
local user_id   = ARGV[2]

-- 1. Check if stock key exists
local current_stock_raw = redis.call('GET', stock_key)
if not current_stock_raw then
    return {0, "STOCK_NOT_FOUND", -1}
end

local current_stock = tonumber(current_stock_raw)

-- 2. Check if stock is available
if current_stock <= 0 then
    return {0, "OUT_OF_STOCK", 0}
end

-- 3. Check if user already holds an active reservation for this drop
if redis.call('EXISTS', hold_key) == 1 then
    return {0, "ALREADY_HOLDING", current_stock}
end

-- 4. Atomically decrement live stock counter
local new_stock = redis.call('DECR', stock_key)

-- 5. Atomically create the temporary 5-minute hold with TTL
redis.call('SETEX', hold_key, ttl, "RESERVED")

-- 6. Return success status with remaining stock
return {1, "HOLD_ACQUIRED", new_stock}
