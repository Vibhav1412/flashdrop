-- =====================================================================
-- PROJECT FLASHDROP: 03_VIEWS_INDEXES.SQL
-- Engine: MySQL 8.0 (InnoDB)
-- Component 8: Advanced Database Concepts (Views & Performance B-Tree Indexes)
-- =====================================================================

USE flashdrop;

-- =====================================================================
-- 1. SECURE & ANALYTICAL VIEWS
-- =====================================================================

-- View 1: Customer-Facing Live Drop Catalog
-- Purpose: Masks internal reserve thresholds and shows clean active drop listings
CREATE OR REPLACE VIEW vw_live_drop_catalog AS
SELECT 
    d.drop_id,
    d.slug AS drop_slug,
    d.title AS drop_title,
    d.drop_price,
    d.start_time,
    d.end_time,
    d.status AS drop_status,
    p.product_id,
    p.sku,
    p.title AS product_title,
    c.name AS category_name,
    p.attributes_json,
    inv.available_quantity,
    CASE 
        WHEN inv.available_quantity = 0 THEN 'SOLD_OUT'
        WHEN inv.available_quantity <= 10 THEN 'ALMOST_GONE'
        ELSE 'AVAILABLE'
    END AS stock_urgency_badge
FROM drops d
INNER JOIN products p ON d.product_id = p.product_id
INNER JOIN categories c ON p.category_id = c.category_id
INNER JOIN inventory inv ON d.drop_id = inv.drop_id
WHERE d.status IN ('live', 'scheduled') AND p.is_active = TRUE;

-- View 2: Admin Executive Sales & Latency Summary
-- Purpose: Aggregates revenue, order volume, and latency metrics per drop
CREATE OR REPLACE VIEW vw_admin_sales_summary AS
SELECT 
    d.drop_id,
    d.title AS drop_title,
    d.status AS drop_status,
    d.drop_price,
    inv.total_allocated,
    inv.sold_quantity,
    inv.available_quantity,
    ROUND((inv.sold_quantity / inv.total_allocated) * 100, 2) AS sellout_rate_pct,
    COUNT(DISTINCT o.order_id) AS total_paid_orders,
    COALESCE(SUM(o.final_amount), 0.00) AS total_revenue_usd,
    COALESCE(ROUND(AVG(pa.latency_ms), 1), 0.0) AS avg_checkout_latency_ms,
    COUNT(DISTINCT pa.attempt_id) AS total_burst_attempts
FROM drops d
INNER JOIN inventory inv ON d.drop_id = inv.drop_id
LEFT JOIN orders o ON d.drop_id = o.drop_id AND o.status = 'paid'
LEFT JOIN purchase_attempts pa ON d.drop_id = pa.drop_id
GROUP BY d.drop_id, d.title, d.status, d.drop_price, inv.total_allocated, inv.sold_quantity, inv.available_quantity;

-- View 3: Customer Personal Order History View
-- Purpose: Provides clean order breakdown for the logged-in customer portal
CREATE OR REPLACE VIEW vw_customer_order_history AS
SELECT 
    o.order_id,
    o.order_number,
    o.user_id,
    d.title AS drop_title,
    p.title AS product_title,
    oi.quantity,
    oi.unit_price,
    o.final_amount,
    pay.payment_method,
    pay.transaction_reference,
    o.status AS order_status,
    o.created_at
FROM orders o
INNER JOIN drops d ON o.drop_id = d.drop_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
LEFT JOIN payments pay ON o.order_id = pay.order_id;


-- =====================================================================
-- 2. PERFORMANCE B-TREE & COMPOSITE INDEXES
-- =====================================================================

-- Index 1: High-concurrency drop orders lookup by user and status
CREATE INDEX idx_orders_user_status ON orders (user_id, status, created_at);

-- Index 2: Covering Index for rapid wallet balance verification
CREATE INDEX idx_wallets_user_balance ON wallets (user_id, balance);

-- Index 3: Composite Index for double-entry ledger auditing
CREATE INDEX idx_ledger_wallet_type ON wallet_ledger (wallet_id, entry_type, created_at);

-- Index 4: High-frequency telemetry indexing for bot detection (IP + Time window)
CREATE INDEX idx_pa_ip_attempted ON purchase_attempts (ip_address, attempted_at);

-- Index 5: Functional / Expression Index on JSON attributes (Shoe Size filtering)
-- Enables instant index lookups for: WHERE attributes_json->>'$.size' = 'US 10.5'
CREATE INDEX idx_products_json_size ON products ((CAST(attributes_json->>'$.size' AS CHAR(16))));

-- Index 6: Drop status and date window index for storefront queries
CREATE INDEX idx_drops_status_window ON drops (status, start_time, end_time);
