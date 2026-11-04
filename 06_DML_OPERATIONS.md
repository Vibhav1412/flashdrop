# Component 06: Data Manipulation Language (DML) Operations
**PES University DBMS Level 3 Evaluation Component 6 | Max Marks: 4**

---

## 1. Overview & Source Code Mapping
- **Primary Script**: `sql/02_seed.sql`
- **Volume Target**: Thousands of records across all 19 entities to replicate realistic high-concurrency production scale.
- **Coverage**: Full CRUD lifecycle (`INSERT`, `SELECT`, `UPDATE`, `DELETE`) with referential consistency.

---

## 2. Seed Data Architecture & Volumetric Profile

| Entity Table | Seed Count Range | Description & Complexity |
| :--- | :---: | :--- |
| `roles` | 3 | Static seed (`admin`, `customer`, `auditor`). |
| `users` | 1,000+ | Customers with hashed passwords, active/suspended flags. |
| `addresses` | 1,200+ | Shipping addresses linked to users (1:N distribution). |
| `categories` | 20+ | Multi-level category hierarchy (root, intermediate, leaf categories). |
| `products` | 100+ | Sneaker & merch SKUs with structured JSON attributes. |
| `price_history` | 150+ | Historical price modification records. |
| `drops` | 20+ | Upcoming, live, and concluded flash drops. |
| `inventory` | 20+ | Stock allocations adhering to conservation constraints. |
| `orders` | 2,500+ | Realistic distribution of `pending`, `paid`, `cancelled` states. |
| `order_items` | 3,500+ | Line-items linked to parent orders. |
| `payments` | 2,500+ | Transaction receipts across wallet, card, and UPI. |
| `wallets` | 1,000+ | Dedicated wallet per user with non-negative balance checks. |
| `wallet_ledger` | 5,000+ | Balanced double-entry credit and debit entries. |
| `referrals` | 400+ | Directed acyclic graph representing viral referral trees. |
| `loyalty_tiers` | 4 | Bronze, Silver, Gold, Platinum tiers. |
| `user_tiers` | 1,000+ | Tier assignments based on cumulative user spend. |
| `lottery_entries` | 2,000+ | Timestamped ballot entries per user per drop. |
| `purchase_attempts` | 8,000+ | Concurrency logs tracking latency, bot flags, and conversions. |
| `fraud_flags` | 150+ | Telemetry flags linking suspicious users to risk scores. |
| `audit_log` | 5,000+ | Trigger-generated audit trails capturing DML state changes. |

---

## 3. High-Performance Bulk DML Generation Strategy

To seed thousands of rows without hitting connection timeouts, `sql/02_seed.sql` uses:
1. **Multi-row Batch `INSERT` statements** instead of single-row inserts (reducing network round-trips by 99%).
2. **Explicit Transaction Bundling**:
   ```sql
   SET autocommit = 0;
   START TRANSACTION;
   -- Batch inserts here...
   COMMIT;
   SET autocommit = 1;
   ```
3. **Deterministic FK Mapping**: Sequential generation guaranteeing child tables reference existing parent keys.

---

## 4. Verification DML Queries

```sql
-- 1. Verify entity row counts
SELECT 'users' AS entity, COUNT(*) AS count FROM users
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'wallet_ledger', COUNT(*) FROM wallet_ledger
UNION ALL SELECT 'purchase_attempts', COUNT(*) FROM purchase_attempts;

-- 2. Verify referential integrity of orders
SELECT o.order_number, u.email, d.title AS drop_name, o.final_amount, o.status
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN drops d ON o.drop_id = d.drop_id
LIMIT 5;
```

---

## 5. Examiner Viva Q&A (Component 6)

**Q1: Why is multi-row batch insert faster than inserting rows one by one in InnoDB?**
> *Defense*: Single-row inserts commit on every statement, forcing InnoDB to flush the Redo Log buffer to disk (fsync) for each record. Multi-row batch inserts within an explicit transaction group hundreds of rows into a single log write, drastically reducing I/O disk saturation and locking overhead.

**Q2: How did you ensure your seed data satisfies the database `CHECK` constraints?**
> *Defense*: The seed script enforces mathematical consistency programmatically: in `inventory`, `available_quantity` is computed as `total_allocated - reserved_holds - sold_quantity`; in `orders`, `final_amount` strictly equals `total_amount - discount_amount`; and in `wallet_ledger`, all credit/debit adjustments correspond with positive amounts and non-negative resulting balances.
