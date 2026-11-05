# Redis NoSQL Architecture & Key Namespace Design
**PES University DBMS Level 3 | Component 4 (4 Marks) & Component 9 (7 Marks)**

---

## 1. Overview & Architectural Role
In FlashDrop, **Redis 7** operates as the in-memory atomic concurrency shield. It absorbs the high-throughput write spikes of limited-edition drops, executing atomic operations in sub-milliseconds without disk I/O contention or row-level lock serialization.

---

## 2. Key Namespace Specification

| Key Pattern | Redis Type | TTL Policy | Memory Eviction | Description & Business Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `drop:{id}:stock` | **String (Atomic Int)** | Persistent during drop | `noeviction` | Live remaining stock counter decremented via atomic Lua script. |
| `hold:{drop_id}:{user_id}` | **String** | 300 seconds (5 mins) | `volatile-ttl` | Temporary reservation granted to a buyer during checkout. Auto-expires. |
| `drop:{id}:queue` | **Sorted Set (ZSET)** | Active drop duration | `allkeys-lru` | Waiting room queue where score = join timestamp (epoch milliseconds). |
| `drop:{id}:lottery` | **Set / ZSET** | Drop registration window | `allkeys-lru` | Unbiased waiting room ballot pool for randomized winner selection. |
| `rate:{user_id}:{ip}` | **Sorted Set (ZSET)** | 60 seconds | `volatile-ttl` | Sliding-window request counter tracking attempts per minute to block bots. |
| `session:{token}` | **Hash (HSET)** | 86,400 seconds (24h) | `volatile-lru` | Fast session validation store caching user credentials and role. |
| `cache:product:{id}` | **Hash (HSET)** | 3,600 seconds (1h) | `allkeys-lru` | Cache-aside catalog store shielding MySQL reads for product pages. |
| `channel:dashboard:*` | **Pub/Sub Channel** | Ephemeral | N/A | Broadcast channel pushing real-time order and queue updates to SSE. |

---

## 3. High-Concurrency Operations Breakdown

### A. Atomic Stock Decrement & Hold (`acquire_hold.lua`)
- **Problem**: In high concurrency, checking stock with `GET` and decrementing with `DECR` creates a race window.
- **Solution**: Executed inside `redis/lua/acquire_hold.lua`. Evaluates available stock, checks for existing hold, decrements counter, and writes `SETEX hold:{drop}:{user} 300 RESERVED` in one atomic execution.

### B. Waiting Room Queue Mechanics
- Users join the drop queue via `ZADD drop:1:queue <timestamp> <user_id>`.
- Client inspects real-time queue position in $O(1)$ memory lookup: `ZRANK drop:1:queue <user_id>`.
- Admin pops the next batch of eligible buyers: `ZPOPMIN drop:1:queue <batch_size>`.

### C. Bot Sliding-Window Rate Limiting
- To limit requests to 10 per minute per IP:
  ```text
  1. ZREMRANGEBYSCORE rate:42:192.168.1.1 0 (now - 60000)
  2. ZCARD rate:42:192.168.1.1
  3. If count >= 10: Reject with 429 Too Many Requests
  4. Else: ZADD rate:42:192.168.1.1 <now> <unique_request_id>
  5. EXPIRE rate:42:192.168.1.1 60
  ```

---

## 4. Redis Persistence & Invalidation Strategy
1. **Append-Only File (AOF)**: Configured with `appendfsync everysec` in `docker-compose.yml` to guarantee that active holds and counters survive container/process restarts.
2. **Reconciliation from MySQL**: When the system boots, `redis/rebuild_stock_from_mysql.js` queries MySQL (the permanent source of truth) and synchronizes `drop:{id}:stock` counters before opening endpoints.
3. **Cache Invalidation**: When an administrator updates a product price or description in MySQL, an event or webhook executes `DEL cache:product:{id}`, enforcing the Cache-Aside pattern.
