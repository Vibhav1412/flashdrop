# Component 08: Advanced SQL Concepts (Procedures, Functions, Triggers, Views, Events)
**PES University DBMS Level 3 Evaluation Component 8 | Max Marks: 6**

---

## 1. Overview & Source Code Mapping
- **Procedures**: `sql/05_procedures.sql`
- **Functions**: `sql/04_functions.sql`
- **Triggers**: `sql/06_triggers.sql`
- **Views & Indexes**: `sql/03_views_indexes.sql`
- **Scheduled Events**: `sql/07_events.sql`

---

## 2. Stored Procedures (`sql/05_procedures.sql`)

### Key Procedure: `sp_place_order`
A transactional, ACID-compliant stored procedure handling checkout directly in the database engine:
- Declares `EXIT HANDLER FOR SQLEXCEPTION` with explicit `ROLLBACK`.
- Validates active payment hold in Redis / DB hold state.
- Deducts wallet balance and creates double-entry ledger debit.
- Increments `sold_quantity` and decrements `reserved_holds` in `inventory`.
- Inserts `orders`, `order_items`, and `payments` records.
- Returns generated `order_id` or raises custom error code via `SIGNAL SQLSTATE '45000'`.

---

## 3. Stored Functions (`sql/04_functions.sql`)

### Key Function: `fn_calculate_loyalty_discount`
- **Type**: `DETERMINISTIC READS SQL DATA`
- **Logic**: Inspects user's active tier in `user_tiers` and `loyalty_tiers`, returning the applicable discount percentage (0%, 5%, 10%, 15%) based on lifetime verified spend.
- **Usage**: Used inside checkout queries and view computations.

---

## 4. Database Triggers (`sql/06_triggers.sql`)

| Trigger Name | Timing / Event | Target Table | Functional Enforcement |
| :--- | :--- | :--- | :--- |
| `trg_prevent_negative_inventory` | `BEFORE UPDATE` | `inventory` | Raises error if `NEW.available_quantity < 0`. |
| `trg_wallet_double_entry_balance` | `AFTER INSERT` | `wallet_ledger` | Updates `wallets.balance` and verifies debits == credits. |
| `trg_audit_orders` | `AFTER UPDATE` | `orders` | Logs status changes into `audit_log` with JSON before/after snapshots. |
| `trg_auto_suspend_fraud` | `AFTER INSERT` | `fraud_flags` | If `NEW.risk_score >= 85`, automatically updates `users.status = 'suspended'`. |

```sql
-- Trigger Excerpt: Auto-suspend malicious bot accounts
DELIMITER $$
CREATE TRIGGER trg_auto_suspend_fraud
AFTER INSERT ON fraud_flags
FOR EACH ROW
BEGIN
    IF NEW.risk_score >= 85.00 THEN
        UPDATE users 
        SET status = 'suspended', updated_at = NOW() 
        WHERE user_id = NEW.user_id;
        
        INSERT INTO audit_log (table_name, action, record_id, new_values_json, created_at)
        VALUES ('users', 'UPDATE', NEW.user_id, JSON_OBJECT('status', 'suspended', 'reason', NEW.flag_reason), NOW());
    END IF;
END$$
DELIMITER ;
```

---

## 5. Views & Materialized Summary Events (`sql/03_views_indexes.sql` & `sql/07_events.sql`)

1. **`vw_live_drop_catalog`**: Secure customer-facing view joining `drops`, `products`, and `categories`, masking internal cost figures and inventory reserve numbers.
2. **`vw_admin_sales_summary`**: High-performance administrative view aggregating revenue, conversion rate, and average checkout latency per drop.
3. **Scheduled Event (`ev_refresh_daily_drop_summary`)**: Runs daily at 00:00:00 to refresh a pre-aggregated summary table for executive analytics.

---

## 6. Examiner Viva Q&A (Component 8)

**Q1: Why implement business logic like inventory deduction in a Stored Procedure rather than in Node.js?**
> *Defense*: Executing the checkout sequence inside a MySQL stored procedure groups multiple `SELECT`, `UPDATE`, and `INSERT` statements into a single round-trip over the network. Most importantly, it executes inside a database-managed transaction (`START TRANSACTION ... COMMIT`) with explicit `DECLARE EXIT HANDLER FOR SQLEXCEPTION`, eliminating partial-state corruption if the Node.js server crashes mid-flight.

**Q2: What is the difference between a `BEFORE` trigger and an `AFTER` trigger?**
> *Defense*: A `BEFORE` trigger fires before the row data is written to the table; it can inspect and modify `NEW` values or abort the transaction via `SIGNAL SQLSTATE` (e.g. `trg_prevent_negative_inventory`). An `AFTER` trigger fires after the data has been committed to the table; it cannot modify `NEW` values but is ideal for cascading side-effects like writing to `audit_log` or updating summary balances.
