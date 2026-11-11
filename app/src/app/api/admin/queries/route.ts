import { NextResponse } from 'next/server';
import { adminPool } from '@/lib/db';

const PRESET_QUERIES: Record<string, { title: string; category: string; description: string; sql: string }> = {
  'recursive_category_tree': {
    title: '1. Recursive CTE: Hierarchical Category Breadcrumbs',
    category: 'Recursive CTE (Component 7)',
    description: 'Traverses self-referencing categories table to generate full breadcrumb path and depth levels.',
    sql: `WITH RECURSIVE category_path AS (
  SELECT category_id, parent_id, name, CAST(name AS CHAR(255)) AS breadcrumb_path, 1 AS depth
  FROM categories WHERE parent_id IS NULL
  UNION ALL
  SELECT c.category_id, c.parent_id, c.name, CONCAT(cp.breadcrumb_path, ' > ', c.name), cp.depth + 1
  FROM categories c INNER JOIN category_path cp ON c.parent_id = cp.category_id
)
SELECT category_id, breadcrumb_path, depth FROM category_path ORDER BY depth, breadcrumb_path;`,
  },
  'recursive_referral_depth': {
    title: '2. Recursive CTE: Viral Referral Network Depth',
    category: 'Recursive CTE (Component 7)',
    description: 'Traverses multi-generation referral invites from seed users to measure viral spread depth.',
    sql: `WITH RECURSIVE referral_tree AS (
  SELECT r.referee_id AS user_id, r.referrer_id, 1 AS tier_depth, u.email AS user_email
  FROM referrals r INNER JOIN users u ON r.referee_id = u.user_id WHERE r.referrer_id = 1
  UNION ALL
  SELECT r.referee_id, r.referrer_id, rt.tier_depth + 1, u.email
  FROM referrals r INNER JOIN referral_tree rt ON r.referrer_id = rt.user_id INNER JOIN users u ON r.referee_id = u.user_id
)
SELECT tier_depth, COUNT(*) AS users_in_tier, GROUP_CONCAT(SUBSTRING_INDEX(user_email, '@', 1) SEPARATOR ', ') AS sample_users
FROM referral_tree GROUP BY tier_depth ORDER BY tier_depth;`,
  },
  'window_lag_latency': {
    title: '3. Window Function: LAG() Checkout Inter-Arrival Delta',
    category: 'Window Functions (Component 7)',
    description: 'Computes microsecond inter-arrival latency deltas between consecutive burst checkout attempts.',
    sql: `SELECT attempt_id, user_id, drop_id, outcome, created_at,
       COALESCE(TIMESTAMPDIFF(MICROSECOND, LAG(created_at) OVER (PARTITION BY drop_id ORDER BY created_at), created_at) / 1000.0, 0) AS delta_ms
FROM purchase_attempts WHERE drop_id = 1 LIMIT 12;`,
  },
  'window_running_gmv': {
    title: '4. Window Function: Running Cumulative GMV Sales',
    category: 'Window Functions (Component 7)',
    description: 'Calculates progressive running total of gross merchandise volume without subqueries.',
    sql: `SELECT order_id, user_id, drop_id, total_amount, created_at,
       SUM(total_amount) OVER (ORDER BY created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_cumulative_gmv
FROM orders ORDER BY created_at LIMIT 15;`,
  },
  'correlated_fraud_check': {
    title: '5. Correlated Subquery: High-Velocity Fraud Detection',
    category: 'Correlated Subqueries (Component 7)',
    description: 'Finds flagged users who also triggered RATE_LIMITED outcomes via correlated EXISTS.',
    sql: `SELECT u.user_id, u.email, u.status, f.reason, f.severity, f.flagged_at
FROM users u
INNER JOIN fraud_flags f ON u.user_id = f.user_id
WHERE EXISTS (
  SELECT 1 FROM purchase_attempts pa 
  WHERE pa.user_id = u.user_id AND pa.outcome = 'RATE_LIMITED'
)
LIMIT 10;`,
  },
  'json_functional_extraction': {
    title: '6. JSON Functional Query: Sneaker Attributes & Sizing',
    category: 'JSON Functional Indexing (Component 8)',
    description: 'Extracts unstructured JSON sizing and colorways optimized by functional B-tree indexing.',
    sql: `SELECT product_id, sku, title, base_price,
       attributes_json->>'$.colorway' AS colorway,
       CAST(attributes_json->>'$.size' AS CHAR(10)) AS shoe_size,
       attributes_json->>'$.edition' AS edition,
       attributes_json->>'$.weight_grams' AS weight_grams
FROM products LIMIT 6;`,
  },
  'wallet_double_entry_reconciliation': {
    title: '7. Double-Entry Ledger Reconciliation (Triggers)',
    category: 'Double-Entry Integrity (Component 8)',
    description: 'Mathematically verifies that sum(credits) - sum(debits) in wallet_ledger equals wallets.balance.',
    sql: `SELECT w.wallet_id, w.user_id, w.balance AS stated_balance,
       COALESCE(SUM(CASE WHEN wl.transaction_type = 'CREDIT' THEN wl.amount ELSE -wl.amount END), 0) AS calculated_ledger_balance,
       COUNT(wl.entry_id) AS total_ledger_entries
FROM wallets w
LEFT JOIN wallet_ledger wl ON w.wallet_id = wl.wallet_id
GROUP BY w.wallet_id, w.user_id, w.balance
LIMIT 10;`,
  },
  'vw_live_drop_catalog': {
    title: '8. Relational View: vw_live_drop_catalog',
    category: 'Views (Component 8)',
    description: 'Live catalog view combining drops, inventory, and dynamic urgency status.',
    sql: `SELECT drop_id, drop_title, drop_price, drop_status, sku, product_title, category_name, available_quantity, stock_urgency_badge
FROM vw_live_drop_catalog;`,
  },
  'vw_admin_sales_summary': {
    title: '9. Relational View: vw_admin_sales_summary',
    category: 'Views (Component 8)',
    description: 'Aggregates drop performance, total orders, GMV, and average order value.',
    sql: `SELECT drop_id, title, status, total_orders, total_revenue_gmv, average_order_value
FROM vw_admin_sales_summary;`,
  },
};

export async function GET() {
  return NextResponse.json({
    success: true,
    presets: Object.entries(PRESET_QUERIES).map(([key, item]) => ({
      key,
      title: item.title,
      category: item.category,
      description: item.description,
      sql: item.sql,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let querySql = body.sql;

    if (body.key && PRESET_QUERIES[body.key]) {
      querySql = PRESET_QUERIES[body.key].sql;
    }

    if (!querySql || typeof querySql !== 'string') {
      return NextResponse.json({ success: false, error: 'No SQL query provided.' }, { status: 400 });
    }

    // Safety guard: only allow read-only analytical queries in console
    const trimmed = querySql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
      return NextResponse.json(
        { success: false, error: 'Safety Guard: Only SELECT and WITH analytical queries are permitted in the interactive console.' },
        { status: 403 }
      );
    }

    const start = performance.now();
    const [rows]: any = await adminPool.query(querySql);
    const durationMs = (performance.now() - start).toFixed(2);

    let columns: string[] = [];
    if (Array.isArray(rows) && rows.length > 0) {
      columns = Object.keys(rows[0]);
    }

    return NextResponse.json({
      success: true,
      columns,
      rows: Array.isArray(rows) ? rows : [],
      rowCount: Array.isArray(rows) ? rows.length : 0,
      durationMs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

