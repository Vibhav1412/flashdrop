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

### Connection Pool Configuration:
```typescript
import mysql from 'mysql2/promise';

// Customer Pool (Least Privilege: Catalog reads, Stored Procedure Execution)
export const customerPool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'flashdrop',
  user: process.env.DB_CUSTOMER_USER || 'flashdrop_customer_user',
  password: process.env.DB_CUSTOMER_PASSWORD,
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

// Admin Pool (Full Administration, Drops, Telemetry)
export const adminPool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'flashdrop',
  user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
  password: process.env.DB_ADMIN_PASSWORD,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
});
```

---

## 3. Integration Handlers & Endpoints

1. **`POST /api/drops/[id]/hold`**:
   - Executes `acquire_hold.lua` via `ioredis`.
   - On success: Returns hold token and 300s TTL.
   - On failure: Returns `OUT_OF_STOCK` or `RATE_LIMITED`.
2. **`POST /api/orders/checkout`**:
   - Acquires a connection from `customerPool`.
   - Calls stored procedure `CALL sp_place_order(...)`.
   - Invokes Redis `DEL hold:{drop}:{user}` to release hold state upon commit.
3. **`GET /api/admin/metrics`**:
   - Acquires connection from `adminPool`.
   - Executes analytical view queries on `vw_admin_sales_summary`.

---

## 4. Examiner Viva Q&A (Component 11)

**Q1: Why use connection pooling instead of opening a new MySQL connection per HTTP request?**
> *Defense*: Establishing a TCP connection and performing the MySQL authentication handshake takes 20–50 ms of CPU time. Under flash drop conditions with thousands of requests per second, creating connections per request causes port exhaustion and crashes the MySQL server. Connection pools pre-warm and reuse an established set of persistent connections, reducing query dispatch latency to under 1 millisecond.

**Q2: What happens if an API handler crashes midway through checkout?**
> *Defense*: Because checkout is wrapped in MySQL stored procedure `sp_place_order` with an active transaction (`START TRANSACTION`), any uncommitted state is rolled back automatically by the MySQL server when the connection returns to the pool or drops.

