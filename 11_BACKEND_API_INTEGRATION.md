# Component 11: Backend / API & Database Integration
**PES University DBMS Level 3 Evaluation Component 11 | Max Marks: 2**

---

## 1. Overview & Source Code Mapping
- **Runtime**: Node.js 20+ / Next.js Server Route Handlers
- **Database Drivers**: `mysql2/promise` (Connection Pooling) & `ioredis` (Redis Client)
- **Integration Core**: `app/src/lib/db.ts` & `app/src/lib/redis.ts`

---

## 2. Dual Connection Pool Architecture

To enforce database-level security and prevent application-level privilege escalation, FlashDrop does NOT use a single database connection. The backend maintains **two isolated `mysql2` connection pools**:

```text
                               +-----------------------------+
                               |     Next.js API Handler     |
                               +-----------------------------+
                                             |
                              Inspect User Role from JWT
                                             |
                      +----------------------+----------------------+
                      | (role == 'admin')                           | (role == 'customer')
                      v                                             v
        +----------------------------+                +----------------------------+
        |      Admin DB Pool         |                |     Customer DB Pool       |
        | User: flashdrop_admin_user |                | User: flashdrop_customer   |
        | Role: flashdrop_admin      |                | Role: flashdrop_customer   |
        | Full Privileges            |                | Restricted Privileges      |
        +----------------------------+                +----------------------------+
                      \                                             /
                       \                                           /
                        v                                         v
                      +---------------------------------------------+
                      |               MySQL 8.0 Engine              |
                      +---------------------------------------------+
```

---

## 3. Integration Endpoints Implemented

1. **`GET /api/drops`**:
   - Queries `vw_live_drop_catalog` via `customerPool`.
   - Enriches each record with live Redis inventory counts from `drop:{id}:stock`.
2. **`POST /api/drops/[id]/hold`**:
   - Executes atomic Lua script `acquire_hold.lua` via `ioredis`.
   - Returns 300-second reservation hold token.
3. **`POST /api/checkout`**:
   - Acquires connection from `customerPool`.
   - Calls stored procedure `CALL sp_place_order(userId, dropId, paymentMethod, @order_id, @status_code, @status_msg)`.
   - Deletes Redis hold on commit.
4. **`GET /api/wallet`**:
   - Queries `wallets` and `wallet_ledger` via `customerPool`.
5. **`GET /api/admin/metrics`**:
   - Acquires connection from elevated `adminPool` to query `vw_admin_sales_summary` and `fraud_flags`.

---

## 4. Examiner Viva Q&A (Component 11)

**Q1: Why use connection pooling instead of opening a new MySQL connection per HTTP request?**
> *Defense*: Establishing a TCP connection and performing the MySQL authentication handshake takes 20–50 ms of CPU time. Under flash drop conditions with thousands of requests per second, creating connections per request causes port exhaustion and crashes the MySQL server. Connection pools pre-warm and reuse an established set of persistent connections, reducing query dispatch latency to under 1 millisecond.

**Q2: What happens if an API handler crashes midway through checkout?**
> *Defense*: Because checkout is wrapped in MySQL stored procedure `sp_place_order` with an active transaction (`START TRANSACTION`), any uncommitted state is rolled back automatically by the MySQL server when the connection returns to the pool or drops.
