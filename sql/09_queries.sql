-- =====================================================================
-- PROJECT FLASHDROP: 09_QUERIES.SQL
-- Comprehensive Analytical & Relational Query Library
-- Engine: MySQL 8.0 (InnoDB)
-- Component 7: Queries (Joins, Nested, Correlated, Recursive CTEs, Window Functions)
-- Max Marks: 4
-- =====================================================================

USE flashdrop;

-- =====================================================================
-- SECTION 1: ALL JOIN VARIANTS
-- =====================================================================

-- ---------------------------------------------------------------------
-- Q1.1: INNER JOIN (Multi-Table Relational Synthesis)
-- Business Purpose: Retrieve completed orders with customer profile, drop title,
--                   product SKU, and payment transaction reference.
-- ---------------------------------------------------------------------
SELECT 
    o.order_number,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    u.email,
    d.title AS drop_title,
    p.sku,
    p.title AS product_name,
    oi.quantity,
    oi.unit_price,
    o.final_amount,
    pay.payment_method,
    pay.transaction_reference,
    o.created_at
FROM orders o
INNER JOIN users u ON o.user_id = u.user_id
INNER JOIN drops d ON o.drop_id = d.drop_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
INNER JOIN payments pay ON o.order_id = pay.order_id
WHERE o.status = 'paid'
ORDER BY o.created_at DESC
LIMIT 10;

-- ---------------------------------------------------------------------
-- Q1.2: LEFT OUTER JOIN (Find Unengaged Users)
-- Business Purpose: Identify registered customers who have NEVER placed an order,
--                   along with their wallet balance for re-engagement marketing.
-- ---------------------------------------------------------------------
SELECT 
    u.user_id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    w.balance AS unspent_wallet_balance,
    u.created_at AS registered_at
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
INNER JOIN wallets w ON u.user_id = w.user_id
WHERE o.order_id IS NULL AND u.role_id = 2 -- Customers only
ORDER BY w.balance DESC, u.created_at ASC
LIMIT 10;

-- ---------------------------------------------------------------------
-- Q1.3: RIGHT OUTER JOIN (Audit Drops with Zero Converted Orders)
-- Business Purpose: Identify all drops from the catalog that have zero orders
--                   placed against them (e.g. upcoming scheduled or draft drops).
-- ---------------------------------------------------------------------
SELECT 
    d.drop_id,
    d.title AS drop_title,
    d.status AS drop_status,
    d.drop_price,
    d.start_time,
    COUNT(o.order_id) AS total_orders_placed
FROM orders o
RIGHT JOIN drops d ON o.drop_id = d.drop_id
GROUP BY d.drop_id, d.title, d.status, d.drop_price, d.start_time
HAVING total_orders_placed = 0
ORDER BY d.start_time ASC;

-- ---------------------------------------------------------------------
-- Q1.4: FULL OUTER JOIN EMULATION (Users vs Lottery Entries Matrix)
-- Business Purpose: MySQL lacks native FULL OUTER JOIN syntax. We emulate exact
--                   relational union completeness via LEFT JOIN UNION RIGHT JOIN.
-- ---------------------------------------------------------------------
SELECT 
    u.user_id,
    u.email,
    le.ticket_number,
    le.is_winner,
    'USER_WITH_OR_WITHOUT_LOTTERY' AS source_side
FROM users u
LEFT JOIN lottery_entries le ON u.user_id = le.user_id AND le.drop_id = 1
WHERE u.user_id <= 20

UNION

SELECT 
    u.user_id,
    u.email,
    le.ticket_number,
    le.is_winner,
    'LOTTERY_ENTRY_SIDE' AS source_side
FROM users u
RIGHT JOIN lottery_entries le ON u.user_id = le.user_id AND le.drop_id = 1
WHERE le.entry_id <= 20;

-- ---------------------------------------------------------------------
-- Q1.5: SELF-JOIN (Category Peer Comparison)
-- Business Purpose: Compare products within the same parent category to identify
--                   which items are priced higher than other items in that same category.
-- ---------------------------------------------------------------------
SELECT 
    p1.sku AS product_sku,
    p1.title AS product_name,
    p1.base_price AS product_price,
    p2.title AS compared_to_sibling,
    p2.base_price AS sibling_price,
    (p1.base_price - p2.base_price) AS price_premium
FROM products p1
INNER JOIN products p2 ON p1.category_id = p2.category_id AND p1.product_id <> p2.product_id
WHERE p1.base_price > p2.base_price
ORDER BY price_premium DESC
LIMIT 10;

-- ---------------------------------------------------------------------
-- Q1.6: CROSS JOIN (Cartesian Shipping Zone Matrix)
-- Business Purpose: Cross drops with shipping states to generate a tax & fulfillment
--                   projection matrix.
-- ---------------------------------------------------------------------
SELECT 
    d.title AS drop_name,
    d.drop_price,
    zones.state,
    ROUND(d.drop_price * zones.tax_rate, 2) AS estimated_tax,
    ROUND(d.drop_price * (1 + zones.tax_rate), 2) AS total_estimated_cost
FROM drops d
CROSS JOIN (
    SELECT 'CA' AS state, 0.0925 AS tax_rate
    UNION ALL SELECT 'NY', 0.08875
    UNION ALL SELECT 'TX', 0.08250
    UNION ALL SELECT 'WA', 0.06500
) AS zones
WHERE d.status = 'live';


-- =====================================================================
-- SECTION 2: SUBQUERIES (Scalar, Nested IN, Correlated EXISTS)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Q2.1: SCALAR SUBQUERY IN SELECT
-- Business Purpose: Display each drop with its price and the absolute difference
--                   from the catalog-wide average drop price.
-- ---------------------------------------------------------------------
SELECT 
    d.drop_id,
    d.title,
    d.drop_price,
    (SELECT ROUND(AVG(drop_price), 2) FROM drops) AS platform_avg_drop_price,
    ROUND(d.drop_price - (SELECT AVG(drop_price) FROM drops), 2) AS variance_from_average
FROM drops d
ORDER BY d.drop_price DESC;

-- ---------------------------------------------------------------------
-- Q2.2: NESTED SUBQUERY WITH IN / NOT IN
-- Business Purpose: Find all users who entered the Drop 1 lottery but did NOT
--                   convert into a final paid order.
-- ---------------------------------------------------------------------
SELECT 
    u.user_id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name
FROM users u
WHERE u.user_id IN (
    -- Subquery 1: Users who held lottery ballots for Drop 1
    SELECT le.user_id 
    FROM lottery_entries le 
    WHERE le.drop_id = 1
)
AND u.user_id NOT IN (
    -- Subquery 2: Users who actually completed an order for Drop 1
    SELECT o.user_id 
    FROM orders o 
    WHERE o.drop_id = 1 AND o.status = 'paid'
)
LIMIT 10;

-- ---------------------------------------------------------------------
-- Q2.3: CORRELATED SUBQUERY WITH EXISTS
-- Business Purpose: Find high-value VIP buyers who have made at least one wallet
--                   debit transaction greater than $150.00.
-- ---------------------------------------------------------------------
SELECT 
    u.user_id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    w.balance AS current_balance
FROM users u
INNER JOIN wallets w ON u.user_id = w.user_id
WHERE EXISTS (
    SELECT 1 
    FROM wallet_ledger wl
    WHERE wl.wallet_id = w.wallet_id
      AND wl.entry_type = 'DEBIT'
      AND wl.amount >= 150.00
)
ORDER BY w.balance ASC
LIMIT 10;

-- ---------------------------------------------------------------------
-- Q2.4: CORRELATED SUBQUERY WITH NOT EXISTS (Bot Shield Audit)
-- Business Purpose: Find users who placed orders but NEVER triggered a single
--                   suspicious fraud flag in the telemetry log.
-- ---------------------------------------------------------------------
SELECT 
    u.user_id,
    u.email,
    COUNT(o.order_id) AS verified_clean_orders
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM fraud_flags ff 
    WHERE ff.user_id = u.user_id
)
GROUP BY u.user_id, u.email
ORDER BY verified_clean_orders DESC
LIMIT 10;


-- =====================================================================
-- SECTION 3: RECURSIVE COMMON TABLE EXPRESSIONS (CTEs)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Q3.1: RECURSIVE CTE 1: Category Taxonomy Breadcrumb Hierarchy
-- Business Purpose: Recursively traverse product taxonomy tree from root categories
--                   down to arbitrary depth, building complete hierarchical breadcrumbs.
-- ---------------------------------------------------------------------
WITH RECURSIVE CategoryHierarchy AS (
    -- Anchor Member: Select all top-level root categories (parent_id IS NULL)
    SELECT 
        category_id,
        parent_id,
        name AS category_name,
        slug,
        1 AS depth_level,
        CAST(name AS CHAR(1000)) AS breadcrumb_path
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive Member: Join children to their parents in the CTE
    SELECT 
        c.category_id,
        c.parent_id,
        c.name,
        c.slug,
        ch.depth_level + 1 AS depth_level,
        CONCAT(ch.breadcrumb_path, ' > ', c.name) AS breadcrumb_path
    FROM categories c
    INNER JOIN CategoryHierarchy ch ON c.parent_id = ch.category_id
)
SELECT 
    category_id,
    depth_level,
    breadcrumb_path,
    slug
FROM CategoryHierarchy
ORDER BY breadcrumb_path ASC;

-- ---------------------------------------------------------------------
-- Q3.2: RECURSIVE CTE 2: Viral Referral Tree Depth & Lineage Analysis
-- Business Purpose: Traverse viral referral graph to calculate referral depth,
--                   lineage tree path, and multi-tier rewards.
-- ---------------------------------------------------------------------
WITH RECURSIVE ReferralLineage AS (
    -- Anchor Member: Find top root referrers (users who were not referred by anyone)
    SELECT 
        r.referrer_id,
        r.referee_id,
        1 AS viral_depth,
        CAST(CONCAT('User ', r.referrer_id, ' -> User ', r.referee_id) AS CHAR(1000)) AS lineage_chain
    FROM referrals r
    WHERE r.referrer_id NOT IN (SELECT referee_id FROM referrals)

    UNION ALL

    -- Recursive Member: Find subsequent invitees in the chain
    SELECT 
        r.referrer_id,
        r.referee_id,
        rl.viral_depth + 1 AS viral_depth,
        CONCAT(rl.lineage_chain, ' -> User ', r.referee_id) AS lineage_chain
    FROM referrals r
    INNER JOIN ReferralLineage rl ON r.referrer_id = rl.referee_id
)
SELECT 
    referrer_id AS original_promoter,
    referee_id AS current_invitee,
    viral_depth,
    lineage_chain
FROM ReferralLineage
ORDER BY viral_depth DESC, referrer_id ASC
LIMIT 15;


-- =====================================================================
-- SECTION 4: WINDOW FUNCTIONS (OLAP & Analytical SQL)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Q4.1: RANK() vs DENSE_RANK() vs ROW_NUMBER()
-- Business Purpose: Rank customers based on their wallet deposits to determine
--                   VIP early access allocation, illustrating ranking differences.
-- ---------------------------------------------------------------------
SELECT 
    w.user_id,
    u.email,
    w.balance,
    ROW_NUMBER() OVER (ORDER BY w.balance DESC) AS row_num,
    RANK()       OVER (ORDER BY w.balance DESC) AS rank_pos,
    DENSE_RANK() OVER (ORDER BY w.balance DESC) AS dense_rank_pos
FROM wallets w
INNER JOIN users u ON w.user_id = u.user_id
LIMIT 15;

-- ---------------------------------------------------------------------
-- Q4.2: LAG() & LEAD() for Anti-Bot Telemetry Analysis
-- Business Purpose: Calculate latency delta between consecutive purchase attempts
--                   from the same IP address to expose sub-second script automation.
-- ---------------------------------------------------------------------
SELECT 
    attempt_id,
    user_id,
    ip_address,
    latency_ms,
    attempted_at,
    LAG(attempted_at, 1) OVER (PARTITION BY ip_address ORDER BY attempted_at) AS prev_attempt_time,
    TIMESTAMPDIFF(
        MICROSECOND,
        LAG(attempted_at, 1) OVER (PARTITION BY ip_address ORDER BY attempted_at),
        attempted_at
    ) AS delta_microseconds_from_previous
FROM purchase_attempts
WHERE drop_id = 1
ORDER BY ip_address, attempted_at ASC
LIMIT 15;

-- ---------------------------------------------------------------------
-- Q4.3: RUNNING TOTAL & CUMULATIVE REVENUE
-- Business Purpose: Compute cumulative daily revenue per drop over time using
--                   window framing.
-- ---------------------------------------------------------------------
SELECT 
    o.drop_id,
    d.title AS drop_title,
    o.order_id,
    o.final_amount,
    o.created_at,
    SUM(o.final_amount) OVER (
        PARTITION BY o.drop_id 
        ORDER BY o.created_at 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_drop_revenue
FROM orders o
INNER JOIN drops d ON o.drop_id = d.drop_id
WHERE o.status = 'paid'
ORDER BY o.drop_id, o.created_at ASC
LIMIT 15;


-- =====================================================================
-- SECTION 5: ADVANCED AGGREGATION & JSON QUERIES
-- =====================================================================

-- ---------------------------------------------------------------------
-- Q5.1: GROUP BY with HAVING & Filtering
-- Business Purpose: Identify drops generating over $10,000 in gross merchandise
--                   value (GMV) with average checkout value.
-- ---------------------------------------------------------------------
SELECT 
    d.drop_id,
    d.title,
    d.status,
    COUNT(o.order_id) AS total_orders,
    SUM(o.final_amount) AS total_revenue_gmv,
    ROUND(AVG(o.final_amount), 2) AS average_order_value
FROM drops d
INNER JOIN orders o ON d.drop_id = o.drop_id
WHERE o.status = 'paid'
GROUP BY d.drop_id, d.title, d.status
HAVING total_revenue_gmv > 1000.00
ORDER BY total_revenue_gmv DESC;

-- ---------------------------------------------------------------------
-- Q5.2: JSON Extraction & Querying
-- Business Purpose: Query product attributes inside MySQL 8's binary JSON column
--                   using path expressions (-> and ->>) and filtering.
-- ---------------------------------------------------------------------
SELECT 
    product_id,
    sku,
    title,
    base_price,
    JSON_UNQUOTE(JSON_EXTRACT(attributes_json, '$.edition')) AS release_edition,
    attributes_json->>'$.colorway' AS colorway,
    attributes_json->>'$.size' AS shoe_size,
    attributes_json->>'$.weight_grams' AS weight_in_grams
FROM products
WHERE attributes_json->>'$.release_year' = '2026'
ORDER BY base_price DESC;

