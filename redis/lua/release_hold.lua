-- =====================================================================
-- FLASHDROP LUA SCRIPT: release_hold.lua
-- Atomic Hold Cancellation & Stock Restitution
-- Keys:
--   KEYS[1] = drop:{id}:stock (String counter)
--   KEYS[2] = hold:{drop_id}:{user_id} (String with TTL)
-- Returns:
--   [status_code (1=released, 0=not_found), message, restored_stock]
-- =====================================================================

local stock_key = KEYS[1]
local hold_key  = KEYS[2]

-- 1. Atomically delete hold key
local deleted = redis.call('DEL', hold_key)

-- 2. If hold existed and was deleted, restore stock
if deleted == 1 then
    local restored_stock = redis.call('INCR', stock_key)
    return {1, "HOLD_RELEASED", tostring(restored_stock)}
else
    local current_stock = redis.call('GET', stock_key) or "0"
    return {0, "HOLD_NOT_FOUND_OR_EXPIRED", tostring(current_stock)}
end
