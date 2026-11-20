# Component 07: SQL Queries (Joins, Nested, Correlated, Recursive CTEs, Window Functions)
**PES University DBMS Level 3 Evaluation Component 7 | Max Marks: 4**

---

## 1. Overview & Source Code Mapping
- **Primary Script**: `sql/09_queries.sql`
- **Engine**: MySQL 8.0 (InnoDB)
- **Scope**: Production-grade analytical, operational, and recursive query suite specifically mapped to the DBMS Level 3 evaluation syllabus.

---

## 2. Query Architecture Matrix

| Query # | Pattern / Technique | Target Tables | Business Defense / Problem Solved |
| :--- | :--- | :--- | :--- |
| **Q1.1** | **Inner Join (5 tables)** | `orders`, `users`, `drops`, `order_items`, `products`, `payments` | Customer order receipt synthesis with line-item detail and payment reference. |
| **Q1.2** | **Left Outer Join** | `users` $\rightarrow$ `orders`, `wallets` | Identifies inactive registered users with positive wallet balances for marketing. |
| **Q1.3** | **Right Outer Join + HAVING** | `orders` $\leftarrow$ `drops` | Audits catalog releases that have zero converted checkouts. |
| **Q1.4** | **Full Outer Join Emulation** | `users` $\cup$ `lottery_entries` | Emulates full outer join via `LEFT JOIN UNION RIGHT JOIN`. |
| **Q1.5** | **Self-Join** | `products` $\bowtie$ `products` | Compares product prices against category siblings to detect price anomalies. |
| **Q1.6** | **Cross Join** | `drops` $\times$ Shipping Zones | Cartesian matrix calculation for state tax and shipping projections. |
| **Q2.1** | **Scalar Subquery** | `drops` | Calculates price variance of each drop against the catalog-wide average. |
| **Q2.2** | **Nested Subquery (IN / NOT IN)**| `users`, `lottery_entries`, `orders` | Identifies lottery ballot holders who failed to convert into a final order. |
| **Q2.3** | **Correlated Subquery (EXISTS)** | `users`, `wallets`, `wallet_ledger` | Finds VIP customers with high-value wallet debits ($> \$150$). |
| **Q2.4** | **Correlated Subquery (NOT EXISTS)**| `users`, `orders`, `fraud_flags` | Audits verified clean customers who have zero bot or fraud flags. |
| **Q3.1** | **Recursive CTE (Taxonomy)** | `categories` | Traverses arbitrary parent-child hierarchy to construct full breadcrumbs. |
| **Q3.2** | **Recursive CTE (Referral Tree)** | `referrals` | Recursively traverses multi-tier viral invite trees and calculates viral depth. |
| **Q4.1** | **Window Functions (Ranking)** | `wallets`, `users` | Evaluates `RANK()`, `DENSE_RANK()`, and `ROW_NUMBER()` on wallet balances. |
| **Q4.2** | **Window Functions (LAG / LEAD)** | `purchase_attempts` | Analyzes microsecond latency deltas between consecutive requests to catch bots. |
| **Q4.3** | **Window Cumulative Sum** | `orders`, `drops` | Computes cumulative running revenue per drop over time using frame bounds. |
| **Q5.1** | **GROUP BY with HAVING** | `drops`, `orders` | Filters drops by gross merchandise value (GMV) and average order value. |
| **Q5.2** | **JSON Path Extraction** | `products` | Queries flexible sneaker attributes using MySQL 8's `->>` path operator. |

---

## 3. Detailed Walkthrough of Advanced Query Patterns

### A. Recursive Category Hierarchy Traversal (Q3.1)
```sql
WITH RECURSIVE CategoryHierarchy AS (
    -- Anchor Member: Root categories
    SELECT category_id, parent_id, name, slug, 1 AS depth_level, CAST(name AS CHAR(1000)) AS breadcrumb_path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive Member: Join children to their parents in the CTE
    SELECT c.category_id, c.parent_id, c.name, c.slug, ch.depth_level + 1, CONCAT(ch.breadcrumb_path, ' > ', c.name)
    FROM categories c
    INNER JOIN CategoryHierarchy ch ON c.parent_id = ch.category_id
)
SELECT category_id, depth_level, breadcrumb_path FROM CategoryHierarchy ORDER BY breadcrumb_path;
```
*Output*: Produces hierarchical navigation strings such as:
- `Footwear > Basketball Sneakers > Retro High Tops`
- `Apparel > Hoodies & Sweats > Oversized Vintage Hoodies`

---

### B. Anti-Bot Telemetry Delta with Window Function `LAG()` (Q4.2)
```sql
SELECT 
    attempt_id, user_id, ip_address, latency_ms, attempted_at,
    LAG(attempted_at, 1) OVER (PARTITION BY ip_address ORDER BY attempted_at) AS prev_attempt_time,
    TIMESTAMPDIFF(
        MICROSECOND,
        LAG(attempted_at, 1) OVER (PARTITION BY ip_address ORDER BY attempted_at),
        attempted_at
    ) AS delta_microseconds
FROM purchase_attempts
WHERE drop_id = 1
ORDER BY ip_address, attempted_at ASC;
```
*Viva Defense*: If `delta_microseconds` is less than 50,000 µs (50 milliseconds), no human could physically have clicked the button that quickly; this mathematically flags automated bot scripts in the database.

---

## 4. Examiner Viva Q&A (Component 7)

**Q1: What is the difference between `RANK()`, `DENSE_RANK()`, and `ROW_NUMBER()`?**
> *Defense*: 
> - `ROW_NUMBER()` assigns a unique, sequential integer to every row regardless of ties (e.g. 1, 2, 3, 4).
> - `RANK()` assigns the same rank to ties, but skips subsequent rank numbers (e.g. 1, 2, 2, 4).
> - `DENSE_RANK()` assigns the same rank to ties without skipping subsequent numbers (e.g. 1, 2, 2, 3).
> In FlashDrop, we use `DENSE_RANK()` for loyalty tiers so users with equal qualification points achieve the same reward tier without artificially jumping tier numbers.

**Q2: How does MySQL 8 execute a Recursive CTE under the hood?**
> *Defense*: MySQL executes the Anchor member query first and writes its result set into an internal temporary work table. It then repeatedly evaluates the Recursive member, joining the work table from the previous iteration until the recursive member returns an empty set. MySQL guards against runaway recursion using the system variable `cte_max_recursion_depth` (default 1000).

**Q3: Why use the `->>` operator instead of `JSON_EXTRACT()` for JSON columns?**
> *Defense*: `JSON_EXTRACT()` returns the value surrounded by JSON quotes (e.g. `"US 10.5"`). The `->>` operator is shorthand for `JSON_UNQUOTE(JSON_EXTRACT())`, which automatically unquotes the text and returns a clean SQL scalar string (`US 10.5`), simplifying `WHERE` clauses and indexing.

---

## 5. Innovation Feature: "FlashDrop AI" Natural Language to SQL Assistant

Located in the interactive admin interface at **`/admin/queries`**, the **FlashDrop AI Assistant** demonstrates real-world enterprise natural-language querying directly over MySQL 8.0 without exposing the database to SQL injection or mutating DDL/DML attacks.

### Architecture & Security Workflow

```
+-------------------------------------------------------------+
| Plain English Prompt (Examiner / Admin Input)               |
| e.g. "Who are our top 3 buyers by total spending?"          |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| Natural Language Semantic Intent Parser                     |
| (/api/admin/ai-sql)                                         |
| * Extracts entities, metrics, dimensions, thresholds        |
| * Synthesizes production MySQL 8 query with CTEs and Joins  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| AST Read-Only Safety Shield                                 |
| * Strict Regular Expression & Keyword AST Guard             |
| * Rejects: DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE,   |
|   REPLACE, CREATE, CALL, EXECUTE, GRANT, REVOKE             |
| * Enforces: SELECT-only statement boundary                  |
+------------------------------+------------------------------+
                               | Passed
                               v
+-------------------------------------------------------------+
| MySQL 8.0 Live Execution Engine (`adminPool`)               |
| * Executes read-only query against live database tables     |
| * Captures query latency (ms) and row count                 |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| Interactive Results Table & SQL Sandbox                     |
| * Formatted dynamic column rendering                        |
| * "Edit in Sandbox" button to test in Ad-Hoc SQL editor     |
+-------------------------------------------------------------+
```

### Supported Natural Language Query Categories

1. **Top Spenders & VIP Aggregation**:
   - *"Who are our top 3 buyers by total spending?"*
   - SQL: `SELECT u.user_id, u.username, u.email, COUNT(o.order_id) AS total_orders, SUM(o.total_amount) AS total_spent ... GROUP BY ... ORDER BY total_spent DESC LIMIT 3;`
2. **Speed & Sellout Velocity**:
   - *"Which drop sold out the fastest?"*
   - SQL: Computes `TIMESTAMPDIFF(SECOND, start_time, ended_at)` over completed drops.
3. **High-Value Customer Balances**:
   - *"Find any users whose wallet balance is greater than $500."*
   - SQL: Evaluates `wallets.balance >= 500` with customer profile joins.
4. **Fraud Detection & Rate-Limiting Violations**:
   - *"Show failed purchase attempts by IP address."*
   - SQL: Aggregates `purchase_attempts` where `status = 'FAILED'` grouped by IP.
5. **Ledger Double-Entry Audit Reconciliation**:
   - *"Show transaction ledger audit log."*
   - SQL: Multi-table join between `ledger_transactions`, `wallets`, and `users`.
6. **Stock Discrepancy & Drift**:
   - *"Compare drop inventory allocated vs orders placed."*
   - SQL: Subquery joins between `drop_items.initial_quantity`, `drop_items.current_stock`, and completed orders count.

### Viva Defense Points for FlashDrop AI
- **Q: Does this AI assistant touch the live database?**
  > *Defense*: Yes, it executes live read queries against MySQL 8.0 through the backend `adminPool` connection pool. However, it is protected by an AST Read-Only Safety Shield that mathematically blocks any query containing mutating DML (`INSERT`, `UPDATE`, `DELETE`) or DDL (`DROP`, `ALTER`, `TRUNCATE`), ensuring 100% database integrity while allowing full exploratory data analytics.
- **Q: How does it help the administrator?**
  > *Defense*: Non-technical inventory managers or auditors do not need to memorize SQL syntax or table joins across 20 tables. They can ask natural language questions in real-time, inspect the synthesized SQL, review the live execution time, and even click "Edit in Sandbox" to modify the query.
