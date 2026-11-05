# FLASHDROP — COMPREHENSIVE PROJECT MASTER LOG & RECORD
===============================================================================
Project Title: FlashDrop: High-Concurrency Limited-Drop Commerce Engine
Course: Database Management Systems (Aug - Dec 2026)
Institution: PES University, Department of Computer Science & Engineering
Level: Experiential Learning Level 3 - MiniProject (50 Marks)
Team:
  - Vib (Lead Database Engineer & Architect)
  - Vainik (NoSQL & Concurrency Engineer — Joining in later phases)
Stack: MySQL 8.0 (Relational Core) + Redis 7.2 (In-Memory NoSQL Layer) + Next.js 14 (Full-Stack UI/API)
===============================================================================

This master file contains the complete, unabridged record of all project engineering phases, architectural decisions, mathematical proofs, DDL/DML scripts, stored procedures, triggers, Redis data structures, Next.js code, viva defense questions, and evaluation criteria mappings.

---

## TABLE OF CONTENTS
- [1. Evaluation Criteria & Rubrics Mapping (50 Marks)](#1-evaluation-criteria--rubrics-mapping-50-marks)
- [2. System Architecture & Polyglot Persistence Blueprint](#2-system-architecture--polyglot-persistence-blueprint)
- [3. Phase 0: Foundation, Infrastructure & Environment Scaffolding](#3-phase-0-foundation-infrastructure--environment-scaffolding)
  - [3.1 Concept & Problem Statement](#31-concept--problem-statement)
  - [3.2 File Artifacts & Runnable Code](#32-file-artifacts--runnable-code)
  - [3.3 Architectural Defense for Viva](#33-architectural-defense-for-viva)
  - [3.4 Verification & Testing Runbook](#34-verification--testing-runbook)
  - [3.5 What Was Learned](#35-what-was-learned)
  - [3.6 Viva Defense Questions & Answers](#36-viva-defense-questions--answers)
  - [3.7 Git Commit Record](#37-git-commit-record)
- [4. Phase 1: Requirements, ER Diagram & Relational Modeling (Pending confirmation)](#4-phase-1-requirements-er-diagram--relational-modeling)
- [5. Phase 2: MySQL DDL Schema & High-Volume DML Seeding (Upcoming)](#5-phase-2-mysql-ddl-schema--high-volume-dml-seeding)
- [6. Phase 3: Comprehensive SQL Query Suite (Upcoming)](#6-phase-3-comprehensive-sql-query-suite)
- [7. Phase 4: Stored Procedures, Functions, Triggers & Events (Upcoming)](#7-phase-4-stored-procedures-functions-triggers--events)
- [8. Phase 5: Database-Level Role-Based Access Control (Upcoming)](#8-phase-5-database-level-role-based-access-control)
- [9. Phase 6: Transaction Isolation Anomalies & Deadlock Lab (Upcoming)](#9-phase-6-transaction-isolation-anomalies--deadlock-lab)
- [10. Phase 7: Redis Concurrency Layer & Full RUD (Upcoming)](#10-phase-7-redis-concurrency-layer--full-rud)
- [11. Phase 8: Next.js Storefront & Dual-Pool Integration (Upcoming)](#11-phase-8-nextjs-storefront--dual-pool-integration)
- [12. Phase 9: Chaos Mode High-Concurrency Benchmark Suite (Upcoming)](#12-phase-9-chaos-mode-high-concurrency-benchmark-suite)
- [13. Phase 10: Fault Tolerance, Recovery & Hardening (Upcoming)](#13-phase-10-fault-tolerance-recovery--hardening)
- [14. Phase 11: Final Portfolio Packaging & Viva Delivery (Upcoming)](#14-phase-11-final-portfolio-packaging--viva-delivery)

---

## 1. Evaluation Criteria & Rubrics Mapping (50 Marks)

Mapped directly to PES University Experiential Learning Level 3 MiniProject Rubrics:

| # | Evaluation Component | Max Marks | Target Phase in FlashDrop | Verified Delivery |
|---|----------------------|:---------:|:--------------------------|:-----------------:|
| 1 | ER Diagram | 2 | Phase 1 | Planned |
| 2 | Relational Schema with Keys, Relationships & Constraints | 3 | Phase 1 | Planned |
| 3 | SQL Database Implementation - DDL with Constraints | 4 | Phase 2 (`sql/01_schema.sql`) | Planned |
| 4 | NoSQL/Vector Database Creation | 4 | Phase 0 & Phase 7 (`docker-compose.yml`, Redis) | Phase 0 Done |
| 5 | Technology Justification | 1 | Phase 0 & Phase 1 Docs | Documented |
| 6 | DML Operations | 4 | Phase 2 (`sql/02_seed.sql`) | Planned |
| 7 | Nested/Correlated/Recursive Queries & Join Queries | 4 | Phase 3 (`sql/09_queries.sql`) | Planned |
| 8 | Advanced SQL Concepts (Procedure/Function, Trigger, CTE) | 6 | Phase 4 (`sql/04_` - `07_`) | Planned |
| 9 | NoSQL Feature, RUD Operations | 7 | Phase 7 (`redis/`) | Planned |
| 10| Next.js Interface | 3 | Phase 8 (`app/`) | Planned |
| 11| Backend/API and Database Integration | 2 | Phase 8 (`app/src/lib/db.ts`) | Planned |
| 12| Authentication (Frontend + Min 2 DB Roles & Access Control) | 4 | Phase 5 & Phase 8 (`sql/08_roles.sql`) | Planned |
| 13| Documentation, Git/GitHub | 2 | All Phases (`master` / `main` clean commits) | Ongoing |
| 14| Originality, Individual Contribution, Viva / Chaos Demo | 4 | Phase 9 & Phase 11 (`loadtest/`) | Planned |
|   | **TOTAL MARKS** | **50** | | |

---

## 2. System Architecture & Polyglot Persistence Blueprint

### Problem Statement:
High-concurrency e-commerce flash drops create extreme write spikes where thousands of users execute checkout transactions at the exact same millisecond against very low inventory counts (e.g. 100 units).

A standard MySQL-only architecture experiences:
1. **Overselling / Lost Updates**: Concurrent read-modify-write transactions read the same initial inventory level, pass application-level validation checks, and decrement below zero.
2. **Deadlocks and Connection Starvation**: Relational row locks (`SELECT ... FOR UPDATE`) serialize thousands of waiting transactions on a single row, creating massive lock wait queues, deadlocks, and connection pool timeouts.

### Polyglot Persistence Architecture:
- **Redis 7 (In-Memory Atomic Layer)**:
  - Single-threaded event-loop guarantees zero race conditions without row-locking overhead.
  - Sub-millisecond atomic inventory decrement (`DECR`, atomic Lua scripts).
  - Temporary 5-minute checkout holds with native TTL (`EXPIRE`).
  - Sorted Sets (`ZSET`) for waiting rooms and sliding-window rate limiters.
  - Pub/Sub channels for live SSE dashboard broadcasts.
- **MySQL 8 (Relational ACID Durable Core)**:
  - Authoritative source of truth for all persisted state.
  - Strict referential integrity: 19 tables in 3NF/BCNF.
  - Double-entry ledger trigger preventing unbalanced transactions.
  - Stored procedure `place_order` executing inside an atomic transaction.
  - Fine-grained database roles (`flashdrop_admin` and `flashdrop_customer`) enforced at the connection pool level.

---

## 3. Phase 0: Foundation, Infrastructure & Environment Scaffolding

### 3.1 Concept & Problem Statement
Phase 0 establishes the containerized local development environment, directory separation of concerns, and baseline configuration parameters for MySQL 8 and Redis 7.

### 3.2 File Artifacts & Runnable Code

#### `docker-compose.yml`
```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: flashdrop_mysql
    restart: unless-stopped
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --explicit_defaults_for_timestamp=1
      --innodb_buffer_pool_size=256M
      --innodb_log_file_size=64M
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-flashdrop_root_password}
      MYSQL_DATABASE: ${DB_NAME:-flashdrop}
    ports:
      - "${DB_PORT:-3306}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD:-flashdrop_root_password}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 15s

  redis:
    image: redis:7.2-alpine
    container_name: flashdrop_redis
    restart: unless-stopped
    command: >
      redis-server
      --appendonly yes
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  mysql_data:
    name: flashdrop_mysql_data
  redis_data:
    name: flashdrop_redis_data
```

#### `.env.example`
```env
# Database Configuration (MySQL 8)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=flashdrop
DB_ROOT_USER=root
DB_ROOT_PASSWORD=flashdrop_root_password

# Application-Level Database Roles (Least Privilege)
DB_CUSTOMER_USER=flashdrop_customer_user
DB_CUSTOMER_PASSWORD=customer_secure_pass_123
DB_ADMIN_USER=flashdrop_admin_user
DB_ADMIN_PASSWORD=admin_secure_pass_123

# In-Memory NoSQL Layer (Redis 7)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Next.js Application Settings
NEXTAUTH_SECRET=b65f3f22b7a9f87498c0dc118be9687e148e65f33cf23e20e8b5d3822
NEXTAUTH_URL=http://localhost:3000
PORT=3000
```

#### `.gitignore`
```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing & Coverage
coverage/
*.lcov

# Next.js Build Outputs
.next/
out/
build/
dist/

# Environment Variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug and Logs
*.log
npm-debug.log*

# Docker & Database Volumes / Dumps
data/
*.sql.gz
*.dump

# Operating System Files
.DS_Store
Thumbs.db
```

### 3.3 Architectural Defense for Viva
1. **Collation `utf8mb4_unicode_ci`**: Full 4-byte Unicode encoding allowing emojis, symbols, and multilingual text. Avoids MySQL's legacy 3-byte `utf8` truncation.
2. **Redis AOF Persistence (`--appendonly yes`)**: Guarantees that active checkout holds and stock states survive an in-flight server reboot without waiting for 15-minute RDB snapshot intervals.
3. **Dual Connection Pool Architecture**: Avoids granting the frontend app superuser privileges. Customer actions run under restricted role `flashdrop_customer`, while administrative routines run under `flashdrop_admin`.

### 3.4 Verification & Testing Runbook
```bash
# Verify Docker service health
docker compose up -d
docker compose ps

# Verify MySQL connectivity
docker compose exec mysql mysqladmin ping -u root -pflashdrop_root_password

# Verify Redis ping-pong
docker compose exec redis redis-cli ping
# Output: PONG
```

### 3.5 What Was Learned
- Configuring production-ready MySQL 8 and Redis 7 containers.
- Applying polyglot persistence to conquer flash sale concurrency bottlenecks.
- Setting up least-privilege role boundaries from day zero.

### 3.6 Viva Defense Questions & Answers
- **Q1: Why can't we just use MySQL with `SELECT ... FOR UPDATE` to handle high-concurrency flash drops?**
  *Answer*: `SELECT ... FOR UPDATE` causes pessimistic row locks. Thousands of concurrent requests serialize, blocking connection threads, exhausting pools, and triggering deadlocks under burst contention. Redis solves this in-memory using an atomic, single-threaded execution model.
- **Q2: If Redis is in-memory and volatile, what happens if the Redis server crashes during a drop?**
  *Answer*: MySQL is the durable source of truth. Redis holds only ephemeral state. On reboot, a reconciliation routine recalculates live stock (`total_inventory - confirmed_orders - active_holds`) from MySQL and re-hydrates Redis before incoming requests are accepted.
- **Q3: Why does our schema use `utf8mb4` instead of standard `utf8` in MySQL 8?**
  *Answer*: MySQL's legacy `utf8` only supports 3 bytes per character. Modern applications require `utf8mb4` to support 4-byte characters (emojis, complex scripts) without silent data truncation.

### 3.7 Git Commit Record
```text
commit ca22b8c075de07f159f91391d9b29cd5fcc378a2
Author: Vib <vib@flashdrop.local>
Date:   Wed Nov 4 19:01:37 2026 +0530

    chore(phase-0): scaffold project structure, docker-compose, and readme
```

===============================================================================
[LOG UPDATED: Phase 0 Completed]
===============================================================================



---

## 4. Phase 1 & Phase 2: Relational DDL Schema (`sql/01_schema.sql`)
- **Status**: Completed & Committed
- **Target Rubric**: Component 1 (ER: 2 Marks), Component 2 (Schema/BCNF: 3 Marks), Component 3 (DDL Constraints: 4 Marks)
- **Engine**: MySQL 8.0 InnoDB | `utf8mb4_unicode_ci`
- **Total Tables**: 20 Relational Entities

### Key Schema Design Highlights:
1. **Mathematical Conservation in Inventory**:
   ```sql
   CONSTRAINT chk_inventory_conservation CHECK (available_quantity + reserved_holds + sold_quantity = total_allocated)
   ```
2. **Immutable Double-Entry Ledger Protection**:
   ```sql
   CONSTRAINT chk_ledger_amount_positive CHECK (amount > 0.00),
   CONSTRAINT chk_ledger_balance_after_nonneg CHECK (balance_after >= 0.00)
   ```
3. **Self-Referential Taxonomy & Referral Trees**:
   - `categories` uses `parent_id` referencing `categories(category_id)` for arbitrary hierarchical depth.
   - `referrals` uses `referrer_id` and `referee_id` referencing `users(user_id)` with `CHECK (referrer_id <> referee_id)`.
4. **Referential Integrity Actions**:
   - `ON DELETE RESTRICT` for financial and inventory assets to prevent orphaned or deleted audit records.
   - `ON DELETE CASCADE` for line-items (`order_items`) and dependent child telemetry.

### Verification Runbook:
```powershell
# Execute the complete schema against MySQL 8
mysql -u root -p flashdrop < sql/01_schema.sql

# Verify all 20 tables are created
mysql -u root -p -e "USE flashdrop; SHOW TABLES;"
```


---

## 5. Phase 2: DML Seed Script (`sql/02_seed.sql`)
- **Status**: Completed & Committed
- **Target Rubric**: Component 6: DML Operations (High-Volume Realistic Seed Data - 4 Marks)
- **Scale**: 1,000+ Users, 1,000 Wallets, 1,150+ Ledger records, 5,000+ Concurrency telemetry entries.

### DML Generation Methodology:
- **Procedural Batch Generation (`sp_seed_bulk_data`)**: Implements deterministic SQL loops to seed thousands of records within an explicit transactional envelope.
- **Double-Entry Ledger Invariance**: For every wallet and order debit, matching `wallet_ledger` records are created where `balance_after` precisely reflects the updated balance.
- **Inventory Conservation**: For every drop, `available_quantity + reserved_holds + sold_quantity = total_allocated`.
- **Recursive Hierarchy Depth**: Multi-tier categories and multi-level viral referral chains (`user_2 -> user_3 -> user_4 ...`) designed for testing recursive CTEs.

### Verification Runbook:
```powershell
# Execute seed script against MySQL 8
Get-Content sql\02_seed.sql -Raw | mysql -u root -p flashdrop
```


---

## 6. Phase 3: Comprehensive SQL Query Suite (`sql/09_queries.sql`)
- **Status**: Completed & Committed
- **Target Rubric**: Component 7: Queries (Joins, Nested, Correlated, Recursive CTEs - 4 Marks)
- **Scope**: 17 Production-grade queries spanning all relational operations.

### Query Highlights:
1. **Multi-Table Joins**: 5-table inner join pulling order line-items and payment transactions.
2. **Correlated Subqueries (`EXISTS` / `NOT EXISTS`)**: Bot telemetry anomaly detection and VIP balance filtration.
3. **Recursive CTEs**:
   - `CategoryHierarchy`: Traversal from root categories down to leaf elements, assembling `breadcrumb_path`.
   - `ReferralLineage`: Viral tree traversal computing invite chain depth and lineage strings.
4. **Window Functions (OLAP)**:
   - `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()` comparison on wallet balances.
   - `LAG()` computing microsecond gaps between rapid checkout attempts to expose automated bot scripts.
   - Running cumulative revenue per drop via `SUM() OVER (...)`.
5. **JSON Path Extraction**: Filtering sneakers via `attributes_json->>'$.size'`.

### Verification Runbook:
```powershell
# Run the complete query suite against MySQL 8
Get-Content sql\09_queries.sql -Raw | mysql -u root -p flashdrop
```


---

## 7. Phase 4: Advanced Database Programming Suite
- **Status**: Completed & Committed
- **Target Rubric**: Component 8: Advanced SQL Concepts (Procedures, Functions, Triggers, Views & Events - 6 Marks)
- **Files**:
  - `sql/03_views_indexes.sql`: 3 Secure/Analytical Views + 6 B-Tree Indexes (including Functional JSON Expression Index).
  - `sql/04_functions.sql`: 3 Deterministic Functions (`fn_calculate_loyalty_discount`, `fn_is_user_suspended`, `fn_get_category_breadcrumb`).
  - `sql/05_procedures.sql`: 3 Stored Procedures (`sp_place_order` with ACID rollback handling, `sp_deposit_wallet`, `sp_reconcile_drop_inventory`).
  - `sql/06_triggers.sql`: 4 Database Triggers (Negative stock guard, auto-suspend bot trigger, order mutation audit, price change audit).
  - `sql/07_events.sql`: Hourly Scheduled Event refreshing `daily_drop_summary`.

### Verification Runbook:
```powershell
# Execute all programmable database objects against MySQL 8
Get-Content sql\03_views_indexes.sql -Raw | mysql -u root -p flashdrop
Get-Content sql\04_functions.sql -Raw | mysql -u root -p flashdrop
Get-Content sql\05_procedures.sql -Raw | mysql -u root -p flashdrop
Get-Content sql\06_triggers.sql -Raw | mysql -u root -p flashdrop
Get-Content sql\07_events.sql -Raw | mysql -u root -p flashdrop
```


---

## 8. Phase 5: Database-Enforced Role-Based Access Control (`sql/08_roles.sql`)
- **Status**: Completed & Committed
- **Target Rubric**: Component 12: Authentication & Role-Based Access Control in Database (4 Marks)
- **Roles Created**:
  - `flashdrop_customer`: Least privilege. Read access to catalog views. Write mutations restricted exclusively to vetted stored procedures (`sp_place_order`, `sp_deposit_wallet`). Direct `UPDATE`/`DELETE` on `inventory`, `orders`, and `wallets` is denied.
  - `flashdrop_admin`: Superuser role with full administrative privileges.
- **Database Users**:
  - `flashdrop_customer_user` (Password: `customer_secure_pass_123`)
  - `flashdrop_admin_user` (Password: `admin_secure_pass_123`)

### Verification Runbook:
```powershell
# 1. Install roles and grants into MySQL 8
Get-Content sql\08_roles.sql -Raw | mysql -u root -p flashdrop

# 2. Test legitimate customer read (Succeeds)
mysql -u flashdrop_customer_user -pcustomer_secure_pass_123 -e "USE flashdrop; SELECT product_id, title FROM products LIMIT 2;"

# 3. Test customer unauthorized write attempt (FAILS with Error 1142)
mysql -u flashdrop_customer_user -pcustomer_secure_pass_123 -e "USE flashdrop; UPDATE inventory SET available_quantity = 9999 WHERE drop_id = 1;"
```


---

## 9. Phase 6: Transactions Lab, Isolation Anomalies & Deadlock Simulation (`sql/10_isolation_demos.sql`)
- **Status**: Completed & Committed
- **Scope**: Rigorous demonstration of ACID isolation levels, Dirty Read, Non-Repeatable Read, Lost Update, Deadlock cycle detection, and Lock resolution mechanisms.

### Laboratory Anomaly Matrix:
1. **Dirty Read (READ UNCOMMITTED)**: Demonstrates $T_2$ reading uncommitted stock changes before $T_1$ executes `ROLLBACK`.
2. **Non-Repeatable Read (READ COMMITTED)**: Demonstrates price change visible to $T_1$ mid-transaction, and how InnoDB's default `REPEATABLE READ` snapshot isolation prevents it via MVCC Undo Logs.
3. **Lost Update**: Explains the root vulnerability of naive high-concurrency commerce, and demonstrates the three relational remediation strategies:
   - Atomic in-place decrements (`UPDATE ... SET stock = stock - 1 WHERE stock > 0`).
   - Pessimistic Locking (`SELECT ... FOR UPDATE`).
   - Optimistic Concurrency Control (`WHERE version = ?`).
4. **Deadlock Reproduction (`ERROR 1213`)**:
   - Creates a cyclic lock dependency between `inventory` and `wallets`.
   - Forces InnoDB's background lock manager to detect the cycle in the Wait-For Graph and abort the transaction with the least work done.


---

## 10. Phase 7: Redis NoSQL Layer & Full RUD Implementation
- **Status**: Completed & Committed
- **Target Rubric**: Component 9: NoSQL Feature & Full RUD (7 Marks)
- **Engine**: Redis 7.2 (Alpine / In-Memory Key-Value & Data Structures)
- **Key Modules Created**:
  - `redis/lua/acquire_hold.lua`: Atomic Check-and-Decrement script for race-free 5-minute checkout holds with TTL.
  - `redis/lua/release_hold.lua`: Atomic hold cancellation and stock restitution.
  - `redis/crud_demo.ps1`: Interactive PowerShell / `redis-cli` verification suite proving full Create, Read, Update, Delete across Strings, Hashes, Sorted Sets, Sets, and Lua scripts.
  - `redis/crud_demo.js`: Node.js / `ioredis` programmatic test runner.
  - `redis/rebuild_stock_from_mysql.js`: Startup state hydration script syncing Redis from MySQL.
  - `redis/key-design.md`: Complete namespace architecture and eviction policies.

### Verification Runbook:
```powershell
# Execute the Redis 7 full RUD verification suite
.\redis\crud_demo.ps1
```
