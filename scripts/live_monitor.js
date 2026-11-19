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
    if (recentEvents.length > 6) recentEvents.pop();
  }

  logEvent(`${C.green}● SYSTEM${C.reset}`, 'Live monitor attached to MySQL 8.0 & Redis 7.2');

  const renderLoop = async () => {
    try {
      // 1. Fetch Redis In-Memory Metrics
      const stockVal = await redis.get('drop:1:stock');
      const currentStock = stockVal !== null ? Number(stockVal) : 'N/A';
      const holdKeys = await redis.keys('hold:1:*');
      const holdsList = [];
      for (const hk of holdKeys.slice(0, 5)) {
        const ttl = await redis.ttl(hk);
        const holder = await redis.get(hk);
        holdsList.push({ key: hk, ttl, holder });
      }
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
          `${C.cyan}⚡ REDIS LUA${C.reset}`,
          `Inventory Counter modified: ${prevStock} -> ${currentStock} units`
        );
      }
      if (prevOrdersCount !== null && ordersCount > prevOrdersCount) {
        const diff = ordersCount - prevOrdersCount;
        logEvent(
          `${C.green}🛍️ MYSQL ACID${C.reset}`,
          `+${diff} New Order(s) created! Latest: #${topOrder.order_id} (${topOrder.order_number}) for $${topOrder.final_amount}`
        );
      }
      if (prevLedgerId !== null && topLedger.ledger_id > prevLedgerId) {
        logEvent(
          `${C.yellow}💰 WALLET LEDGER${C.reset}`,
          `Entry #${topLedger.ledger_id} [${topLedger.entry_type}]: $${topLedger.amount} | New Balance: $${topLedger.balance_after}`
        );
      }
      if (prevFraudCount !== null && fraudCount > prevFraudCount) {
        logEvent(
          `${C.red}🚨 FRAUD TRIGGER${C.reset}`,
          `trg_auto_suspend_fraud_user fired! Risk flagged; user auto-suspended.`
        );
      }

      prevStock = currentStock;
      prevOrdersCount = ordersCount;
      prevLedgerId = topLedger.ledger_id;
      prevFraudCount = fraudCount;

      // 4. Render Clean Dashboard
      console.clear();
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      console.log(`${C.bold}${C.red}╔═══════════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
      console.log(`${C.bold}${C.red}║    ⚡ FLASHDROP DUAL-ENGINE REAL-TIME MISSION CONTROL MONITOR (PES CSE)           ║${C.reset}`);
      console.log(`${C.bold}${C.red}╚═══════════════════════════════════════════════════════════════════════════════════╝${C.reset}`);
      console.log(` ${C.dim}Timestamp:${C.reset} ${now}  │  ${C.green}● MySQL 8.0: 127.0.0.1:3306${C.reset}  │  ${C.cyan}● Redis 7.2: 127.0.0.1:6379${C.reset}\n`);

      // ─── REDIS IN-MEMORY RADAR ───
      console.log(`${C.bold}${C.cyan}▶ [REDIS 7.2 IN-MEMORY CACHE & CONCURRENCY GUARD]${C.reset}`);
      console.log(`  ├─ ${C.bold}Live Stock Key (drop:1:stock):${C.reset}   ${C.green}${currentStock}${C.reset} units remaining`);
      console.log(`  ├─ ${C.bold}Active 5-Min Holds (hold:1:*):${C.reset}    ${holdKeys.length} hold(s) active`);
      if (holdsList.length > 0) {
        for (const h of holdsList) {
          console.log(`  │   └─ ${C.yellow}${h.key}${C.reset} (User: ${h.holder}) -> ${C.cyan}${h.ttl}s remaining${C.reset}`);
        }
      } else {
        console.log(`  │   └─ ${C.dim}No holds pending (ready for burst checkout)${C.reset}`);
      }
      console.log(`  ├─ ${C.bold}Waiting Room Queue (ZSET):${C.reset}        ${queueDepth} buyers waiting in line`);
      console.log(`  ├─ ${C.bold}Fair Lottery Ballot Pool (SET):${C.reset}   ${lotteryEntries} registered tickets`);
      console.log(`  └─ ${C.bold}Active User Sessions (HASH):${C.reset}      ${sessionKeys.length} signed-in token(s)`);

      console.log('');

      // ─── MYSQL RELATIONAL CORE ───
      const conserved = (inv.available_quantity + inv.reserved_holds + inv.sold_quantity) === inv.total_allocated;
      const conservationBadge = conserved
        ? `${C.green}✅ [100% CONSERVED]${C.reset}`
        : `${C.red}❌ [VIOLATION]${C.reset}`;

      console.log(`${C.bold}${C.red}▶ [MYSQL 8.0 ACID RELATIONAL DURABILITY CORE]${C.reset}`);
      console.log(`  ├─ ${C.bold}Drop 1 Inventory Row:${C.reset}             Avail: ${C.green}${inv.available_quantity}${C.reset} │ Sold: ${C.white}${inv.sold_quantity}${C.reset} │ Holds: ${C.yellow}${inv.reserved_holds}${C.reset} │ Total: ${inv.total_allocated}`);
      console.log(`  ├─ ${C.bold}Conservation Check Constraint:${C.reset}    ${inv.available_quantity} + ${inv.reserved_holds} + ${inv.sold_quantity} = ${inv.total_allocated} ${conservationBadge}`);
      console.log(`  ├─ ${C.bold}Total Orders in Database:${C.reset}         ${C.bold}${ordersCount}${C.reset} orders  │  ${C.bold}Gross Revenue (GMV):${C.reset} ${C.green}$${gmv}${C.reset}`);
      console.log(`  ├─ ${C.bold}Latest Order Record:${C.reset}              #${topOrder.order_id || 'N/A'} (${topOrder.order_number || 'N/A'}) - $${topOrder.final_amount || '0'} [${topOrder.status || 'N/A'}]`);
      console.log(`  ├─ ${C.bold}Latest Double-Entry Ledger:${C.reset}       #${topLedger.ledger_id || 'N/A'} [${topLedger.entry_type || 'N/A'}]: $${topLedger.amount || '0'} │ Balance After: $${topLedger.balance_after || '0'}`);
      console.log(`  └─ ${C.bold}Fraud Engine & Triggers:${C.reset}          ${fraudCount} flags evaluated  │  ${C.red}${suspendedCount} users auto-suspended${C.reset}`);

      console.log('');

      // ─── LIVE EVENT STREAM ───
      console.log(`${C.bold}${C.yellow}▶ [REAL-TIME EVENT STREAM & AUDIT FEED] (Updates live as you interact with Web UI):${C.reset}`);
      if (recentEvents.length === 0) {
        console.log(`  ${C.dim}Listening for checkout, holds, bot attacks, and chaos load events...${C.reset}`);
      } else {
        for (const ev of recentEvents) {
          console.log(`  ${ev}`);
        }
      }

      console.log(`\n${C.dim}───────────────────────────────────────────────────────────────────────────────────${C.reset}`);
      console.log(` ${C.dim}Keep this window side-by-side with Chrome (http://localhost:3000) during Viva! [Ctrl+C to exit]${C.reset}`);
    } catch (err) {
      console.error('Monitoring query error:', err.message);
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
