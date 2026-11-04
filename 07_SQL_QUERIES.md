# Component 07: SQL Queries (Joins, Nested, Correlated, Recursive CTEs)
**PES University DBMS Level 3 Evaluation Component 7 | Max Marks: 4**

---

## 1. Overview & Source Code Mapping
- **Primary Script**: `sql/09_queries.sql`
- **Scope**: Demonstrates mastery of all SQL query patterns across relational algebra operations, hierarchical structures, analytical reporting, and query optimizer plans.

---

## 2. Query Catalog by Category

### A. All Join Variants
1. **Inner Join**: Fetching confirmed orders with customer details and line-item totals.
2. **Left Outer Join**: Finding all registered users who have NEVER placed an order (`WHERE o.order_id IS NULL`).
3. **Right Outer Join**: Identifying drops with zero associated purchase attempts.
4. **Full Outer Join Emulation**: MySQL lacks native `FULL OUTER JOIN`; we achieve exact mathematical equivalence using `LEFT JOIN ... UNION ... RIGHT JOIN`.
5. **Self-Join**: Finding products in the same category priced higher than their category sibling average.
6. **Cross Join**: Generating cartesian matrix of drops $\times$ shipping zones for tax simulation.

### B. Nested & Correlated Subqueries
1. **Scalar Subquery**: Showing each user's latest order amount alongside their lifetime average order value.
2. **Nested Subquery with `IN` / `NOT IN`**: Finding users who participated in drops that completely sold out in under 60 seconds.
3. **Correlated Subquery with `EXISTS`**:
   ```sql
   -- Find all customers who have at least one debit transaction exceeding $500 in the wallet ledger
   SELECT u.user_id, u.email, u.first_name, u.last_name
   FROM users u
   WHERE EXISTS (
       SELECT 1 
       FROM wallets w
       JOIN wallet_ledger wl ON w.wallet_id = wl.wallet_id
       WHERE w.user_id = u.user_id 
         AND wl.entry_type = 'DEBIT' 
         AND wl.amount > 500.00
   );
   ```

### C. Recursive Common Table Expressions (CTEs)
1. **Recursive Category Hierarchy Traversal**: Traverses root categories down through subcategories to build full breadcrumb paths (`Men > Footwear > Sneakers > Limited Edition`).
2. **Recursive Referral Tree & Viral Chain Analysis**: Traverses viral invite chains to calculate referral depth and multi-tier commission distribution.
   ```sql
   WITH RECURSIVE ReferralTree AS (
       -- Anchor Member: Root referrers (who were not referred by anyone)
       SELECT 
           r.referrer_id, 
           r.referee_id, 
           1 AS referral_depth,
           CAST(r.referrer_id AS CHAR(1000)) AS referral_path
       FROM referrals r
       WHERE r.referrer_id NOT IN (SELECT referee_id FROM referrals)
       
       UNION ALL
       
       -- Recursive Member: Find children referred by current level referees
       SELECT 
           r.referrer_id, 
           r.referee_id, 
           rt.referral_depth + 1,
           CONCAT(rt.referral_path, ' -> ', r.referrer_id)
       FROM referrals r
       JOIN ReferralTree rt ON r.referrer_id = rt.referee_id
   )
   SELECT * FROM ReferralTree ORDER BY referral_depth, referrer_id;
   ```

### D. Window Functions (Analytical SQL)
1. **`RANK()` & `DENSE_RANK()`**: Ranking top spenders per loyalty tier.
2. **`ROW_NUMBER()`**: Deduplicating duplicate purchase attempts to find the earliest millisecond entry.
3. **`LAG()` & `LEAD()`**: Calculating the time difference (in milliseconds) between consecutive checkout requests to detect automated bot scripts.
4. **Running Totals**: Cumulative daily revenue generated per flash drop using `SUM(final_amount) OVER (PARTITION BY drop_id ORDER BY created_at)`.

---

## 3. Examiner Viva Q&A (Component 7)

**Q1: How does a correlated subquery differ from an uncorrelated subquery in terms of execution?**
> *Defense*: An uncorrelated subquery is independent of the outer query; the database executes it once, caches the result set, and evaluates the outer query against it. A correlated subquery references columns from the outer table (e.g., `WHERE w.user_id = u.user_id`), meaning the subquery is conceptually evaluated once for every candidate row evaluated by the outer query. The MySQL optimizer uses index lookups on the correlated column to maintain acceptable performance.

**Q2: What is the terminating condition in a Recursive CTE? What happens if you omit it?**
> *Defense*: A Recursive CTE consists of an Anchor query, a `UNION ALL`, and a Recursive query joined to the CTE name. The terminating condition occurs when the recursive member returns an empty set (i.e., no more matching children). If omitted or circular dependencies exist, MySQL aborts execution once `cte_max_recursion_depth` (default 1000) is exceeded, preventing an infinite loop.
