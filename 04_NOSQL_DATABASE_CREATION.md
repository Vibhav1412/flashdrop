# Component 04: NoSQL Database Creation (Redis 7)
**PES University DBMS Level 3 Evaluation Component 4 | Max Marks: 4**

---

## 1. Overview & Setup
- **NoSQL Engine**: Redis 7.2 (Alpine / In-Memory Key-Value & Data Structure Store)
- **Primary Configuration**: `docker-compose.yml` / Native Redis Service
- **Persistence Engine**: Append-Only File (`AOF`) + Point-in-time Snapshotting (`RDB`)
- **Eviction Policy**: `allkeys-lru` with 256MB memory cap.

Redis operates as FlashDrop's high-throughput atomic concurrency layer, isolating MySQL from the burst traffic of thousands of concurrent checkouts.

---

## 2. NoSQL Data Structures & Key Namespace Design

| Redis Key Pattern | Redis Data Type | Atomic Operations | Business Purpose in FlashDrop |
| :--- | :--- | :--- | :--- |
| `drop:{id}:stock` | **String (Atomic Integer)** | `DECR`, `INCR`, `GET` | Live real-time stock counter with zero-race condition decrements. |
| `hold:{drop_id}:{user_id}` | **String with TTL (5m)** | `SETEX`, `GET`, `DEL` | 5-minute atomic payment reservation hold granted to successful buyers. |
| `drop:{id}:queue` | **Sorted Set (ZSET)** | `ZADD`, `ZRANK`, `ZPOPMIN` | Waiting room queue sorted by timestamp (or lottery priority score). |
| `drop:{id}:lottery` | **Set / Sorted Set** | `SADD`, `SRANDMEMBER`, `SCARD` | Anti-bot fair lottery ballot entries with randomized winner selection. |
| `rate:{user}:{ip}` | **Sorted Set / String** | `ZADD`, `ZREMRANGEBYSCORE`, `INCR` | Sliding-window 60-second rate limiter blocking bot scripts. |
| `session:{token}` | **Hash (HSET) with TTL** | `HSET`, `HGETALL`, `EXPIRE` | Fast, low-latency user authentication session store. |
| `cache:product:{id}` | **Hash (HSET) with TTL** | `HSET`, `HMGET`, `EXPIRE` | Cache-aside product details, shielding MySQL reads. |
| `channel:dashboard:*` | **Pub/Sub Channel** | `PUBLISH`, `SUBSCRIBE` | Real-time SSE streaming for live admin charts and user queue position. |

---

## 3. Redis Creation & Initialization Runbook

### Starting Redis:
```bash
# Via Docker
docker compose up -d redis

# Via Native / WSL
sudo service redis-server start
# or on Windows: memurai.exe / redis-server.exe
```

### Verifying NoSQL Creation:
```bash
# Ping test
redis-cli ping
# Output: PONG

# Inspect Memory & Persistence Settings
redis-cli INFO persistence
redis-cli INFO memory
```

### Key Creation Proof (CRUD Setup):
```bash
# 1. Initialize drop stock counter
redis-cli SET drop:101:stock 100

# 2. Add users to the drop waiting room sorted set (score = epoch timestamp)
redis-cli ZADD drop:101:queue 1730700001 "user_501"
redis-cli ZADD drop:101:queue 1730700002 "user_502"
redis-cli ZADD drop:101:queue 1730700003 "user_503"

# 3. Create a 5-minute checkout hold with TTL (300 seconds)
redis-cli SETEX hold:101:user_501 300 "RESERVED"

# 4. Check remaining TTL
redis-cli TTL hold:101:user_501
```

---

## 4. Examiner Viva Q&A (Component 4)

**Q1: Why did you choose Redis as your NoSQL database over a document store like MongoDB?**
> *Defense*: Flash drops require sub-millisecond atomic read-and-decrement primitives (`DECR`), native TTL key expiration (for automatic 5-minute checkout holds), and sorted sets (for waiting room queuing). Document databases like MongoDB incur disk serialization overhead and complex locking during concurrent document updates. Redis executes all commands in a single-threaded in-memory event loop, guaranteeing strict atomicity without race conditions.

**Q2: What is the purpose of the `allkeys-lru` eviction policy?**
> *Defense*: Under peak flash drop load, memory usage can rise. If Redis reaches its maxmemory threshold (256MB), `allkeys-lru` automatically evicts the least recently used product cache and session keys to free memory, preventing the server from rejecting critical inventory decrement and checkout hold operations.
