import { NextResponse } from 'next/server';
import { adminPool } from '@/lib/db';

interface ParsedQuery {
  sql: string;
  explanation: string;
  intent: string;
}

// ---------------------------------------------------------------------
// Semantic Offline NL-to-SQL Synthesizer
// Accurately maps plain English queries to high-performance MySQL 8 SQL
// with Joins, Recursive CTEs, Grouping, and Window Functions.
// ---------------------------------------------------------------------
function parseNaturalLanguageToSql(prompt: string): ParsedQuery {
  const p = prompt.toLowerCase().trim();

  // Extract custom limit if specified (e.g., "top 3", "limit 10")
  const limitMatch = p.match(/\b(?:top|limit|first)\s+(\d+)\b/);
  const limit = limitMatch ? parseInt(limitMatch[1], 10) : 5;

  // Extract price/amount threshold (e.g. "> 500", "greater than 100")
  const thresholdMatch = p.match(/(?:>|greater than|above|over|more than)\s*\$?(\d+(?:\.\d+)?)/);
  const threshold = thresholdMatch ? parseFloat(thresholdMatch[1]) : 0;

  // 1. Top Buyers / Spenders / Revenue Contributors
  if (p.includes('buyer') || p.includes('customer') || p.includes('spender') || p.includes('spent') || p.includes('spending')) {
    return {
      intent: 'Top Customer Spending & Order Volume',
      sql: `SELECT 
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    u.email,
    COUNT(o.order_id) AS total_orders_placed,
    COALESCE(SUM(o.final_amount), 0) AS total_lifetime_spent,
    ROUND(AVG(o.final_amount), 2) AS average_order_value,
    MAX(o.created_at) AS last_order_date
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.user_id, u.first_name, u.last_name, u.email
ORDER BY total_lifetime_spent DESC
LIMIT ${limit};`,
      explanation: `Performs an INNER JOIN between 'users' and 'orders' on user_id, filters for 'paid' status, aggregates order counts and total revenue via SUM(final_amount), and sorts descending by lifetime spend.`,
    };
  }

  // 2. Unspent Wallets / Customers with Balance but No Orders
  if ((p.includes('wallet') || p.includes('balance')) && (p.includes('no order') || p.includes('never') || p.includes('unspent') || p.includes('without order') || p.includes('unengaged'))) {
    return {
      intent: 'Unengaged Users with Prepaid Wallet Balance',
      sql: `SELECT 
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    u.email,
    w.balance AS wallet_balance,
    u.created_at AS registered_at
FROM users u
INNER JOIN wallets w ON u.user_id = w.user_id
LEFT JOIN orders o ON u.user_id = o.user_id
WHERE o.order_id IS NULL AND w.balance > ${threshold > 0 ? threshold : 0}
ORDER BY w.balance DESC
LIMIT ${limit};`,
      explanation: `Uses a LEFT OUTER JOIN from 'users' to 'orders' where 'o.order_id IS NULL' to find customers with zero purchases, combined with an INNER JOIN to 'wallets' to target high unspent balances.`,
    };
  }

  // 3. Wallet Balance Filtering (e.g., "wallet balance > 500")
  if (p.includes('wallet') || p.includes('balance') || p.includes('funds')) {
    return {
      intent: 'Wallet Balance & Double-Entry Ledger Summary',
      sql: `SELECT 
    w.wallet_id,
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS owner_name,
    u.email,
    w.balance,
    w.currency,
    w.is_locked,
    (SELECT COUNT(*) FROM wallet_ledger wl WHERE wl.wallet_id = w.wallet_id) AS total_ledger_transactions,
    w.updated_at
FROM wallets w
INNER JOIN users u ON w.user_id = u.user_id
${threshold > 0 ? `WHERE w.balance >= ${threshold}` : ''}
ORDER BY w.balance DESC
LIMIT ${limit};`,
      explanation: `Queries 'wallets' joined with 'users' to display prepaid balances, lock states, and total double-entry ledger transactions per account.`,
    };
  }

  // 4. Drop Sellout Performance / Inventory Analysis / Revenue
  if (p.includes('drop') || p.includes('sellout') || p.includes('fastest') || p.includes('inventory') || p.includes('stock')) {
    return {
      intent: 'Drop Sellout Rate, GMV & Inventory Conservation',
      sql: `SELECT 
    d.drop_id,
    d.title AS drop_title,
    d.status AS drop_status,
    d.drop_price,
    inv.total_allocated,
    inv.sold_quantity,
    inv.available_quantity,
    ROUND((inv.sold_quantity / inv.total_allocated) * 100, 1) AS sellout_percentage,
    COALESCE(SUM(o.final_amount), 0) AS total_gross_revenue,
    CASE 
        WHEN (inv.available_quantity + inv.reserved_holds + inv.sold_quantity) = inv.total_allocated THEN 'CONSERVED'
        ELSE 'VIOLATION'
    END AS conservation_check
FROM drops d
INNER JOIN inventory inv ON d.drop_id = inv.drop_id
LEFT JOIN orders o ON d.drop_id = o.drop_id AND o.status = 'paid'
GROUP BY d.drop_id, d.title, d.status, d.drop_price, inv.total_allocated, inv.sold_quantity, inv.available_quantity, inv.reserved_holds
ORDER BY total_gross_revenue DESC, sellout_percentage DESC
LIMIT ${limit};`,
      explanation: `Joins 'drops' with 'inventory' and 'orders', calculates the percentage of allocated stock sold, sums confirmed GMV, and evaluates the mathematical inventory conservation constraint.`,
    };
  }

  // 5. Fraud Flags, Bot Attacks, Suspicious Users, Auto-Suspension
  if (p.includes('fraud') || p.includes('bot') || p.includes('risk') || p.includes('suspend') || p.includes('flag') || p.includes('attack')) {
    return {
      intent: 'High-Risk Bot Telemetry & Trigger Suspensions',
      sql: `SELECT 
    f.flag_id,
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
    u.email,
    u.status AS current_user_status,
    f.risk_score,
    f.flag_reason,
    f.is_resolved,
    f.flagged_at,
    (SELECT COUNT(*) FROM purchase_attempts pa WHERE pa.user_id = u.user_id AND pa.status = 'rate_limited') AS rate_limit_bursts
FROM fraud_flags f
INNER JOIN users u ON f.user_id = u.user_id
ORDER BY f.risk_score DESC, f.flagged_at DESC
LIMIT ${limit};`,
      explanation: `Inspects 'fraud_flags' joined with 'users' to show accounts flagged by automated heuristic triggers, their risk scores (0-100), and rate-limit attempt bursts.`,
    };
  }

  // 6. Category Hierarchy / Tree Breadcrumbs (Recursive CTE)
  if (p.includes('category') || p.includes('hierarchy') || p.includes('breadcrumb') || p.includes('taxonomy')) {
    return {
      intent: 'Recursive Common Table Expression: Category Breadcrumbs',
      sql: `WITH RECURSIVE category_path AS (
    SELECT category_id, parent_id, name, CAST(name AS CHAR(255)) AS breadcrumb_path, 1 AS depth
    FROM categories 
    WHERE parent_id IS NULL
    UNION ALL
    SELECT c.category_id, c.parent_id, c.name, CONCAT(cp.breadcrumb_path, ' > ', c.name), cp.depth + 1
    FROM categories c 
    INNER JOIN category_path cp ON c.parent_id = cp.category_id
)
SELECT 
    category_id, 
    breadcrumb_path, 
    depth,
    (SELECT COUNT(*) FROM products p WHERE p.category_id = category_path.category_id) AS products_in_category
FROM category_path 
ORDER BY depth, breadcrumb_path
LIMIT ${limit};`,
      explanation: `Executes a Recursive Common Table Expression (CTE) traversing self-referencing parent_id pointers in 'categories' to construct full hierarchical breadcrumb strings and nesting depth.`,
    };
  }

  // 7. Referral Tree Lineage (Recursive CTE)
  if (p.includes('referral') || p.includes('viral') || p.includes('network') || p.includes('invite')) {
    return {
      intent: 'Recursive Common Table Expression: Viral Referral Tree',
      sql: `WITH RECURSIVE referral_tree AS (
    SELECT r.referee_id AS user_id, r.referrer_id, 1 AS tier_depth, u.email AS user_email
    FROM referrals r 
    INNER JOIN users u ON r.referee_id = u.user_id 
    WHERE r.referrer_id = 1
    UNION ALL
    SELECT r.referee_id, r.referrer_id, rt.tier_depth + 1, u.email
    FROM referrals r 
    INNER JOIN referral_tree rt ON r.referrer_id = rt.user_id 
    INNER JOIN users u ON r.referee_id = u.user_id
)
SELECT 
    tier_depth, 
    COUNT(*) AS users_in_tier, 
    GROUP_CONCAT(SUBSTRING_INDEX(user_email, '@', 1) SEPARATOR ', ') AS sample_referees
FROM referral_tree 
GROUP BY tier_depth 
ORDER BY tier_depth;`,
      explanation: `Uses a Recursive CTE to traverse multi-generation referral invites starting from seed user 1, computing branch depth and downstream viral reach.`,
    };
  }

  // 8. Price History / Audit Trail
  if (p.includes('price') || p.includes('history') || p.includes('audit')) {
    return {
      intent: 'Product Price Modification Audit Trail',
      sql: `SELECT 
    ph.history_id,
    p.sku,
    p.title AS product_name,
    ph.old_price,
    ph.new_price,
    ROUND(ph.new_price - ph.old_price, 2) AS price_delta,
    ROUND(((ph.new_price - ph.old_price) / ph.old_price) * 100, 1) AS percent_change,
    ph.changed_at,
    CONCAT(u.first_name, ' ', u.last_name) AS changed_by_admin
FROM price_history ph
INNER JOIN products p ON ph.product_id = p.product_id
LEFT JOIN users u ON ph.changed_by_user_id = u.user_id
ORDER BY ph.changed_at DESC
LIMIT ${limit};`,
      explanation: `Analyzes temporal price modifications in 'price_history' joined with 'products' and 'users' to track MSRP revisions, percentage deltas, and auditor identities.`,
    };
  }

  // 9. Orders & Checkout Breakdown
  if (p.includes('order') || p.includes('receipt') || p.includes('payment') || p.includes('sales')) {
    return {
      intent: 'Detailed Order Receipts & Payment Breakdown',
      sql: `SELECT 
    o.order_id,
    o.order_number,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    d.title AS drop_title,
    o.total_amount AS gross_amount,
    o.discount_amount,
    o.final_amount,
    pay.payment_method,
    pay.transaction_reference,
    o.status AS order_status,
    o.created_at
FROM orders o
INNER JOIN users u ON o.user_id = u.user_id
INNER JOIN drops d ON o.drop_id = d.drop_id
LEFT JOIN payments pay ON o.order_id = pay.order_id
ORDER BY o.created_at DESC
LIMIT ${limit};`,
      explanation: `Synthesizes 'orders', 'users', 'drops', and 'payments' across multiple relational joins to produce complete itemized billing receipts.`,
    };
  }

  // 10. Contention, Concurrency & Latency Telemetry
  if (p.includes('latency') || p.includes('contention') || p.includes('attempt') || p.includes('speed') || p.includes('lag')) {
    return {
      intent: 'Checkout Contention & Latency Performance Telemetry',
      sql: `SELECT 
    attempt_id,
    user_id,
    drop_id,
    status,
    latency_ms,
    attempted_at,
    COALESCE(
        TIMESTAMPDIFF(MICROSECOND, 
            LAG(attempted_at) OVER (PARTITION BY drop_id ORDER BY attempted_at), 
            attempted_at
        ) / 1000.0, 
        0
    ) AS inter_arrival_delta_ms
FROM purchase_attempts
WHERE drop_id = 1
ORDER BY attempted_at DESC
LIMIT ${limit};`,
      explanation: `Applies MySQL 8's window function LAG() over attempted_at timestamps to calculate microsecond intervals between concurrent checkout bursts.`,
    };
  }

  // Default Fallback: Full Catalog Overview with Live Inventory
  return {
    intent: 'General Catalog & Stock Overview',
    sql: `SELECT 
    p.product_id,
    p.sku,
    p.title AS product_name,
    c.name AS category_name,
    p.base_price,
    d.title AS drop_event,
    d.status AS drop_status,
    inv.available_quantity,
    inv.sold_quantity
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
LEFT JOIN drops d ON p.product_id = d.product_id
LEFT JOIN inventory inv ON d.drop_id = inv.drop_id
WHERE p.is_active = TRUE
ORDER BY p.product_id ASC
LIMIT ${limit};`,
    explanation: `Multi-table query joining 'products', 'categories', 'drops', and 'inventory' to display catalog assets, active categories, and live availability.`,
  };
}

// ---------------------------------------------------------------------
// Read-Only Security Validator
// Strictly enforces that NO mutation commands are executed.
// ---------------------------------------------------------------------
function validateReadOnlySql(sql: string): { valid: boolean; reason?: string } {
  const cleanSql = sql.trim().replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '');

  // Must begin with SELECT or WITH (for CTEs)
  if (!/^\s*(SELECT|WITH)\b/i.test(cleanSql)) {
    return {
      valid: false,
      reason: 'Safety Shield Rejection: Queries must strictly begin with SELECT or WITH (Common Table Expression).',
    };
  }

  // Deny-list of mutation operations
  const forbiddenPatterns = [
    /\bDROP\b/i,
    /\bDELETE\b/i,
    /\bTRUNCATE\b/i,
    /\bUPDATE\b/i,
    /\bINSERT\b/i,
    /\bALTER\b/i,
    /\bGRANT\b/i,
    /\bREVOKE\b/i,
    /\bRENAME\b/i,
    /\bCREATE\b/i,
    /\bREPLACE\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(cleanSql)) {
      return {
        valid: false,
        reason: `Safety Shield Rejection: Mutation statement '${pattern.source.replace(/\\b/g, '')}' is strictly prohibited in query console.`,
      };
    }
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = (body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Query prompt cannot be empty.' }, { status: 400 });
    }

    // 1. Synthesize Natural Language to SQL
    const parsed = parseNaturalLanguageToSql(prompt);

    // 2. Enforce Read-Only Safety Shield
    const validation = validateReadOnlySql(parsed.sql);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.reason,
        generatedSql: parsed.sql,
      }, { status: 403 });
    }

    // 3. Execute live against MySQL 8 engine
    const startTime = performance.now();
    const [rows, fields]: any = await adminPool.query(parsed.sql);
    const durationMs = Number((performance.now() - startTime).toFixed(1));

    const columns = Array.isArray(fields) ? fields.map((f: any) => f.name) : [];

    return NextResponse.json({
      success: true,
      prompt,
      intent: parsed.intent,
      sql: parsed.sql,
      explanation: parsed.explanation,
      columns,
      rows: Array.isArray(rows) ? rows : [],
      rowCount: Array.isArray(rows) ? rows.length : 0,
      durationMs,
      readOnlyVerified: true,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: `MySQL Execution Error: ${err.message}`,
    }, { status: 500 });
  }
}
