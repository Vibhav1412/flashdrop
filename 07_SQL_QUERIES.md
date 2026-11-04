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
*Viva Defense*: If `delta_microseconds` is less than 50,000 $\mu\text{s}$ (50 milliseconds), no human could physically have clicked the button that quickly; this mathematically flags automated bot scripts in the database.

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
