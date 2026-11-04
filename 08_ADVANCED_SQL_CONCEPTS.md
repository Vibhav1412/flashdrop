# Component 08: Advanced SQL Concepts (Procedures, Functions, Triggers, Views & Events)
**PES University DBMS Level 3 Evaluation Component 8 | Max Marks: 6**

---

## 1. Overview & Source Code Mapping
- **Views & Performance Indexes**: `sql/03_views_indexes.sql`
- **Stored Functions**: `sql/04_functions.sql`
- **Stored Procedures & Transactions**: `sql/05_procedures.sql`
- **Database Triggers**: `sql/06_triggers.sql`
- **Scheduled Events**: `sql/07_events.sql`
- **Engine**: MySQL 8.0 (InnoDB)

---

## 2. Advanced Concepts Implementation Matrix

| Category | Database Object | Primary Business Logic & Concurrency Control |
| :--- | :--- | :--- |
| **View** | `vw_live_drop_catalog` | Masks backend reservation metrics; presents dynamic stock urgency badges (`SOLD_OUT`, `ALMOST_GONE`). |
| **View** | `vw_admin_sales_summary` | Pre-computes sellout rate percentage, order volume, and average burst latency across drop cohorts. |
| **Index** | `idx_products_json_size` | **Functional / Expression B-Tree Index** on JSON attribute path (`attributes_json->>'$.size'`). |
| **Function** | `fn_calculate_loyalty_discount` | `DETERMINISTIC READS SQL DATA`: Calculates user discount percentage based on active tier achievement. |
| **Function** | `fn_is_user_suspended` | High-speed boolean guard verifying user account standing prior to transaction execution. |
| **Procedure** | `sp_place_order` | **ACID Transactional Checkout**: Uses `DECLARE EXIT HANDLER FOR SQLEXCEPTION`, pessimistic row locking (`FOR UPDATE`), inventory decrement, and ledger updates. |
| **Procedure** | `sp_deposit_wallet` | Atomic prepaid wallet deposit with matching double-entry ledger `CREDIT` row. |
| **Procedure** | `sp_reconcile_drop_inventory`| Discrepancy detector auditing physical `order_items` against reported inventory counts. |
| **Trigger** | `trg_prevent_negative_inventory` | `BEFORE UPDATE ON inventory`: Throws `SIGNAL SQLSTATE '45000'` if `available_quantity < 0`. |
| **Trigger** | `trg_auto_suspend_fraud` | `AFTER INSERT ON fraud_flags`: Auto-suspends malicious bots when `risk_score >= 85` and writes to `audit_log`. |
| **Trigger** | `trg_audit_orders` | `AFTER UPDATE ON orders`: Logs status mutations into `audit_log` with JSON before/after state snapshots. |
| **Event** | `ev_refresh_daily_drop_summary` | Hourly scheduled background event refreshing a materialized-style analytical summary table. |

---

## 3. Deep Dive: `sp_place_order` Transaction Flow

```text
[Incoming Checkout Request]
           │
           ▼
[Check fn_is_user_suspended()] ──(Suspended)──► Return 'USER_SUSPENDED' (Exit)
           │ (Active)
           ▼
[Verify Drop is 'live'] ─────────(Not Live)───► Return 'DROP_NOT_LIVE' (Exit)
           │
           ▼
[START TRANSACTION]
           │
           ▼
[SELECT available_quantity ... FOR UPDATE] ──(Qty <= 0)──► ROLLBACK & Return 'OUT_OF_STOCK'
           │ (Qty > 0)
           ▼
[Verify & Deduct Wallet Balance] ──────────(Insufficient)─► ROLLBACK & Return 'INSUFFICIENT_FUNDS'
           │
           ▼
[Append DEBIT to wallet_ledger]
           │
           ▼
[UPDATE inventory: decrement available, increment sold, bump version]
           │
           ▼
[INSERT orders, order_items, payments]
           │
           ▼
[COMMIT TRANSACTION] ────────────────────────────────────► Return 'SUCCESS'
```

---

## 4. Examiner Viva Q&A (Component 8)

**Q1: What is the purpose of `DECLARE EXIT HANDLER FOR SQLEXCEPTION` in `sp_place_order`?**
> *Defense*: If any statement inside the procedure encounters an unexpected error (e.g. disk failure, foreign key mismatch, check constraint violation), execution is immediately transferred to the handler. The handler executes `ROLLBACK;`, completely undoing any partial changes to `wallets`, `inventory`, or `orders`, preventing database state corruption.

**Q2: What is the difference between a Stored Procedure and a Stored Function in MySQL?**
> *Defense*: 
> 1. A function must return a single value via the `RETURN` statement and can be used directly inside SQL expressions (e.g. `SELECT fn_calculate_loyalty_discount(42)`). A procedure returns values through `OUT`/`INOUT` parameters or result sets and must be invoked with `CALL`.
> 2. A stored procedure can execute transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`), whereas stored functions cannot start or commit transactions.

**Q3: How does your Expression Index on JSON work (`idx_products_json_size`)?**
> *Defense*: By default, MySQL cannot directly index a dynamic JSON document with a standard B-tree. MySQL 8 introduces functional indexing, where we index the result of a deterministic expression: `CREATE INDEX idx_products_json_size ON products ((CAST(attributes_json->>'$.size' AS CHAR(16))))`. When a user filters by shoe size, the query optimizer uses this B-tree index directly instead of parsing the JSON of every row.
