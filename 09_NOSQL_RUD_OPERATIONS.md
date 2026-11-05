# Component 09: NoSQL Feature & Full RUD (CRUD) Operations
**PES University DBMS Level 3 Evaluation Component 9 | Max Marks: 7**

---

## 1. Overview & Source Code Mapping
- **NoSQL Engine**: Redis 7.2 (In-Memory Data Structures)
- **Primary Scripts**:
  - `redis/lua/acquire_hold.lua`: Atomic Check-and-Decrement Inventory Hold script.
  - `redis/lua/release_hold.lua`: Atomic Hold Cancellation and stock restitution script.
  - `redis/crud_demo.ps1`: Direct CLI runbook demonstrating full RUD lifecycle.
  - `redis/crud_demo.js`: Programmatic demonstration via Node.js / `ioredis`.
  - `redis/rebuild_stock_from_mysql.js`: Startup state hydration script.
- **Evaluation Target**: Demonstrates Create, Read, Update, and Delete across diverse data structures (Strings, Hashes, Sets, Sorted Sets, and Lua scripts).

---

## 2. Complete RUD Operations Matrix

| Operation Category | Data Structure | Redis Command / Script | Concrete FlashDrop Business Usage |
| :--- | :--- | :--- | :--- |
| **CREATE** | String | `SET drop:1:stock 100` | Initializes live inventory counter for Drop 1. |
| **CREATE** | Hash | `HSET session:token_abc userId 2 role "customer"` | Serializes user session metadata with TTL. |
| **CREATE** | Sorted Set (ZSET) | `ZADD drop:1:queue <timestamp> "user_2"` | Enqueues buyers in millisecond-accurate waiting room. |
| **CREATE** | Set | `SADD drop:1:lottery "ballot_2"` | Adds user tickets to fair anti-bot lottery pool. |
| **READ** | String | `GET drop:1:stock` | Sub-millisecond read of live remaining stock. |
| **READ** | Hash | `HGETALL session:token_abc` | Retrieves logged-in user profile without querying MySQL. |
| **READ** | Sorted Set (ZSET) | `ZRANK drop:1:queue "user_2"` | Instant $O(1)$ memory lookup of buyer's queue rank. |
| **READ** | Set | `SRANDMEMBER drop:1:lottery 2` | Unbiased random winner selection from lottery pool. |
| **UPDATE** | String + Hold (Lua) | `EVAL acquire_hold.lua ...` | **Atomic Check-and-Decrement**: Decrements stock + sets 5-minute hold with TTL. |
| **UPDATE** | Sorted Set (ZSET) | `ZINCRBY drop:1:queue -1000000 "user_4"` | VIP priority score update (jumps ahead in waitlist). |
| **UPDATE** | Hash / TTL | `EXPIRE session:token_abc 7200` | Refreshes session TTL upon user interaction. |
| **DELETE** | String | `DEL hold:1:user_2` | Deletes temporary checkout hold upon order completion. |
| **DELETE** | Sorted Set (ZSET) | `ZREM drop:1:queue "user_2"` | Evicts buyer from waiting room once entering checkout. |
| **DELETE** | Hash | `DEL cache:product:1` | Cache invalidation triggered when MySQL product price updates. |

---

## 3. High-Yield Viva Defense: Atomic Lua Scripts

### Why is `acquire_hold.lua` needed?
If an application executes:
```javascript
const stock = await redis.get("drop:1:stock");
if (stock > 0) {
    await redis.decr("drop:1:stock");
    await redis.setex("hold:1:user", 300, "RESERVED");
}
```
Under concurrent flash drop load (e.g. 5,000 users hitting the endpoint simultaneously when `stock = 1`), dozens of requests read `stock = 1` before any single `decr` completes. Multiple users receive holds, and the counter drops below zero (overselling).

**The Lua Solution**:
Redis executes Lua scripts **atomically on its single-threaded event loop**. The server guarantees that no other Redis command or script can run while `acquire_hold.lua` is executing. The stock check, decrement, and hold key creation occur as a single indivisible operation.

---

## 4. Examiner Viva Q&A (Component 9)

**Q1: What is the time complexity of Redis Sorted Set operations like `ZADD` and `ZRANK`?**
> *Defense*: Redis Sorted Sets are implemented using a dual data structure: a Skip List combined with a Hash Table. `ZADD` inserts an element in $O(\log N)$ time, and `ZRANK` retrieves an element's 0-indexed position in $O(\log N)$ time. This allows FlashDrop to manage a waiting room of 100,000 queued users in memory with sub-millisecond response times.

**Q2: What happens if Redis crashes? Does FlashDrop lose all inventory records?**
> *Defense*: No. In FlashDrop's polyglot architecture, **MySQL is the durable source of truth**. Redis holds only ephemeral live counters and 5-minute checkout holds. In addition, Redis is configured with Append-Only File (`AOF`) persistence (`appendfsync everysec`). On server reboot, `redis/rebuild_stock_from_mysql.js` recalculates `available_quantity` from MySQL and re-hydrates Redis before incoming checkout traffic is accepted.

**Q3: How does FlashDrop implement the Cache-Aside pattern with Redis?**
> *Defense*: When a client requests a product page, the application first checks Redis (`GET cache:product:{id}`). On a cache hit, the response returns in sub-millisecond time. On a cache miss, the backend reads MySQL, stores the result in Redis with a 1-hour TTL (`SETEX cache:product:{id} 3600 ...`), and returns it. If an admin updates the product in MySQL, our trigger or API handler executes `DEL cache:product:{id}`, ensuring subsequent reads fetch the fresh data.
