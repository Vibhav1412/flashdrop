// =====================================================================
// FLASHDROP: app/src/app/api/ai/chat/route.ts
// Dual-Persona Role-Aware AI Assistant API (Customer Concierge + Admin Intelligence)
// Component 11: Backend/API & DB Integration
// Component 12: Role-Based Access Control in DB (RBAC)
// =====================================================================

import { NextResponse } from 'next/server';
import { adminPool, customerPool } from '@/lib/db';
import { redis } from '@/lib/redis';

interface UserSession {
  userId: number;
  email: string;
  role: 'customer' | 'admin' | 'guest';
  name: string;
}

// ---------------------------------------------------------------------
// 1. Session Extractor
// ---------------------------------------------------------------------
async function getSessionFromRequest(request: Request): Promise<UserSession> {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/flashdrop_session=([a-f0-9]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return { userId: 0, email: '', role: 'guest', name: 'Shopper' };
  }

  const session = await redis.hgetall(`session:${token}`);
  if (!session || !session.userId) {
    return { userId: 0, email: '', role: 'guest', name: 'Shopper' };
  }

  return {
    userId: Number(session.userId),
    email: session.email || '',
    role: (session.role as 'customer' | 'admin') || 'customer',
    name: session.name || 'Shopper',
  };
}

// ---------------------------------------------------------------------
// 2. Read-Only Safety Shield (for Admin Ad-Hoc Queries)
// ---------------------------------------------------------------------
function validateReadOnlySql(sql: string): { valid: boolean; reason?: string } {
  const cleanSql = sql.trim().replace(/\/\*[\s\S]*?\*\/|--.*$/gm, '');
  if (!/^\s*(SELECT|WITH)\b/i.test(cleanSql)) {
    return {
      valid: false,
      reason: 'Safety Shield: Only read-only SELECT or WITH (CTE) statements are permitted.',
    };
  }

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
        reason: `Safety Shield: Mutation command '${pattern.source.replace(/\\b/g, '')}' is blocked.`,
      };
    }
  }

  return { valid: true };
}

// ---------------------------------------------------------------------
// 3. Customer-Oriented Intent Resolver (Isolated to session.userId)
// ---------------------------------------------------------------------
async function handleCustomerChat(prompt: string, user: UserSession) {
  const p = prompt.toLowerCase().trim();
  const userId = user.userId;

  // A. Guest prompt (not signed in)
  if (user.role === 'guest' || !userId) {
    const [drops]: any = await adminPool.query(
      `SELECT d.drop_id, d.title, d.status, d.drop_price, inv.available_quantity 
       FROM drops d 
       JOIN inventory inv ON d.drop_id = inv.drop_id 
       WHERE d.status IN ('live', 'scheduled') 
       ORDER BY d.start_time ASC LIMIT 3`
    );

    return {
      role: 'customer',
      persona: 'FlashDrop Concierge',
      message: `Welcome to FlashDrop! You are currently browsing as a guest. Please sign in to check your personal wallet balance, reserve holds, and view your orders. Here are the latest active drops in our catalog!`,
      sql: `SELECT d.drop_id, d.title, d.status, d.drop_price, inv.available_quantity FROM drops d JOIN inventory inv ON d.drop_id = inv.drop_id WHERE d.status IN ('live', 'scheduled') ORDER BY d.start_time ASC LIMIT 3;`,
      rows: drops,
      columns: ['title', 'status', 'drop_price', 'available_quantity'],
      suggestedQuestions: [
        'Sign in to check wallet balance',
        'Which drops are live right now?',
        'How does the 5-minute checkout hold work?',
      ],
    };
  }

  // B. Wallet Balance & Double-Entry Ledger
  if (p.includes('wallet') || p.includes('balance') || p.includes('funds') || p.includes('money') || p.includes('cash')) {
    const [walletRows]: any = await adminPool.query(
      `SELECT w.wallet_id, w.balance, w.currency, w.is_locked, w.updated_at 
       FROM wallets w 
       WHERE w.user_id = ?`,
      [userId]
    );

    const [ledgerRows]: any = await adminPool.query(
      `SELECT wl.ledger_id, wl.entry_type, wl.amount, wl.balance_after, wl.description, wl.created_at 
       FROM wallet_ledger wl 
       JOIN wallets w ON wl.wallet_id = w.wallet_id 
       WHERE w.user_id = ? 
       ORDER BY wl.ledger_id DESC 
       LIMIT 5`,
      [userId]
    );

    const balance = walletRows[0]?.balance ? Number(walletRows[0].balance).toFixed(2) : '0.00';
    const isLocked = walletRows[0]?.is_locked ? '⚠️ (Locked)' : '✅ Active';

    return {
      role: 'customer',
      persona: 'FlashDrop Concierge',
      message: `Hello ${user.name.split(' ')[0]}! Your current prepaid wallet balance is **$${balance} USD** (${isLocked}). Below are your most recent double-entry ledger transactions:`,
      sql: `-- Customer-Scoped Query (Isolated by user_id = ${userId})\nSELECT wl.ledger_id, wl.entry_type, wl.amount, wl.balance_after, wl.description, wl.created_at\nFROM wallet_ledger wl\nJOIN wallets w ON wl.wallet_id = w.wallet_id\nWHERE w.user_id = ${userId}\nORDER BY wl.ledger_id DESC LIMIT 5;`,
      rows: ledgerRows,
      columns: ['ledger_id', 'entry_type', 'amount', 'balance_after', 'description', 'created_at'],
      suggestedQuestions: [
        'What orders have I placed?',
        'Am I in any waiting room queue or hold?',
        'Which drops are available to buy?',
      ],
    };
  }

  // C. My Orders & Purchase Receipts
  if (p.includes('order') || p.includes('receipt') || p.includes('purchase') || p.includes('bought') || p.includes('history')) {
    const [orders]: any = await adminPool.query(
      `SELECT o.order_id, o.order_number, d.title AS drop_title, o.final_amount, o.status, o.created_at 
       FROM orders o 
       JOIN drops d ON o.drop_id = d.drop_id 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC 
       LIMIT 5`,
      [userId]
    );

    const count = orders.length;
    const msg = count > 0 
      ? `You have placed **${count}** order(s) on your account. Here are the details of your confirmed purchases:`
      : `You haven't placed any orders yet. Check out the live drops to claim a 5-minute atomic checkout hold!`;

    return {
      role: 'customer',
      persona: 'FlashDrop Concierge',
      message: msg,
      sql: `-- Customer Order Isolation via user_id = ${userId}\nSELECT o.order_id, o.order_number, d.title AS drop_title, o.final_amount, o.status, o.created_at\nFROM orders o\nJOIN drops d ON o.drop_id = d.drop_id\nWHERE o.user_id = ${userId}\nORDER BY o.created_at DESC LIMIT 5;`,
      rows: orders,
      columns: ['order_id', 'order_number', 'drop_title', 'final_amount', 'status', 'created_at'],
      suggestedQuestions: [
        'What is my wallet balance?',
        'Which drops are live right now?',
        'Do I have any referral reward points?',
      ],
    };
  }

  // D. Active Waiting Room Queue & Holds (Redis Concurrency Check)
  if (p.includes('hold') || p.includes('queue') || p.includes('waiting') || p.includes('lock') || p.includes('timer')) {
    // Check Redis for active holds
    const holdKey1 = await redis.get(`hold:1:${userId}`);
    const ttl1 = holdKey1 ? await redis.ttl(`hold:1:${userId}`) : -1;
    const holdKey2 = await redis.get(`hold:2:${userId}`);
    const ttl2 = holdKey2 ? await redis.ttl(`hold:2:${userId}`) : -1;

    // Check waiting queue rank
    const queueRank = await redis.zrank('drop:1:queue', String(userId));

    let holdStatus = 'You have no active 5-minute checkout holds right now.';
    if (ttl1 > 0) {
      holdStatus = `⚡ **Active Hold on Drop #1**: You have an atomic reservation lock with **${ttl1} seconds** remaining before your stock auto-reverts to the pool!`;
    } else if (ttl2 > 0) {
      holdStatus = `⚡ **Active Hold on Drop #2**: You have an atomic reservation lock with **${ttl2} seconds** remaining!`;
    }

    const queueStatus = queueRank !== null 
      ? `\n🎟️ You are currently **#${queueRank + 1}** in the waiting room queue for Drop #1.`
      : '';

    return {
      role: 'customer',
      persona: 'FlashDrop Concierge',
      message: `${holdStatus}${queueStatus}\n\nOur Redis Lua engine ensures that once you acquire a hold, your item is 100% reserved for 5 minutes with zero chance of overselling!`,
      sql: `-- Redis In-Memory Inspection\n-- GET hold:1:${userId} (TTL: ${ttl1}s)\n-- ZRANK drop:1:queue ${userId} (Rank: ${queueRank !== null ? queueRank + 1 : 'None'})`,
      rows: [
        { drop_id: 1, hold_active: ttl1 > 0 ? 'YES' : 'NO', ttl_seconds: ttl1 > 0 ? ttl1 : 0, queue_position: queueRank !== null ? queueRank + 1 : 'Not in Queue' }
      ],
      columns: ['drop_id', 'hold_active', 'ttl_seconds', 'queue_position'],
      suggestedQuestions: [
        'How does checkout work?',
        'What is my wallet balance?',
        'What orders have I placed?',
      ],
    };
  }

  // E. Referrals & Network Lineage
  if (p.includes('referral') || p.includes('invite') || p.includes('friend') || p.includes('network') || p.includes('viral')) {
    const [referrals]: any = await adminPool.query(
      `SELECT r.referral_id, u.email AS invited_friend, r.status, r.reward_points, r.created_at 
       FROM referrals r 
       JOIN users u ON r.referee_id = u.user_id 
       WHERE r.referrer_id = ? 
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const points = referrals.reduce((sum: number, r: any) => sum + (Number(r.reward_points) || 0), 0);

    return {
      role: 'customer',
      persona: 'FlashDrop Concierge',
      message: `You have referred **${referrals.length}** friend(s) to FlashDrop, earning **${points} reward points**! Higher referral points boost your lottery draw probability and waiting room priority during hype drops.`,
      sql: `-- Customer Referral Query\nSELECT r.referral_id, u.email, r.status, r.reward_points, r.created_at\nFROM referrals r\nJOIN users u ON r.referee_id = u.user_id\nWHERE r.referrer_id = ${userId};`,
      rows: referrals,
      columns: ['referral_id', 'invited_friend', 'status', 'reward_points', 'created_at'],
      suggestedQuestions: [
        'What is my wallet balance?',
        'Which drops are live right now?',
        'What orders have I placed?',
      ],
    };
  }

  // F. Active Catalog / Drops
  const [drops]: any = await adminPool.query(
    `SELECT d.drop_id, d.title, d.status, d.drop_price, inv.available_quantity, inv.sold_quantity 
     FROM drops d 
     JOIN inventory inv ON d.drop_id = inv.drop_id 
     WHERE d.status IN ('live', 'scheduled') 
     ORDER BY d.start_time ASC 
     LIMIT 5`
  );

  return {
    role: 'customer',
    persona: 'FlashDrop Concierge',
    message: `Here is the current live drop catalog on FlashDrop! Click on any drop to enter the waiting room and claim an exclusive 5-minute atomic checkout hold.`,
    sql: `SELECT d.drop_id, d.title, d.status, d.drop_price, inv.available_quantity, inv.sold_quantity\nFROM drops d\nJOIN inventory inv ON d.drop_id = inv.drop_id\nWHERE d.status IN ('live', 'scheduled')\nORDER BY d.start_time ASC LIMIT 5;`,
    rows: drops,
    columns: ['drop_id', 'title', 'status', 'drop_price', 'available_quantity', 'sold_quantity'],
    suggestedQuestions: [
      'What is my wallet balance?',
      'What orders have I placed?',
      'Am I in any waiting room queue or hold?',
    ],
  };
}

// ---------------------------------------------------------------------
// 4. Admin-Oriented Intent Resolver (Full Enterprise Analytical Scope)
// ---------------------------------------------------------------------
async function handleAdminChat(prompt: string, user: UserSession) {
  const p = prompt.toLowerCase().trim();

  // Extract custom limit if specified
  const limitMatch = p.match(/\b(?:top|limit|first)\s+(\d+)\b/);
  const limit = limitMatch ? parseInt(limitMatch[1], 10) : 5;

  const thresholdMatch = p.match(/(?:>|greater than|above|over|more than)\s*\$?(\d+(?:\.\d+)?)/);
  const threshold = thresholdMatch ? parseFloat(thresholdMatch[1]) : 0;

  let sql = '';
  let intent = '';
  let explanation = '';

  // 1. Top Buyers / Spenders
  if (p.includes('buyer') || p.includes('customer') || p.includes('spender') || p.includes('spent') || p.includes('spending')) {
    intent = 'Top Customer Lifetime Spend (VIP Aggregation)';
    sql = `SELECT 
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    u.email,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(o.final_amount), 0) AS lifetime_spent,
    ROUND(AVG(o.final_amount), 2) AS avg_order_value,
    MAX(o.created_at) AS latest_order
FROM users u
INNER JOIN orders o ON u.user_id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.user_id, u.first_name, u.last_name, u.email
ORDER BY lifetime_spent DESC
LIMIT ${limit};`;
    explanation = `Aggregates customer GMV using SUM(final_amount) over paid orders joined to users.`;
  }
  // 2. Drop Sellout Velocity & Inventory Conservation
  else if (p.includes('sellout') || p.includes('fastest') || p.includes('velocity') || p.includes('speed') || p.includes('duration')) {
    intent = 'Fastest Sellout Drop & Velocity Telemetry';
    sql = `SELECT 
    d.drop_id,
    d.title AS drop_title,
    d.status,
    inv.total_allocated,
    inv.sold_quantity,
    inv.available_quantity,
    ROUND((inv.sold_quantity / inv.total_allocated) * 100, 1) AS sellout_pct,
    TIMESTAMPDIFF(SECOND, d.start_time, d.end_time) AS duration_seconds
FROM drops d
INNER JOIN inventory inv ON d.drop_id = inv.drop_id
ORDER BY sellout_pct DESC, duration_seconds ASC
LIMIT ${limit};`;
    explanation = `Calculates percentage sellout and elapsed execution seconds between start_time and end_time.`;
  }
  // 3. Inventory Conservation Math Check
  else if (p.includes('conservation') || p.includes('conserve') || p.includes('leak') || p.includes('oversell') || p.includes('drift')) {
    intent = 'Strict Mathematical Inventory Conservation Check';
    sql = `SELECT 
    d.drop_id,
    d.title AS drop_title,
    inv.total_allocated,
    inv.available_quantity,
    inv.reserved_holds,
    inv.sold_quantity,
    (inv.available_quantity + inv.reserved_holds + inv.sold_quantity) AS calculated_sum,
    CASE 
        WHEN (inv.available_quantity + inv.reserved_holds + inv.sold_quantity) = inv.total_allocated THEN '✅ CONSERVED'
        ELSE '❌ LEAK / DRIFT'
    END AS conservation_status
FROM drops d
INNER JOIN inventory inv ON d.drop_id = inv.drop_id;`;
    explanation = `Verifies the core mathematical invariant: available + holds + sold = total_allocated across all drops.`;
  }
  // 4. Fraud & Bot Telemetry
  else if (p.includes('fraud') || p.includes('bot') || p.includes('risk') || p.includes('suspend') || p.includes('attack') || p.includes('flag')) {
    intent = 'Heuristic Bot Detection & Automated Suspensions';
    sql = `SELECT 
    f.flag_id,
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
    u.email,
    u.status AS account_status,
    f.risk_score,
    f.flag_reason,
    f.flagged_at
FROM fraud_flags f
INNER JOIN users u ON f.user_id = u.user_id
ORDER BY f.risk_score DESC, f.flagged_at DESC
LIMIT ${limit};`;
    explanation = `Queries security incident records flagged by MySQL triggers and risk scoring heuristics.`;
  }
  // 5. Total Platform GMV & Revenue
  else if (p.includes('revenue') || p.includes('gmv') || p.includes('total sales') || p.includes('earnings') || p.includes('financial')) {
    intent = 'Platform Total Gross Merchandise Value (GMV) & Orders';
    sql = `SELECT 
    COUNT(o.order_id) AS total_orders_placed,
    COUNT(CASE WHEN o.status = 'paid' THEN 1 END) AS confirmed_paid_orders,
    COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.final_amount ELSE 0 END), 0) AS total_paid_gmv,
    COALESCE(SUM(o.discount_amount), 0) AS total_discounts_granted,
    ROUND(AVG(CASE WHEN o.status = 'paid' THEN o.final_amount END), 2) AS average_order_value
FROM orders o;`;
    explanation = `Computes platform-wide financial metrics across all orders and discount vouchers.`;
  }
  // 6. Wallets with Balance Threshold
  else if (p.includes('wallet') || p.includes('balance')) {
    intent = 'Executive Wallet Balance Audit';
    sql = `SELECT 
    w.wallet_id,
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
    u.email,
    w.balance,
    w.currency,
    w.is_locked,
    (SELECT COUNT(*) FROM wallet_ledger wl WHERE wl.wallet_id = w.wallet_id) AS total_ledger_entries
FROM wallets w
INNER JOIN users u ON w.user_id = u.user_id
${threshold > 0 ? `WHERE w.balance >= ${threshold}` : ''}
ORDER BY w.balance DESC
LIMIT ${limit};`;
    explanation = `Audits prepaid user wallet liabilities and corresponding double-entry ledger counts.`;
  }
  // 7. Recursive Category Hierarchy (CTE)
  else if (p.includes('category') || p.includes('hierarchy') || p.includes('breadcrumb') || p.includes('tree')) {
    intent = 'Recursive Common Table Expression: Category Breadcrumbs';
    sql = `WITH RECURSIVE category_path AS (
    SELECT category_id, parent_id, name, CAST(name AS CHAR(255)) AS breadcrumb_path, 1 AS depth
    FROM categories 
    WHERE parent_id IS NULL
    UNION ALL
    SELECT c.category_id, c.parent_id, c.name, CONCAT(cp.breadcrumb_path, ' > ', c.name), cp.depth + 1
    FROM categories c 
    INNER JOIN category_path cp ON c.parent_id = cp.category_id
)
SELECT category_id, breadcrumb_path, depth,
       (SELECT COUNT(*) FROM products p WHERE p.category_id = category_path.category_id) AS total_products
FROM category_path 
ORDER BY depth, breadcrumb_path;`;
    explanation = `Traverses hierarchical category nodes using MySQL 8.0 Recursive CTE to construct full lineage breadcrumbs.`;
  }
  // Default: Catalog Overview with Inventory State
  else {
    intent = 'Live Multi-Table Catalog & Inventory Telemetry';
    sql = `SELECT 
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
ORDER BY p.product_id ASC
LIMIT ${limit};`;
    explanation = `Multi-table relational overview joining products, categories, drops, and live inventory.`;
  }

  // Validate Read-Only Safety Shield
  const validation = validateReadOnlySql(sql);
  if (!validation.valid) {
    return {
      role: 'admin',
      persona: 'FlashDrop Executive Intelligence',
      message: `Safety Shield Violation: ${validation.reason}`,
      sql,
      rows: [],
      columns: [],
      durationMs: 0,
      suggestedQuestions: [
        'Who are our top 3 buyers by total spending?',
        'Which drop sold out the fastest?',
        'Show high-risk bot attack IPs',
      ],
    };
  }

  const startTime = performance.now();
  const [rows, fields]: any = await adminPool.query(sql);
  const durationMs = Number((performance.now() - startTime).toFixed(1));
  const columns = Array.isArray(fields) ? fields.map((f: any) => f.name) : [];

  return {
    role: 'admin',
    persona: 'FlashDrop Executive Intelligence',
    intent,
    message: `Executive SQL query executed successfully against MySQL 8.0 in **${durationMs} ms** (${rows.length} rows returned).`,
    sql,
    explanation,
    rows: Array.isArray(rows) ? rows : [],
    columns,
    durationMs,
    suggestedQuestions: [
      'Who are our top 3 buyers by total spending?',
      'Which drop sold out the fastest?',
      'Check inventory conservation across all drops',
      'Show high-risk bot attack IPs and suspensions',
      'Show total platform revenue and paid orders',
    ],
  };
}

// ---------------------------------------------------------------------
// 5. POST Handler: Routes based on RBAC Session Role
// ---------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const user = await getSessionFromRequest(request);
    const body = await request.json();
    const prompt = (body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Query prompt cannot be empty.' }, { status: 400 });
    }

    let responseData;
    if (user.role === 'admin') {
      responseData = await handleAdminChat(prompt, user);
    } else {
      responseData = await handleCustomerChat(prompt, user);
    }

    return NextResponse.json({
      success: true,
      currentUser: {
        userId: user.userId,
        role: user.role,
        name: user.name,
      },
      ...responseData,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: `AI Query Execution Error: ${err.message}`,
    }, { status: 500 });
  }
}
