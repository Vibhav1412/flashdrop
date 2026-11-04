# Component 09: NoSQL Feature & Full RUD (CRUD) Operations
**PES University DBMS Level 3 Evaluation Component 9 | Max Marks: 7**

---

## 1. Overview & Source Code Mapping
- **NoSQL Engine**: Redis 7.2
- **Scripts**: `redis/lua/acquire_hold.lua`, `redis/lua/release_hold.lua`, `redis/crud_demo.js`
- **Scope**: Complete demonstration of Create, Read, Update, and Delete (RUD/CRUD) across diverse Redis data types: Strings, Hashes, Sets, Sorted Sets, and Atomic Lua Scripts.

---

## 2. Complete RUD / CRUD Implementation Matrix

| Operation | Entity / Key Pattern | Redis Command / Script | Purpose in FlashDrop |
| :--- | :--- | :--- | :--- |
| **CREATE** | `drop:{id}:stock` | `SET drop:101:stock 100` | Initializes available stock when a drop goes live. |
| **CREATE** | `session:{token}` | `HSET session:abc userId 42 role "customer"` | Stores logged-in user session with metadata. |
| **CREATE** | `drop:{id}:queue` | `ZADD drop:101:queue 1730700000 "user_42"` | Places user into the waiting room sorted by timestamp. |
| **READ** | `drop:{id}:stock` | `GET drop:101:stock` | Reads real-time remaining inventory counter. |
| **READ** | `drop:{id}:queue` | `ZRANK drop:101:queue "user_42"` | Returns exact real-time position in queue (0-indexed). |
| **READ** | `cache:product:{id}` | `HGETALL cache:product:501` | Reads cached product catalog details. |
| **UPDATE** | `drop:{id}:stock` + `hold` | `EVAL acquire_hold.lua ...` | **Atomic Lua Script**: Decrements stock + Creates 5-minute hold. |
| **UPDATE** | `drop:{id}:queue` | `ZINCRBY drop:101:queue -100 "vip_user"` | Priority boost: moves VIP/loyalty users ahead in queue. |
| **UPDATE** | `session:{token}` | `EXPIRE session:abc 3600` | Extends session validity upon user activity. |
| **DELETE** | `hold:{drop}:{user}` | `DEL hold:101:user_42` | Deletes temporary hold upon confirmed checkout. |
| **DELETE** | `drop:{id}:queue` | `ZREM drop:101:queue "user_42"` | Removes user from waiting room once granted checkout entry. |
| **DELETE** | `cache:product:{id}` | `DEL cache:product:501` | Cache Invalidation triggered upon MySQL product price change. |

---

## 3. Atomic Lua Script (`redis/lua/acquire_hold.lua`)

Standard Redis commands cannot check stock and reserve a hold simultaneously without a race window. FlashDrop solves this using an atomic Lua script:

```lua
-- KEYS[1]: drop:{id}:stock
-- KEYS[2]: hold:{drop}:{user}
-- ARGV[1]: hold_ttl_seconds (e.g., 300)
-- ARGV[2]: user_id

local current_stock = tonumber(redis.call('GET', KEYS[1]))

-- 1. Check if stock exists and is greater than zero
if not current_stock or current_stock <= 0 then
    return {0, "OUT_OF_STOCK"}
end

-- 2. Check if user already holds an active reservation
if redis.call('EXISTS', KEYS[2]) == 1 then
    return {0, "ALREADY_HOLDING"}
end

-- 3. Atomically decrement stock
redis.call('DECR', KEYS[1])

-- 4. Create 5-minute hold with TTL
redis.call('SETEX', KEYS[2], ARGV[1], "RESERVED")

return {1, "HOLD_ACQUIRED"}
```

---

## 4. Examiner Viva Q&A (Component 9)

**Q1: Why is an atomic Lua script necessary instead of executing `GET` followed by `DECR` and `SETEX` in Node.js?**
> *Defense*: If executed as separate commands from Node.js, a race condition occurs between the `GET` and `DECR` commands. If stock is 1 and two users execute `GET` simultaneously, both see stock = 1 and both execute `DECR`, resulting in an oversell (stock becomes -1). Redis executes Lua scripts atomically; the server guarantees no other command or script can run while the script is evaluating.

**Q2: How does Redis handle key expiration under the hood?**
> *Defense*: Redis uses a combination of passive and active expiration:
> 1. *Passive Expiration*: When a client tries to access a key (e.g. `GET hold:101:user`), Redis checks if its TTL has expired; if so, it deletes the key immediately and returns `nil`.
> 2. *Active Expiration*: Periodically (10 times per second), Redis tests a random sample of keys with TTLs and purges expired keys in the background to reclaim memory.
