#!/usr/bin/env node
// =====================================================================
// FLASHDROP: scripts/backend_functions_menu.js
// Interactive Command-Line Menu for Examiner Evaluation (PES CSE)
// Component 8: Advanced Database Concepts (Procedures, Functions, Triggers)
// =====================================================================

const path = require('path');
const readline = require('readline');

function getModule(name) {
  try {
    return require(name);
  } catch (e) {
    return require(path.resolve(__dirname, '../app/node_modules', name));
  }
}

const mysql = getModule('mysql2/promise');
const Redis = getModule('ioredis');

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

async function createDb() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
    password: process.env.DB_ADMIN_PASSWORD || 'admin_secure_pass_123',
    database: process.env.DB_NAME || 'flashdrop',
    multipleStatements: true,
  });
}

const ITEMS = [
  {
    id: 1,
    category: 'STORED PROCEDURE',
    name: 'sp_place_order',
    rubric: 'Component 8 (6 Marks) & Component 14 (Viva Defense)',
    description: 'Atomic checkout engine with pessimistic FOR UPDATE locking, stock decrement, loyalty discount calculation, and automatic SQLEXCEPTION rollback handler.',
    sql: `CREATE PROCEDURE sp_place_order(
    IN  p_user_id        BIGINT UNSIGNED,
    IN  p_drop_id        BIGINT UNSIGNED,
    IN  p_payment_method VARCHAR(16),
    OUT p_order_id       BIGINT UNSIGNED,
    OUT p_status_code    VARCHAR(32),
    OUT p_status_message VARCHAR(255)
) ...`,
    execute: async (db) => {
      console.log(`${C.yellow}Executing: CALL sp_place_order(2, 1, 'wallet', @order_id, @status_code, @status_msg);${C.reset}\n`);
      const [res] = await db.query(`
        SET @order_id = NULL;
        SET @status_code = NULL;
        SET @status_msg = NULL;
        CALL sp_place_order(2, 1, 'wallet', @order_id, @status_code, @status_msg);
        SELECT @order_id AS created_order_id, @status_code AS result_code, @status_msg AS result_message;
      `);
      const output = res[res.length - 1];
      console.table(output);
    },
  },
  {
    id: 2,
    category: 'STORED PROCEDURE',
    name: 'sp_deposit_wallet',
    rubric: 'Component 8 (6 Marks) - Double-Entry Ledger Procedure',
    description: 'Credits a customer wallet and atomically appends an immutable double-entry CREDIT ledger record.',
    sql: `CREATE PROCEDURE sp_deposit_wallet(
    IN  p_user_id  BIGINT UNSIGNED,
    IN  p_amount   DECIMAL(12,2),
    IN  p_ref_id   VARCHAR(64)
) ...`,
    execute: async (db) => {
      console.log(`${C.yellow}Executing: CALL sp_deposit_wallet(4, 50.00, 'DEMO-VIVA-DEP');${C.reset}\n`);
      await db.query(`CALL sp_deposit_wallet(4, 50.00, 'DEMO-VIVA-DEP');`);
      const [res] = await db.query(`SELECT wallet_id, user_id, balance, updated_at FROM wallets WHERE user_id = 4;`);
      console.table(res);
    },
  },
  {
    id: 3,
    category: 'STORED PROCEDURE',
    name: 'sp_reconcile_drop_inventory',
    rubric: 'Component 8 (6 Marks) - Stock Conservation Invariant',
    description: 'Audits physical orders against inventory counts to detect discrepancies (available + sold = total).',
    sql: `CREATE PROCEDURE sp_reconcile_drop_inventory(IN p_drop_id BIGINT UNSIGNED)
BEGIN
    SELECT 
        d.drop_id, d.title, inv.total_allocated,
        inv.sold_quantity AS reported_sold_in_inventory,
        COUNT(o.order_id) AS actual_confirmed_orders,
        (inv.sold_quantity - COUNT(o.order_id)) AS discrepancy_variance,
        CASE 
            WHEN inv.sold_quantity = COUNT(o.order_id) THEN 'RECONCILED_PERFECT'
            ELSE 'DISCREPANCY_DETECTED'
        END AS audit_status
    FROM drops d
    INNER JOIN inventory inv ON d.drop_id = inv.drop_id
    LEFT JOIN orders o ON d.drop_id = o.drop_id AND o.status = 'paid'
    WHERE d.drop_id = p_drop_id
    GROUP BY d.drop_id, d.title, inv.total_allocated, inv.sold_quantity;
END;`,
    execute: async (db) => {
      console.log(`${C.yellow}Executing: CALL sp_reconcile_drop_inventory(1);${C.reset}\n`);
      const [res] = await db.query(`CALL sp_reconcile_drop_inventory(1);`);
      const output = res[0];
      console.table(output);
    },
  },
  {
    id: 4,
    category: 'DETERMINISTIC FUNCTION',
    name: 'fn_calculate_loyalty_discount',
    rubric: 'Component 8 (6 Marks) - User Loyalty Tier Discount',
    description: 'Inspects user_tiers joined with loyalty_tiers and returns the active discount percentage (e.g. Platinum = 15%).',
    sql: `CREATE FUNCTION fn_calculate_loyalty_discount(p_user_id BIGINT UNSIGNED)
RETURNS DECIMAL(5,2) DETERMINISTIC READS SQL DATA ...`,
    execute: async (db) => {
      console.log(`${C.yellow}Executing: SELECT u.user_id, u.first_name, fn_calculate_loyalty_discount(u.user_id) AS discount_pct FROM users u WHERE u.user_id BETWEEN 2 AND 5;${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT u.user_id, u.first_name, fn_calculate_loyalty_discount(u.user_id) AS discount_percentage
        FROM users u WHERE u.user_id BETWEEN 2 AND 5;
      `);
      console.table(rows);
    },
  },
  {
    id: 5,
    category: 'DETERMINISTIC FUNCTION',
    name: 'fn_is_user_suspended',
    rubric: 'Component 8 & 12 (Security & Bot Defense Guard)',
    description: 'Returns BOOLEAN indicating whether an account is suspended due to anti-fraud triggers.',
    sql: `CREATE FUNCTION fn_is_user_suspended(p_user_id BIGINT UNSIGNED)
RETURNS BOOLEAN DETERMINISTIC READS SQL DATA ...`,
    execute: async (db) => {
      console.log(`${C.yellow}Executing: SELECT user_id, email, status, fn_is_user_suspended(user_id) AS is_suspended FROM users LIMIT 5;${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT user_id, email, status, fn_is_user_suspended(user_id) AS is_suspended
        FROM users LIMIT 5;
      `);
      console.table(rows);
    },
  },
  {
    id: 6,
    category: 'DETERMINISTIC FUNCTION',
    name: 'fn_get_category_breadcrumb',
    rubric: 'Component 8 (6 Marks) - Hierarchical Lineage Loop',
    description: 'Traverses parent_id pointers in categories and returns a single concatenated breadcrumb string.',
    sql: `CREATE FUNCTION fn_get_category_breadcrumb(p_category_id INT UNSIGNED)
RETURNS VARCHAR(1000) DETERMINISTIC READS SQL DATA ...`,
    execute: async (db) => {
      console.log(`${C.yellow}Executing: SELECT category_id, name, fn_get_category_breadcrumb(category_id) AS full_path FROM categories;${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT category_id, name, fn_get_category_breadcrumb(category_id) AS full_hierarchy_path
        FROM categories;
      `);
      console.table(rows);
    },
  },
  {
    id: 7,
    category: 'DATABASE TRIGGER',
    name: 'trg_prevent_negative_inventory',
    rubric: 'Component 8 (6 Marks) - Physical Negative Stock Invariant',
    description: 'BEFORE UPDATE on inventory. Signals SQLSTATE 45000 if available_quantity < 0 to prevent overselling.',
    sql: `CREATE TRIGGER trg_prevent_negative_inventory
BEFORE UPDATE ON inventory FOR EACH ROW
BEGIN
    IF NEW.available_quantity < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CRITICAL ENGINE OVERSELL REJECTION';
    END IF;
END;`,
    execute: async (db) => {
      console.log(`${C.yellow}Trigger inspection from INFORMATION_SCHEMA.TRIGGERS:${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
        FROM INFORMATION_SCHEMA.TRIGGERS
        WHERE TRIGGER_SCHEMA = 'flashdrop' AND TRIGGER_NAME = 'trg_prevent_negative_inventory';
      `);
      console.table(rows);
      console.log(`${C.green}Invariant Active: Any UPDATE attempting available_quantity = -1 will be rejected with Error 45000!${C.reset}`);
    },
  },
  {
    id: 8,
    category: 'DATABASE TRIGGER',
    name: 'trg_auto_suspend_fraud',
    rubric: 'Component 8 & 12 - Heuristic Bot Auto-Suspension',
    description: 'AFTER INSERT on fraud_flags. If risk_score >= 85, auto-suspends user and logs to audit_log.',
    sql: `CREATE TRIGGER trg_auto_suspend_fraud
AFTER INSERT ON fraud_flags FOR EACH ROW ...`,
    execute: async (db) => {
      console.log(`${C.yellow}Trigger inspection from INFORMATION_SCHEMA.TRIGGERS:${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
        FROM INFORMATION_SCHEMA.TRIGGERS
        WHERE TRIGGER_SCHEMA = 'flashdrop' AND TRIGGER_NAME = 'trg_auto_suspend_fraud';
      `);
      console.table(rows);
    },
  },
  {
    id: 9,
    category: 'DATABASE TRIGGER',
    name: 'trg_audit_orders',
    rubric: 'Component 8 - Immutable JSON State Audit Snapshot',
    description: 'AFTER UPDATE on orders. Writes JSON before/after status diffs to audit_log.',
    sql: `CREATE TRIGGER trg_audit_orders
AFTER UPDATE ON orders FOR EACH ROW ...`,
    execute: async (db) => {
      console.log(`${C.yellow}Latest audit log entries created by trg_audit_orders:${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT log_id, table_name, action, record_id, new_values_json, created_at
        FROM audit_log ORDER BY log_id DESC LIMIT 4;
      `);
      console.table(rows);
    },
  },
  {
    id: 10,
    category: 'DATABASE VIEW',
    name: 'vw_customer_order_history',
    rubric: 'Component 12 (RBAC Least Privilege View)',
    description: 'Encapsulates orders, drops, products, order_items, and payments so customers cannot query raw tables.',
    sql: `CREATE VIEW vw_customer_order_history AS
SELECT o.order_id, o.order_number, o.user_id, d.title AS drop_title ...`,
    execute: async (db) => {
      console.log(`${C.yellow}Querying: SELECT * FROM vw_customer_order_history LIMIT 3;${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT order_id, order_number, user_id, drop_title, final_amount, order_status, created_at
        FROM vw_customer_order_history LIMIT 3;
      `);
      console.table(rows);
    },
  },
  {
    id: 11,
    category: 'DATABASE VIEW',
    name: 'vw_live_drop_catalog',
    rubric: 'Component 7 & 11 - Storefront Catalog Aggregation View',
    description: 'Multi-table view joining drops, products, categories, and inventory availability.',
    sql: `CREATE VIEW vw_live_drop_catalog AS
SELECT d.drop_id, d.title, d.status, p.title AS product_name, inv.available_quantity ...`,
    execute: async (db) => {
      console.log(`${C.yellow}Querying: SELECT * FROM vw_live_drop_catalog;${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT drop_id, title, status, drop_price, available_quantity, sold_quantity
        FROM vw_live_drop_catalog;
      `);
      console.table(rows);
    },
  },
  {
    id: 12,
    category: 'REDIS LUA SCRIPT',
    name: 'acquire_hold.lua',
    rubric: 'Component 4 & 9 (NoSQL In-Memory Atomic Concurrency)',
    description: 'Atomic in-memory check-and-hold script with 5-minute TTL. Eliminates race conditions with zero oversell.',
    sql: `-- Redis Lua Script: redis/lua/acquire_hold.lua
local stock = redis.call('GET', KEYS[1])
if tonumber(stock) > 0 then
    redis.call('DECR', KEYS[1])
    redis.call('SET', KEYS[2], ARGV[1], 'EX', 300)
    return 1
else
    return 0
end`,
    execute: async (db) => {
      const redis = new Redis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: 1 });
      const stock = await redis.get('drop:1:stock');
      const holds = await redis.keys('hold:1:*');
      console.log(`${C.green}Redis In-Memory State:${C.reset}`);
      console.log(`  Live Stock (drop:1:stock): ${stock} units`);
      console.log(`  Active Atomic Holds (hold:1:*): ${holds.length} active`);
      redis.disconnect();
    },
  },
  {
    id: 13,
    category: 'DATABASE VIEW',
    name: 'vw_admin_sales_summary',
    rubric: 'Component 7 & 8 - Executive Aggregate Sales View',
    description: 'Aggregates revenue, order volume, inventory sellout rate, and checkout latency metrics across drops.',
    sql: `CREATE OR REPLACE VIEW vw_admin_sales_summary AS
SELECT d.drop_id, d.title AS drop_title, d.status AS drop_status, d.drop_price,
       inv.total_allocated, inv.sold_quantity, inv.available_quantity,
       ROUND((inv.sold_quantity / inv.total_allocated) * 100, 2) AS sellout_rate_pct,
       COUNT(DISTINCT o.order_id) AS total_paid_orders,
       COALESCE(SUM(o.final_amount), 0.00) AS total_revenue_usd
FROM drops d
INNER JOIN inventory inv ON d.drop_id = inv.drop_id
LEFT JOIN orders o ON d.drop_id = o.drop_id AND o.status = 'paid'
GROUP BY d.drop_id, d.title, d.status, d.drop_price, inv.total_allocated, inv.sold_quantity, inv.available_quantity;`,
    execute: async (db) => {
      console.log(`${C.yellow}Querying: SELECT * FROM vw_admin_sales_summary;${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT drop_id, drop_title, drop_status, drop_price, total_allocated, sold_quantity, available_quantity, sellout_rate_pct, total_revenue_usd
        FROM vw_admin_sales_summary;
      `);
      console.table(rows);
    },
  },
  {
    id: 14,
    category: 'DATABASE TRIGGER',
    name: 'trg_price_change_audit',
    rubric: 'Component 8 - Price Mutation Tracking Trigger',
    description: 'AFTER UPDATE on products. Automatically appends an immutable price change audit record to price_history.',
    sql: `CREATE TRIGGER trg_price_change_audit
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF OLD.base_price <> NEW.base_price THEN
        INSERT INTO price_history (product_id, old_price, new_price, changed_by_user_id, changed_at)
        VALUES (NEW.product_id, OLD.base_price, NEW.base_price, NULL, NOW());
    END IF;
END;`,
    execute: async (db) => {
      console.log(`${C.yellow}Price history records created by trg_price_change_audit:${C.reset}\n`);
      const [rows] = await db.query(`
        SELECT history_id, product_id, old_price, new_price, changed_by_user_id, changed_at
        FROM price_history ORDER BY history_id DESC LIMIT 5;
      `);
      console.table(rows);
    },
  },
  {
    id: 15,
    category: 'REDIS LUA SCRIPT',
    name: 'release_hold.lua',
    rubric: 'Component 4 & 9 - Atomic Rollback in RAM',
    description: 'Atomically restores inventory stock in RAM when a customer hold expires or is aborted, preventing stock leakage.',
    sql: `-- Redis Lua Script: redis/lua/release_hold.lua
if redis.call('DEL', KEYS[2]) == 1 then
    redis.call('INCR', KEYS[1])
    return 1
else
    return 0
end`,
    execute: async (db) => {
      const redis = new Redis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: 1 });
      const stock = await redis.get('drop:1:stock');
      console.log(`${C.green}Redis In-Memory State:${C.reset}`);
      console.log(`  Live Stock (drop:1:stock): ${stock} units`);
      console.log(`  Atomic Rollback Engine: Online (Zero stock leakage)`);
      redis.disconnect();
    },
  },
];

function printBanner() {
  console.clear();
  console.log(`${C.bold}${C.red}╔═══════════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.red}║    ⚡ FLASHDROP: BACKEND FUNCTIONS & PROCEDURES EXAMINER MENU (PES CSE)           ║${C.reset}`);
  console.log(`${C.bold}${C.red}╚═══════════════════════════════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(` ${C.dim}Use this interactive menu to present any database function live to your teacher!${C.reset}\n`);

  console.log(`${C.bold}${C.cyan}  ── STORED PROCEDURES (Component 8 - 6 Marks) ──${C.reset}`);
  console.log(`  ${C.bold}[1]${C.reset}  sp_place_order               ${C.dim}- ACID Pessimistic Checkout Procedure${C.reset}`);
  console.log(`  ${C.bold}[2]${C.reset}  sp_deposit_wallet            ${C.dim}- Double-Entry Balance Credit Procedure${C.reset}`);
  console.log(`  ${C.bold}[3]${C.reset}  sp_reconcile_drop_inventory  ${C.dim}- Inventory Conservation Math Check${C.reset}`);

  console.log(`\n${C.bold}${C.green}  ── DETERMINISTIC FUNCTIONS (Component 8) ───────${C.reset}`);
  console.log(`  ${C.bold}[4]${C.reset}  fn_calculate_loyalty_discount ${C.dim}- Tier Percentage Discount Function${C.reset}`);
  console.log(`  ${C.bold}[5]${C.reset}  fn_is_user_suspended          ${C.dim}- Fast Bot Security Check Function${C.reset}`);
  console.log(`  ${C.bold}[6]${C.reset}  fn_get_category_breadcrumb    ${C.dim}- Recursive Lineage Concatenation${C.reset}`);

  console.log(`\n${C.bold}${C.yellow}  ── DATABASE TRIGGERS (Component 8) ─────────────${C.reset}`);
  console.log(`  ${C.bold}[7]${C.reset}  trg_prevent_negative_inventory ${C.dim}- Physical Invariant Oversell Guard${C.reset}`);
  console.log(`  ${C.bold}[8]${C.reset}  trg_auto_suspend_fraud        ${C.dim}- Heuristic Risk Auto-Suspension${C.reset}`);
  console.log(`  ${C.bold}[9]${C.reset}  trg_audit_orders              ${C.dim}- Immutable JSON Audit Trail${C.reset}`);
  console.log(`  ${C.bold}[14]${C.reset} trg_price_change_audit        ${C.dim}- Product Price Mutation Audit${C.reset}`);

  console.log(`\n${C.bold}${C.magenta}  ── DATABASE VIEWS (Component 7 & 8) ────────────${C.reset}`);
  console.log(`  ${C.bold}[10]${C.reset} vw_customer_order_history    ${C.dim}- Least-Privilege Order History View${C.reset}`);
  console.log(`  ${C.bold}[11]${C.reset} vw_live_drop_catalog         ${C.dim}- Storefront Multi-Table Catalog View${C.reset}`);
  console.log(`  ${C.bold}[13]${C.reset} vw_admin_sales_summary       ${C.dim}- Executive Sales Aggregate View${C.reset}`);

  console.log(`\n${C.bold}${C.blue}  ── REDIS IN-MEMORY LUA SCRIPTS (Component 4 & 9)${C.reset}`);
  console.log(`  ${C.bold}[12]${C.reset} acquire_hold.lua             ${C.dim}- In-Memory Atomic Reservation Lock${C.reset}`);
  console.log(`  ${C.bold}[15]${C.reset} release_hold.lua             ${C.dim}- Zero-Leak Atomic Stock Rollback${C.reset}`);

  console.log(`\n  ${C.bold}[0]${C.reset}  Exit Menu\n`);
}

async function run() {
  const db = await createDb();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = () => {
    printBanner();
    rl.question(`${C.bold}Select a function to present (0-15): ${C.reset}`, async (answer) => {
      const choice = parseInt(answer.trim(), 10);
      if (choice === 0) {
        console.log('\nExiting menu. Good luck with your viva evaluation!\n');
        await db.end();
        rl.close();
        process.exit(0);
      }

      const item = ITEMS.find((i) => i.id === choice);
      if (!item) {
        console.log(`\n${C.red}Invalid choice. Please select 0-15.${C.reset}`);
        setTimeout(ask, 1500);
        return;
      }

      console.clear();
      console.log(`${C.bold}${C.cyan}================================================================================${C.reset}`);
      console.log(`  ${C.bold}${item.category}:${C.reset} ${C.green}${item.name}${C.reset}`);
      console.log(`  ${C.dim}Rubric Marks:${C.reset} ${C.yellow}${item.rubric}${C.reset}`);
      console.log(`${C.bold}${C.cyan}================================================================================${C.reset}`);
      console.log(`\n${C.bold}📖 Purpose & Defense Explanation:${C.reset}`);
      console.log(`  ${item.description}\n`);

      console.log(`${C.bold}📜 SQL Definition / Prototype:${C.reset}`);
      console.log(`${C.dim}${item.sql}${C.reset}\n`);

      console.log(`${C.bold}▶ Live MySQL 8.0 Execution Output:${C.reset}`);
      try {
        await item.execute(db);
      } catch (err) {
        console.error(`${C.red}Execution Error: ${err.message}${C.reset}`);
      }

      console.log(`\n${C.dim}────────────────────────────────────────────────────────────────────────────────${C.reset}`);
      if (rl.closed) {
        await db.end();
        process.exit(0);
      }
      try {
        rl.question(`${C.bold}Press [Enter] to return to the menu...${C.reset}`, () => {
          ask();
        });
      } catch (e) {
        await db.end();
        process.exit(0);
      }
    });
  };

  ask();
}

run().catch((err) => {
  console.error('Failed to run backend functions menu:', err.message);
  process.exit(1);
});
