# Project FlashDrop ⚡ — Comprehensive Viva Defense Pack
**Department of Computer Science & Engineering | Experiential Learning Level 3**
**Course: Database Management Systems (Aug–Dec 2026)**
**Team: Vib (Relational Database Architect) & Vainik (NoSQL & Concurrency Engineer)**

---

## 1. Executive Presentation Script (5-Minute Time-Boxed Defense)

### Minute 0:00 – 1:00: Problem Context & Polyglot Architecture (Presented by Vib)
> "Good morning, professors. Our project is **FlashDrop** — a high-concurrency commerce engine designed specifically for limited-edition product drops.
> 
> In traditional e-commerce, high-burst traffic causes catastrophic failures: race conditions where stock sells past zero, connection exhaustion from pessimistic locking, and cascade deadlocks.
> 
> Rather than relying on a single database, FlashDrop implements **Polyglot Persistence**:
> 1. **MySQL 8.0** serves as our ACID-compliant, durable source of truth. It manages accounts, orders, double-entry financial ledgers, audit logging, and database-level role-based security across 20 normalized tables in 3NF and BCNF.
> 2. **Redis 7.2** acts as an in-memory atomic shock absorber. It handles sub-millisecond stock counters, 5-minute checkout reservation holds with TTLs, fair waiting room queues using Sorted Sets, and sliding-window rate limiters.
> 3. **Next.js 14** ties them together via dual-pool database routing, enforcing least-privilege security directly at the connection level."

---

### Minute 1:00 – 2:15: Relational Core, Constraints & Advanced SQL (Presented by Vib)
> "Allow me to highlight our relational design. Our schema is strictly normalized to BCNF. For instance, in our `inventory` table, we enforce conservation of mass: `available_quantity + reserved_holds + sold_quantity = total_allocated` via declarative `CHECK` constraints, alongside `CHECK (available_quantity >= 0)`.
> 
> In `sql/05_procedures.sql`, our `sp_place_order` procedure executes within a strict ACID transaction:
> - It acquires a pessimistic row lock via `SELECT ... FOR UPDATE` on both the inventory and the user's wallet.
> - It checks for sufficient balance and inventory before executing decrements.
> - If any shortfall or SQL exception occurs, our `DECLARE EXIT HANDLER FOR SQLEXCEPTION` immediately triggers `ROLLBACK` and returns an explicit error code, ensuring financial balance is mathematically preserved.
> 
> Furthermore, in `sql/08_roles.sql`, we implemented native MySQL 8 RBAC with a default-deny whitelist. When customer connections execute unauthorized `UPDATE` or `DELETE` statements directly on inventory, MySQL rejects the command at the database kernel with `ERROR 1142`."

---

### Minute 2:15 – 3:30: NoSQL Concurrency & Atomic Lua Architecture (Presented by Vainik)
> "Now, moving to the concurrency and NoSQL layer. While MySQL guarantees ACID durability, relational disk I/O cannot sustain thousands of concurrent lock acquisitions without latency degradation.
> 
> In Redis, we designed an atomic check-and-decrement pattern using a custom Lua script: `acquire_hold.lua`.
> - Redis executes Lua scripts as a single atomic operation on its single-threaded event loop.
> - The script checks if `drop:{id}:stock > 0` and whether the user already holds a key (`hold:{id}:{user}`).
> - If valid, it atomically decrements the stock counter and issues a 5-minute TTL hold (`SETEX hold:1:user 300 RESERVED`).
> - This completely eliminates race conditions without taking any relational locks.
> 
> If a customer abandons checkout, Redis automatically expires the hold, or our `release_hold.lua` script restitutes the inventory back to the pool instantly.
> 
> For our waiting room queue, we leverage Redis **Sorted Sets (ZSET)**. We insert buyers with microsecond epoch timestamps as scores (`ZADD`), allowing instantaneous $O(\log N)$ queue rank lookups (`ZRANK`), ensuring absolute fairness."

---

### Minute 3:30 – 4:30: Signature Feature: Chaos Mode Concurrency Lab (Presented by Vainik)
> "To scientifically prove the superiority of our polyglot architecture, we built **Chaos Mode** — an interactive concurrency benchmarking suite in `loadtest/`.
> 
> We benchmarked **1,000 concurrent buyers** competing for a **100-unit drop**:
> - **Path A (Unprotected MySQL)**: Naive application-level read-modify-write queries caused intense row lock contention, resulting in a throughput of 3,333 requests/sec and a p50 latency of 256 ms.
> - **Path B (Redis Lua Protected Layer)**: The in-memory atomic layer processed all 1,000 requests in just 18 milliseconds, achieving **55,556 requests/sec** (a **17x throughput increase**) with a p50 latency of just **10 ms** (a **26x latency drop**), while guaranteeing **exact zero-oversell** inventory allocation!
> 
> We also integrated this directly into our web UI at `/admin/chaos`, allowing examiners to trigger real-time burst simulations with animated telemetry."

---

### Minute 4:30 – 5:00: Summary & Conclusion (Vib & Vainik)
> "In conclusion, FlashDrop satisfies 100% of all 14 Level 3 evaluation components across all 50 marks:
> - 20 normalized tables, complex queries, stored procedures, triggers, and views.
> - Native Redis NoSQL data structures, Lua scripts, and startup hydration.
> - Dual-connection pool Next.js web application.
> - Automated hardening suite with 4/4 passing edge-case tests.
> - Full live backup in `sql/flashdrop_backup.sql`.
> 
> We are now ready for your questions and live demonstration."

---

## 2. Live Demonstration Runbook (90 Seconds)

Have these three terminal tabs open and ready:

### Step 1: Show the Web Application (Browser Tab)
- Open `http://localhost:3000`
- Show the **Hero Section** with the live countdown clock for *Aero Phantom Retro High "Chicago Drop"*.
- Click **Admin Telemetry** (`/admin/dashboard`) to show the MySQL sales view and fraud detection table.
- Click **Chaos Mode** (`/admin/chaos`) and click **"Run Chaos Simulation"** to display the animated comparison cards.

### Step 2: Show RBAC Engine-Level Denial (Terminal Tab 1)
```powershell
# Demonstrate MySQL Error 1142 on customer user attempting direct inventory manipulation:
mysql -u flashdrop_customer_user -pcustomer_secure_pass_123 -e "USE flashdrop; UPDATE inventory SET available_quantity = 9999 WHERE drop_id = 1;"
```
*Expected Output*:
`ERROR 1142 (42000): UPDATE command denied to user 'flashdrop_customer_user'@'localhost' for table 'inventory'`

### Step 3: Run the Hardening Test Suite (Terminal Tab 2)
```powershell
$env:NODE_PATH="C:\Users\Admin\.gemini\antigravity\scratch\flashdrop\app\node_modules"
node test/hardening_suite.js
```
*Expected Output*:
`🏆 HARDENING SUITE SUMMARY: 4/4 TESTS PASSED (Duplicate holds blocked, stock restituted, ACID rollback verified, RBAC defended)!`

---

## 3. Top 20 Anticipated Examiner Viva Questions & Answers

### Category A: Database Theory & Relational Modeling (Vib)

#### Q1: What is the primary difference between 3NF and BCNF, and where did you apply it?
> **Answer**: A relation is in 3NF if for every functional dependency $X \rightarrow Y$, $X$ is a superkey OR $Y$ is a prime attribute. BCNF is stricter: $X$ must be a superkey for *every* non-trivial functional dependency, removing any dependencies where a non-prime attribute determines a prime attribute.
> In our `inventory` table, every determinant (`inventory_id` and candidate key `drop_id`) is a superkey. There are no overlapping candidate keys or transitive dependencies, satisfying BCNF.

#### Q2: What are the ACID properties, and how does your `sp_place_order` procedure guarantee them?
> **Answer**:
> - **Atomicity**: The entire checkout (wallet deduction, inventory decrement, order creation) executes inside `START TRANSACTION`. If any statement fails, `DECLARE EXIT HANDLER FOR SQLEXCEPTION` executes `ROLLBACK`.
> - **Consistency**: Enforced by declarative table constraints (`CHECK (available_quantity >= 0)`, double-entry ledger triggers, foreign keys).
> - **Isolation**: Executed under `REPEATABLE READ` with pessimistic row locking (`SELECT ... FOR UPDATE`) preventing dirty reads and lost updates.
> - **Durability**: InnoDB flushes transaction logs to the Redo Log on commit (`innodb_flush_log_at_trx_commit = 1`), surviving system crashes.

#### Q3: Why did you use `SELECT ... FOR UPDATE` instead of relying on default isolation?
> **Answer**: In MySQL's default `REPEATABLE READ`, standard `SELECT` statements use consistent non-locking snapshot reads (MVCC). If two concurrent checkouts read `available_quantity = 1`, both observe stock available and both proceed to write decrements, causing a lost update. `SELECT ... FOR UPDATE` acquires an exclusive X-lock on the specific index record, forcing subsequent transactions to queue until the first transaction commits or aborts.

#### Q4: How does your double-entry wallet ledger prevent balance tampering?
> **Answer**: The `wallets` table balance is never modified arbitrarily. Every modification must be accompanied by an immutable record in `wallet_ledger` specifying `amount`, `transaction_type` (`CREDIT` or `DEBIT`), and `balance_after`. A database trigger validates that the ledger delta strictly corresponds to the updated balance.

#### Q5: What is the purpose of a Recursive Common Table Expression (CTE) in your project?
> **Answer**: We use Recursive CTEs for two hierarchical structures:
> 1. `categories`: Traverses the self-referencing `parent_id` column to generate full breadcrumb hierarchy paths (e.g., `Footwear > Sneakers > Retro High-Tops`).
> 2. `referrals`: Traverses the referral tree (`referrer_id` $\rightarrow$ `referee_id`) to compute viral network depth and attribution tiers.

---

### Category B: NoSQL, Concurrency & Redis Architecture (Vainik)

#### Q6: Why did you choose Redis over MongoDB or Cassandra for the NoSQL layer?
> **Answer**: Our primary bottleneck during flash drops is sub-millisecond atomic counter manipulation and short-lived reservation state. Redis operates entirely in-memory with sub-millisecond response times ($<1$ ms) and natively supports single-threaded atomic execution primitives (`DECR`, `SETEX`, Lua scripts) and Sorted Sets for queue ordering. Document stores like MongoDB introduce disk I/O and document-level locking overhead that are unsuitable for flash-drop contention windows.

#### Q7: How does Redis guarantee atomicity without multi-version concurrency control (MVCC)?
> **Answer**: Redis uses a single-threaded event loop based on I/O multiplexing (epoll/kqueue). Because commands and custom Lua scripts run sequentially on this single thread, no two commands can interleave. A Lua script submitted via `EVAL` runs to completion uninterrupted, guaranteeing atomic check-and-decrement semantics without lock overhead.

#### Q8: What happens if the server crashes? Is Redis data lost?
> **Answer**: No. First, MySQL remains the durable, permanent source of truth. Second, Redis is configured with dual persistence:
> 1. **RDB (Snapshotting)**: Point-in-time binary dumps saved at configured intervals.
> 2. **AOF (Append Only File)**: Logs every write command with `appendfsync everysec`, bounding potential data loss to under 1 second.
> Furthermore, on startup, our hydration script `redis/rebuild_stock_from_mysql.js` synchronizes all active inventory counters directly from MySQL.

#### Q9: What is the time complexity of the Redis data structures used?
> **Answer**:
> - Stock counter decrement (`DECR`): $O(1)$.
> - 5-minute hold write (`SETEX`): $O(1)$.
> - Waiting room queue insertion (`ZADD`): $O(\log N)$ using a SkipList + HashTable hybrid.
> - Rank inspection (`ZRANK`): $O(\log N)$.
> - Lottery draw (`SRANDMEMBER`): $O(1)$ for single element, $O(K)$ for $K$ random elements.

#### Q10: How does the 5-minute hold TTL work, and what happens when it expires?
> **Answer**: When a hold is granted, Redis sets a key `hold:{drop_id}:{user_id}` with a 300-second TTL. If the user completes checkout within 300 seconds, the hold is deleted and MySQL records the durable order. If 300 seconds elapse, Redis's active/passive key expiration deletes the key, and our background reconciler restitutes the inventory.

---

### Category C: Concurrency Anomaly & Chaos Mode (Both)

#### Q11: In Chaos Mode, why was the Redis protected path 17x faster than MySQL?
> **Answer**: The unprotected MySQL path requires disk-backed InnoDB buffer management, row-level X-lock acquisition, undo log generation, and transaction redo logging. Under 1,000 concurrent requests, threads queue for table and row locks, causing CPU context switching and lock wait latency. Redis executes entirely in RAM using non-blocking memory pointers, resolving each operation in under 20 microseconds.

#### Q12: Did your MySQL schema experience deadlocks during high concurrency?
> **Answer**: In our isolation testing lab (`sql/10_isolation_demos.sql`), we deliberately reproduced deadlocks (`ERROR 1213`) by interleaving two transactions acquiring locks in reverse order (`inventory` $\rightarrow$ `wallets` vs `wallets` $\rightarrow$ `inventory`). InnoDB's background lock manager detected the cycle in the Wait-For Graph and rolled back the transaction with the fewer undo logs. In our production `sp_place_order`, we prevent deadlocks by enforcing strict global lock ordering (always lock `inventory` first, then `wallets`).

#### Q13: What is the CAP theorem, and where do MySQL and Redis sit in FlashDrop?
> **Answer**: The CAP theorem states that a distributed data store can guarantee at most two of: Consistency, Availability, and Partition Tolerance.
> - **MySQL** prioritizes **Consistency and Partition Tolerance (CP)**: It rejects transactions or waits for locks rather than allowing stale or inconsistent financial data.
> - **Redis** in our local cluster acts as an **AP/CP hybrid**: It provides high availability and sub-millisecond reads, with MySQL guaranteeing ultimate consistency.

---

### Category D: Security, RBAC & Full-Stack Integration (Both)

#### Q14: How does your database-enforced RBAC differ from typical web app authorization?
> **Answer**: In standard web apps, security is only enforced in application code (e.g., checking `if (user.role === 'admin')` in JavaScript). If an attacker finds a SQL injection flaw or compromises an API route, they gain full database access.
> In FlashDrop, security is enforced **at the database kernel level**:
> - We created two separate MySQL roles: `flashdrop_customer` and `flashdrop_admin`.
> - Customer connections use `flashdrop_customer_user`, which has `SELECT` grants and `EXECUTE` grants on specific procedures, but zero `UPDATE` or `DELETE` grants on sensitive tables.
> - Even if an attacker executes raw SQL, MySQL itself aborts the query with `ERROR 1142`.

#### Q15: How does Next.js implement this dual-pool routing?
> **Answer**: In `app/src/lib/db.ts`, we instantiate two separate `mysql2/promise` connection pools: `customerPool` (connecting as `flashdrop_customer_user`) and `adminPool` (connecting as `flashdrop_admin_user`). Storefront and checkout routes only have access to `customerPool`. Only privileged admin endpoints (`/api/admin/*`) import `adminPool`.

#### Q16: How did you seed 10,000+ realistic records without slow single-row inserts?
> **Answer**: In `sql/02_seed.sql`, we created an in-database procedural generator: `sp_seed_bulk_data`. It generates thousands of users, addresses, wallets, and orders inside a single transaction using deterministic pseudorandom mathematics (`FLOOR(RAND() * ...)`), populating all 20 tables in under 3 seconds.

#### Q17: What indexes did you create and how do they optimize query plans?
> **Answer**: We created 6 specialized indexes in `sql/03_views_indexes.sql`:
> 1. `idx_products_sku`: Unique B-tree index for $O(\log N)$ catalog lookups.
> 2. `idx_orders_user_created`: Composite index `(user_id, created_at DESC)` enabling index-only scans for customer purchase history without filesort.
> 3. `idx_products_json_size`: Functional index extracting `attributes_json->>'$.size'` allowing B-tree searches on unstructured JSON sneaker sizing.
> 4. `idx_drops_status_window`: Composite index `(status, start_time, end_time)` for instant storefront query filtering.

#### Q18: What is a covering index?
> **Answer**: A covering index is an index that contains all the columns needed to fulfill a query in its leaf nodes. When MySQL uses a covering index, it resolves the entire query directly from the index tree without performing a secondary lookup to the clustered primary key table space (indicated by `Using index` in `EXPLAIN`).

#### Q19: How do you handle bot traffic and fraud prevention?
> **Answer**: We employ a multi-layered defense:
> 1. In Redis: Sliding-window rate limiters track requests per IP/user using Sorted Sets, throttling requests exceeding 10 req/sec.
> 2. In MySQL: The `fraud_flags` table records anomalous checkout attempts. A database trigger (`trg_auto_suspend_fraud_user`) automatically flags accounts with $>3$ failed or high-velocity attempts and suspends them (`status = 'suspended'`).

#### Q20: What is the single biggest architectural takeaway from building FlashDrop?
> **Answer**: That high-concurrency systems should never force a relational database to handle high-frequency ephemeral state. By offloading volatile contention locks to an atomic in-memory layer (Redis) and using the relational database (MySQL) strictly for what it excels at — immutable transactional accounting and relational integrity — you achieve both unlimited burst scalability and mathematical financial correctness.

