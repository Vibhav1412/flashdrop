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

