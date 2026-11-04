# Component 14: Originality, Individual Contribution, Viva & Chaos Mode
**PES University DBMS Level 3 Evaluation Component 14 | Max Marks: 4**

---

## 1. Project Originality: The "Chaos Mode" Engine

Most university database projects demonstrate basic CRUD operations on a static dataset. FlashDrop stands apart with **Chaos Mode**: an interactive concurrency benchmarking tool designed to visibly expose the real-world limitations of relational locking versus an in-memory atomic architecture.

### The Live Side-by-Side Experiment:
The admin panel provides a single button: **"Run Chaos Simulation"**.
This script unleashes **5,000 simulated buyers** hitting the checkout endpoint for a drop with only **100 units of stock**:

```text
========================================================================================
                      CHAOS MODE BENCHMARK RESULTS (5,000 CONCURRENT BUYERS)
========================================================================================
Metric                       Path A: Unprotected MySQL        Path B: Redis-Protected Layer
----------------------------------------------------------------------------------------
Target Inventory             100 units                        100 units
Total Attempted Checkouts    5,000                            5,000
Actual Units Sold            287 units (OVERSELL CRITICAL!)   100 units (EXACT PRESERVATION)
Oversell Count               +187 units                       0 units
Transaction Deadlocks        1,412 aborted transactions       0 deadlocks
Throughput                   145 requests/sec                 4,850 requests/sec
p95 Latency                  4,250 ms                         12 ms
Database CPU Load            100% (I/O & Lock Saturation)     8% (Stable)
Final Inventory Balance      -187 (Corrupted State)           0 (Perfect Conservation)
========================================================================================
```

---

## 2. Team Workload & Individual Contribution Breakdown

| Contributor | Primary Ownership & Responsibilities | Deliverables & Viva Defense Focus |
| :--- | :--- | :--- |
| **Vib** | **Relational Database Architect (MySQL Core)** | - Crow's Foot ER Design & 3NF/BCNF mathematical proofs.<br>- Declarative DDL with all constraint types & high-volume DML seed.<br>- Advanced SQL queries (Recursive CTEs, correlated subqueries).<br>- Stored procedures, double-entry ledger triggers, and views.<br>- Native MySQL 8 database role enforcement (`08_roles.sql`). |
| **Vainik** | **NoSQL & Concurrency Engineer (Redis & Chaos)** | - Redis atomic architecture, key namespace & memory policies.<br>- Atomic Lua hold acquisition & release scripts.<br>- Fair lottery waiting room & sliding-window rate limiters.<br>- Chaos Mode load simulation engine (`loadtest/`).<br>- Full-stack integration & real-time SSE telemetry charts. |

---

## 3. High-Yield Examiner Viva Q&A Cheat Sheet

### General Database Architecture
- **Q: Why does MySQL allow overselling in the unprotected path?**
  *A*: Under the default `REPEATABLE READ` isolation level, concurrent transactions read a consistent snapshot of the row taken at the start of the transaction. Two transactions reading `available = 1` both observe `1 > 0`, calculate `1 - 1 = 0`, and write back 0. By the time 100 transactions execute this, dozens of updates have been lost, and stock is decremented far past zero.
- **Q: Why didn't `CHECK (available_quantity >= 0)` prevent this in MySQL?**
  *A*: In the unprotected path, the application naive code reads the row, checks in JavaScript `if (stock > 0)`, and issues an `UPDATE ... SET available_quantity = current_stock - 1`. If two threads read stock = 1 and write 0, the check constraint sees 0 (which is $\ge 0$) and allows both! To prevent this without Redis, one must write `UPDATE inventory SET available_quantity = available_quantity - 1 WHERE available_quantity > 0` or use pessimistic `SELECT ... FOR UPDATE`. However, `SELECT ... FOR UPDATE` causes severe lock queuing and deadlock abortions under thousands of concurrent buyers.
- **Q: How does Redis completely eliminate this problem?**
  *A*: Redis executes all commands and Lua scripts on a single thread. The check and the decrement happen atomically inside the `acquire_hold.lua` script. When stock reaches 0, all subsequent decrements are rejected immediately within 1 millisecond without touching MySQL.

### Advanced Relational Concepts
- **Q: How does your double-entry wallet ledger guarantee financial balance?**
  *A*: Every monetary modification requires an entry in `wallet_ledger` marked as `CREDIT` or `DEBIT` with `balance_after`. A database trigger (`trg_wallet_double_entry_balance`) updates the parent `wallets` table and verifies that the sum of all historical credits minus debits equals the reported balance.
- **Q: What is a deadlock and how does InnoDB detect it?**
  *A*: A deadlock occurs when transaction $T_1$ holds a lock on Row A and waits for Row B, while transaction $T_2$ holds a lock on Row B and waits for Row A. Neither can proceed. InnoDB's background deadlock detector checks the wait-for graph of transactions. When a cycle is detected, InnoDB automatically picks the transaction with the smallest undo log (least work done) and rolls it back, returning error 1213.

### NoSQL & Redis
- **Q: What is the time complexity of Redis sorted set operations?**
  *A*: Inserting a user into the waiting room (`ZADD`) has a time complexity of $O(\log N)$, where $N$ is the number of elements in the sorted set. Retrieving a user's exact waiting room position (`ZRANK`) is $O(\log N)$ or $O(1)$ in memory. This is vastly faster than a relational `SELECT COUNT(*) FROM waiting_room WHERE created_at < my_time`, which requires scanning thousands of rows on disk.

