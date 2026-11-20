#!/usr/bin/env node
// =====================================================================
// FLASHDROP: scripts/live_monitor.js
// Dual-Engine Mission Control Live Monitor (MySQL 8.0 + Redis 7.2)
// For Side-by-Side Examiner Evaluation & Real-Time Database Telemetry
// =====================================================================

const path = require('path');

function getModule(name) {
  try {
    return require(name);
  } catch (e) {
    return require(path.resolve(__dirname, '../app/node_modules', name));
  }
}

const mysql = getModule('mysql2/promise');
const Redis = getModule('ioredis');

// ANSI Color Codes
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgDark: '\x1b[40m',
};

async function startLiveMonitor() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
    password: process.env.DB_ADMIN_PASSWORD || 'admin_secure_pass_123',
    database: process.env.DB_NAME || 'flashdrop',
  });

  const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: 1,
  });

  // State cache for detecting real-time deltas / events
  let prevOrdersCount = null;
  let prevStock = null;
  let prevFraudCount = null;
  let prevLedgerId = null;
  const recentEvents = [];

  function logEvent(badge, text) {
    const time = new Date().toLocaleTimeString();
    recentEvents.unshift(`${C.dim}[${time}]${C.reset} ${badge} ${text}`);
    if (recentEvents.length > 4) recentEvents.pop();
  }

  logEvent(`${C.green}● INIT${C.reset}`, 'Monitor connected to MySQL 8 & Redis 7');

  // Clear entire terminal and scrollback once at start
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');

  const renderLoop = async () => {
    try {
      // 1. Fetch Redis In-Memory Metrics
      const stockVal = await redis.get('drop:1:stock');
      const currentStock = stockVal !== null ? Number(stockVal) : 'N/A';
      const holdKeys = await redis.keys('hold:1:*');
      const queueDepth = await redis.zcard('drop:1:queue').catch(() => 0);
      const lotteryEntries = await redis.scard('drop:1:lottery').catch(() => 0);
      const sessionKeys = await redis.keys('session:*');

      // 2. Fetch MySQL Relational Metrics
      const [invRows] = await db.query(
        'SELECT drop_id, total_allocated, available_quantity, reserved_holds, sold_quantity, version FROM inventory WHERE drop_id = 1'
      );
      const inv = invRows[0] || {};

      const [orderStats] = await db.query(
        'SELECT COUNT(*) AS total_orders, COALESCE(SUM(final_amount), 0) AS total_gmv FROM orders'
      );
      const ordersCount = orderStats[0].total_orders;
      const gmv = Number(orderStats[0].total_gmv).toFixed(2);

      const [latestOrder] = await db.query(
        'SELECT order_id, order_number, user_id, final_amount, status, created_at FROM orders ORDER BY order_id DESC LIMIT 1'
      );
      const topOrder = latestOrder[0] || {};

      const [latestLedger] = await db.query(
        'SELECT ledger_id, wallet_id, entry_type, amount, balance_after, created_at FROM wallet_ledger ORDER BY ledger_id DESC LIMIT 1'
      );
      const topLedger = latestLedger[0] || {};

      const [fraudRows] = await db.query(
        'SELECT COUNT(*) as total_flags, SUM(CASE WHEN risk_score >= 85 THEN 1 ELSE 0 END) as suspended_count FROM fraud_flags'
      );
      const fraudCount = fraudRows[0].total_flags;
      const suspendedCount = fraudRows[0].suspended_count || 0;

      // 3. Detect Real-Time State Changes & Push Events
      if (prevStock !== null && currentStock !== prevStock) {
        logEvent(
          `${C.cyan}⚡ LUA${C.reset}`,
          `Redis Stock: ${prevStock} -> ${currentStock} units`
        );
      }
      if (prevOrdersCount !== null && ordersCount > prevOrdersCount) {
        const diff = ordersCount - prevOrdersCount;
        logEvent(
          `${C.green}🛍️ ACID${C.reset}`,
          `+${diff} Order created: #${topOrder.order_id} ($${topOrder.final_amount})`
        );
      }
      if (prevLedgerId !== null && topLedger.ledger_id > prevLedgerId) {
        logEvent(
          `${C.yellow}💰 LEDGER${C.reset}`,
          `#${topLedger.ledger_id} [${topLedger.entry_type}]: $${topLedger.amount} (Bal: $${topLedger.balance_after})`
        );
      }
      if (prevFraudCount !== null && fraudCount > prevFraudCount) {
        logEvent(
          `${C.red}🚨 FRAUD${C.reset}`,
          `trg_auto_suspend fired! High-risk user suspended.`
        );
      }

      prevStock = currentStock;
      prevOrdersCount = ordersCount;
      prevLedgerId = topLedger.ledger_id;
      prevFraudCount = fraudCount;

      // 4. Compact, Zero-Scroll In-Place Terminal Rendering (max 68 cols, max 14 rows)
      const now = new Date().toLocaleTimeString();
      const conserved = (inv.available_quantity + inv.reserved_holds + inv.sold_quantity) === inv.total_allocated;
      const conservationBadge = conserved
        ? `${C.green}100% CONSERVED${C.reset}`
        : `${C.red}VIOLATION${C.reset}`;

      const lines = [
        `${C.bold}${C.red}═══ ⚡ FLASHDROP DUAL-ENGINE MISSION CONTROL (PES CSE) ═══════════════${C.reset}`,
        ` ${C.dim}Time:${C.reset} ${now}  │  ${C.green}● MySQL: 3306${C.reset}  │  ${C.cyan}● Redis: 6379${C.reset}`,
        ``,
        `${C.bold}${C.cyan}▶ [REDIS 7.2 IN-MEMORY CONCURRENCY LAYER]${C.reset}`,
        `  Stock: ${C.green}${currentStock} units${C.reset}  │  Holds: ${C.yellow}${holdKeys.length} active${C.reset}  │  Queue: ${queueDepth}  │  Lottery: ${lotteryEntries}`,
        ``,
        `${C.bold}${C.red}▶ [MYSQL 8.0 ACID RELATIONAL DURABILITY CORE]${C.reset}`,
        `  Drop 1 Stock: Avail ${C.green}${inv.available_quantity || 0}${C.reset} │ Sold ${inv.sold_quantity || 0} │ Holds ${inv.reserved_holds || 0} │ Total ${inv.total_allocated || 0} [${conservationBadge}]`,
        `  Orders: ${C.bold}${ordersCount}${C.reset} ($${gmv} GMV)  │  Latest: #${topOrder.order_id || '0'} ($${topOrder.final_amount || '0'}) [${topOrder.status || 'none'}]`,
        `  Ledger: #${topLedger.ledger_id || '0'} ($${topLedger.amount || '0'}, Bal: $${topLedger.balance_after || '0'})  │  Fraud Flags: ${fraudCount} (${suspendedCount} suspended)`,
        ``,
        `${C.bold}${C.yellow}▶ [REAL-TIME EVENT & AUDIT STREAM]${C.reset}`,
      ];

      if (recentEvents.length === 0) {
        lines.push(`  ${C.dim}Listening for checkout, holds, and database mutations...${C.reset}`);
      } else {
        for (const ev of recentEvents.slice(0, 3)) {
          lines.push(`  ${ev}`);
        }
      }

      lines.push(`${C.dim}────────────────────────────────────────────────────────────────────${C.reset}`);
      lines.push(` ${C.dim}Keep side-by-side with Chrome (http://localhost:3000) [Ctrl+C to exit]${C.reset}`);

      // Overwrite in-place starting at top-left (0,0) with line-clearing (\x1b[K)
      // This guarantees zero flickering and zero runaway scrolling!
      const output = '\x1b[H' + lines.map(l => l + '\x1b[K').join('\n') + '\x1b[J';
      process.stdout.write(output);

    } catch (err) {
      process.stdout.write(`\x1b[H\x1b[KMonitoring query error: ${err.message}\x1b[J\n`);
    }
  };

  // Run initial render and poll every 1000ms
  await renderLoop();
  const interval = setInterval(renderLoop, 1000);

  process.on('SIGINT', async () => {
    clearInterval(interval);
    console.log('\nExiting monitor...');
    await db.end();
    redis.disconnect();
    process.exit(0);
  });
}

startLiveMonitor().catch((err) => {
  console.error('Failed to start Live Monitor:', err);
  process.exit(1);
});
