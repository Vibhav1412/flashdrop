# Component 05: Technology Justification (Polyglot Rationale)
**PES University DBMS Level 3 Evaluation Component 5 | Max Marks: 1**

---

## 1. Executive Summary & Problem Formulation
Flash sales present an architectural paradox:
- **Requirement A (Financial Integrity)**: Orders, payments, double-entry ledgers, and inventory allocation require absolute **ACID guarantees**, referential constraints, and zero tolerance for balance discrepancies.
- **Requirement B (High-Concurrency Throughput)**: 10,000 users attempting to purchase 100 items at 10:00:00 AM requires **sub-millisecond atomic checks**, zero row-lock serialization, and automatic timeout handling.

---

## 2. Comparative Matrix: Relational vs. NoSQL

| Dimension | MySQL 8 (Relational Core) | Redis 7 (In-Memory NoSQL Layer) | FlashDrop Hybrid Synergy |
| :--- | :--- | :--- | :--- |
| **Data Model** | Relational tables, strict schemas, foreign keys, constraints. | Key-Value, In-memory Data Structures (Hashes, Sorted Sets, Strings). | Polyglot persistence: relational for durable records; NoSQL for ephemeral hot state. |
| **Transaction Model** | ACID compliant, MVCC, configurable isolation (Read Committed to Serializable). | Atomic operations via single-threaded event loop, Lua scripts, MULTI/EXEC. | MySQL handles financial transactions; Redis handles inventory reservations. |
| **Concurrency Latency** | Disk I/O bound: 10–50 ms under high contention; lock wait queues choke threads. | Memory-bound: sub-millisecond (0.2–1 ms); non-blocking event-driven loop. | 99% of rejected traffic is absorbed in-memory by Redis; MySQL handles only successful checkouts. |
| **State Expiration** | Manual polling or cron cleanup for temporary holds. | Native hardware TTL (`SETEX`, `EXPIRE`) with automatic passive & active eviction. | Zero ghost holds: Redis drops expired reservations without MySQL load. |
| **Waiting Room Queue** | Costly `ORDER BY created_at` queries causing table scans. | Native Sorted Sets (`ZSET`) offering $O(\log N)$ inserts and instant $O(1)$ rank lookups (`ZRANK`). | Real-time queue positions broadcast to thousands of clients via Redis Pub/Sub. |
| **Durability** | WAL (Redo Log, Undo Log, Binary Log) with double-write buffer. | In-memory with Append-Only File (`AOF`) and background snapshots (`RDB`). | MySQL is the permanent source of truth; Redis state can be re-hydrated from MySQL on boot. |

---

## 3. CAP Theorem & BASE Analysis

```text
                           C (Consistency)
                                 /\
                                /  \
                               /    \
                      RDBMS   /      \  Distributed
                     (MySQL) /________\  NoSQL
                            A          P
                      (Availability) (Partition Tolerance)
```

- **MySQL in FlashDrop**: Focuses on **Consistency (C)** and **Durability (ACID)**. Financial ledger balances, user credentials, and finalized purchase invoices cannot tolerate eventual consistency or lost updates.
- **Redis in FlashDrop**: Acts as an **AP/CP hybrid caching/queueing layer**. It prioritizes extreme **Availability (A)** and ultra-low latency reads/writes during the live drop window, ensuring legitimate buyers are not blocked by relational disk I/O bottlenecks.

---

## 4. Examiner Viva Q&A (Component 5)

**Q1: Why not build FlashDrop using ONLY MySQL?**
> *Defense*: If built exclusively on MySQL, 10,000 concurrent transactions hitting a single product row with `SELECT ... FOR UPDATE` causes severe lock contention, query timeouts, and thread pool exhaustion. Furthermore, managing 5-minute checkout holds requires constant periodic polling queries, causing massive I/O load. Redis absorbs the burst in-memory and isolates MySQL.

**Q2: Why not build FlashDrop using ONLY Redis?**
> *Defense*: Redis is primarily an in-memory data store. Storing financial ledgers, complex order hierarchies, user credentials, and historical analytical reports purely in Redis violates ACID durability and makes complex relational queries (joins, multi-level recursive category trees, aggregation with grouping) virtually impossible without reinventing a relational query engine in application code.

