# Component 03: SQL Database Implementation (DDL with Strict Constraints)
**PES University DBMS Level 3 Evaluation Component 3 | Max Marks: 4**

---

## 1. Overview & Source Code Mapping
- **Primary Script**: `sql/01_schema.sql`
- **Engine**: MySQL 8.0 InnoDB
- **Character Set**: `utf8mb4` | **Collation**: `utf8mb4_unicode_ci`

This component defines the complete declarative schema covering all 19 tables with:
1. `PRIMARY KEY` specifications on all tables.
2. `FOREIGN KEY` constraints with explicit `ON DELETE` / `ON UPDATE` referential actions (`RESTRICT` for critical accounting/catalog assets; `CASCADE` for dependent line-items).
3. `CHECK` constraints enforcing business domain rules at the storage engine level.
4. `UNIQUE` constraints preventing duplicate emails, phone numbers, SKUs, and lottery ballots.
5. `NOT NULL` and `DEFAULT` value guarantees.

---

## 2. Critical Constraint Matrix

| Table Name | Constraint Type | Constraint Expression / Policy | Justification |
| :--- | :--- | :--- | :--- |
| `inventory` | `CHECK` | `available_quantity >= 0` | Hardware-level barrier against overselling. |
| `inventory` | `CHECK` | `available_quantity + reserved_holds + sold_quantity = total_allocated` | Enforces mathematical inventory conservation. |
| `wallets` | `CHECK` | `balance >= 0` | Financial safeguard preventing negative balances. |
| `wallet_ledger` | `CHECK` | `amount > 0` | Guarantees non-zero ledger entries. |
| `drops` | `CHECK` | `end_time > start_time` | Prevents illogical temporal release windows. |
| `orders` | `CHECK` | `final_amount = (total_amount - discount_amount)` | Guarantees discount calculations. |
| `users` | `UNIQUE` | `email`, `phone` | Prevents multiple accounts with same credentials. |
| `order_items` | `FK Action` | `ON DELETE CASCADE` | Child line-items deleted if draft order is purged. |
| `categories` | `FK Action` | `ON DELETE RESTRICT` | Prevents deleting a parent category with existing children. |
| `products` | `FK Action` | `ON DELETE RESTRICT` | Prevents deleting products tied to historical orders. |

---

## 3. Representative DDL Excerpt with Constraints

```sql
-- Inventory with Conservation & Non-Negative Checks
CREATE TABLE inventory (
    inventory_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    drop_id BIGINT UNSIGNED NOT NULL UNIQUE,
    total_allocated INT UNSIGNED NOT NULL,
    reserved_holds INT UNSIGNED NOT NULL DEFAULT 0,
    sold_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    available_quantity INT NOT NULL,
    version INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_drop FOREIGN KEY (drop_id) REFERENCES drops(drop_id) ON DELETE RESTRICT,
    CONSTRAINT chk_inv_available_nonneg CHECK (available_quantity >= 0),
    CONSTRAINT chk_inv_reserved_nonneg CHECK (reserved_holds >= 0),
    CONSTRAINT chk_inv_sold_nonneg CHECK (sold_quantity >= 0),
    CONSTRAINT chk_inv_conservation CHECK (available_quantity + reserved_holds + sold_quantity = total_allocated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Double-Entry Wallet Ledger
CREATE TABLE wallet_ledger (
    ledger_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wallet_id BIGINT UNSIGNED NOT NULL,
    entry_type ENUM('CREDIT', 'DEBIT') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    reference_type ENUM('deposit', 'order_payment', 'refund', 'referral_bonus') NOT NULL,
    reference_id VARCHAR(64) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id) ON DELETE RESTRICT,
    CONSTRAINT chk_ledger_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_ledger_balance_nonneg CHECK (balance_after >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Verification & Testing

To inspect and test table constraints directly in MySQL:
```sql
-- 1. Verify all 19 tables are created
SHOW TABLES;

-- 2. Inspect table definitions and constraints
SELECT 
    TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE 
FROM 
    information_schema.TABLE_CONSTRAINTS 
WHERE 
    TABLE_SCHEMA = 'flashdrop';

-- 3. Test negative stock check (MUST FAIL with error 3819)
INSERT INTO inventory (drop_id, total_allocated, reserved_holds, sold_quantity, available_quantity)
VALUES (1, 100, 0, 0, -5);
-- Expected: Error 3819: Check constraint 'chk_inv_available_nonneg' is violated.
```

---

## 5. Examiner Viva Q&A (Component 3)

**Q1: In MySQL 8, are `CHECK` constraints strictly enforced? How is this different from older MySQL versions?**
> *Defense*: Yes, MySQL 8.0.16 and later fully parses and strictly enforces `CHECK` constraints. In MySQL 5.7 and earlier, `CHECK` constraints were parsed for compatibility but silently ignored by the engine. In FlashDrop, `chk_inv_available_nonneg` physically aborts any statement attempting to reduce `available_quantity` below zero.

**Q2: Why use `RESTRICT` instead of `CASCADE` on category deletions and product deletions?**
> *Defense*: `RESTRICT` prevents accidental data loss. If an administrator attempts to delete a parent category or a product with existing purchase history, the database aborts the transaction, preserving relational audit trails and historical reports.
