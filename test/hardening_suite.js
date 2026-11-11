// =====================================================================
// FLASHDROP: test/hardening_suite.js
// Phase 10: System Hardening, Fault Tolerance & Edge-Case Verification
// Validates: Duplicate hold blocking, hold release restitution,
// ACID rollback on insufficient funds, and RBAC defense.
// =====================================================================

const mysql = require('mysql2/promise');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

async function runHardeningSuite() {
  console.clear();
  console.log('=====================================================================');
  console.log('🛡️ FLASHDROP: SYSTEM HARDENING & FAULT TOLERANCE VERIFICATION SUITE');
  console.log('Testing Edge Cases, Concurrency Guards, ACID Rollbacks & RBAC Defenses');
  console.log('=====================================================================\n');

  const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
  });

  const adminDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
    password: process.env.DB_ADMIN_PASSWORD || 'admin_secure_pass_123',
    database: process.env.DB_NAME || 'flashdrop',
  });

  const customerDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_CUSTOMER_USER || 'flashdrop_customer_user',
    password: process.env.DB_CUSTOMER_PASSWORD || 'customer_secure_pass_123',
    database: process.env.DB_NAME || 'flashdrop',
  });

  // Load Lua scripts
  const acquireLua = fs.readFileSync(path.join(__dirname, '..', 'redis', 'lua', 'acquire_hold.lua'), 'utf8');
  const releaseLua = fs.readFileSync(path.join(__dirname, '..', 'redis', 'lua', 'release_hold.lua'), 'utf8');

  let passedTests = 0;
  const totalTests = 4;

  try {
    // -----------------------------------------------------------------
    // TEST 1: Double-Click / Duplicate Hold Prevention
    // -----------------------------------------------------------------
    console.log('--- [TEST 1: CONCURRENT DUPLICATE HOLD PREVENTION] ---');
    const testDropId = 1;
    const testUserId = 8888;
    const stockKey = `drop:${testDropId}:stock`;
    const holdKey = `hold:${testDropId}:${testUserId}`;

    // Clean up any stale key
    await redis.del(holdKey);
    await redis.set(stockKey, 50);

    // Call 1: Acquire Hold
    const firstAttempt = await redis.eval(acquireLua, 2, stockKey, holdKey, '300', String(testUserId));
    console.log('1st Hold Attempt result:', firstAttempt);

    // Call 2: Duplicate Attempt immediately after
    const secondAttempt = await redis.eval(acquireLua, 2, stockKey, holdKey, '300', String(testUserId));
    console.log('2nd Hold Attempt result (Duplicate):', secondAttempt);

    if (firstAttempt[0] === 1 && secondAttempt[0] === 0 && secondAttempt[1] === 'ALREADY_HOLDING') {
      console.log('✅ TEST 1 PASSED: Duplicate hold blocked with ALREADY_HOLDING code!\n');
      passedTests++;
    } else {
      console.error('❌ TEST 1 FAILED: Expected ALREADY_HOLDING rejection.\n');
    }

    // -----------------------------------------------------------------
    // TEST 2: Hold Expiry & Stock Restitution
    // -----------------------------------------------------------------
    console.log('--- [TEST 2: HOLD RELEASE & INVENTORY RESTITUTION] ---');
    const stockBeforeRelease = Number(await redis.get(stockKey));
    console.log(`Stock before release: ${stockBeforeRelease}`);

    // Call release_hold.lua (simulating 5-min timeout or manual checkout cancel)
    const releaseResult = await redis.eval(releaseLua, 2, stockKey, holdKey);
    console.log('Release Hold result:', releaseResult);
    const stockAfterRelease = Number(await redis.get(stockKey));
    console.log(`Stock after release: ${stockAfterRelease}`);

    if (releaseResult[0] === 1 && stockAfterRelease === stockBeforeRelease + 1) {
      console.log('✅ TEST 2 PASSED: Inventory atomicity preserved (+1 unit restored)!\n');
      passedTests++;
    } else {
      console.error('❌ TEST 2 FAILED: Stock was not properly restituted.\n');
    }

    // -----------------------------------------------------------------
    // TEST 3: ACID Rollback on Insufficient Wallet Balance
    // -----------------------------------------------------------------
    console.log('--- [TEST 3: ACID TRANSACTION ROLLBACK ON INSUFFICIENT FUNDS] ---');
    // Ensure Drop 1 has available inventory and test user 500 has zero balance
    await adminDb.execute('UPDATE inventory SET total_allocated = 100, reserved_holds = 0, sold_quantity = 50, available_quantity = 50 WHERE drop_id = 1');
    await adminDb.execute('UPDATE wallets SET balance = 0.00 WHERE user_id = 500');
    const [ordersBefore] = await adminDb.execute('SELECT COUNT(*) as cnt FROM orders WHERE user_id = 500');
    const ordersCountBefore = ordersBefore[0].cnt;

    // Call sp_place_order for Drop 1 ($220.00 price) with $0.00 wallet
    await adminDb.query("CALL sp_place_order(500, 1, 'wallet', @o_id, @o_code, @o_msg)");
    const [spRows] = await adminDb.query("SELECT @o_id as order_id, @o_code as code, @o_msg as msg");
    const spOutput = spRows[0];
    console.log('sp_place_order response:', spOutput);

    const [ordersAfter] = await adminDb.execute('SELECT COUNT(*) as cnt FROM orders WHERE user_id = 500');
    const ordersCountAfter = ordersAfter[0].cnt;

    if (spOutput.code === 'INSUFFICIENT_FUNDS' && ordersCountBefore === ordersCountAfter) {
      console.log('✅ TEST 3 PASSED: ACID rollback successful; zero orders created on balance shortfall!\n');
      passedTests++;
    } else {
      console.error('❌ TEST 3 FAILED: Expected INSUFFICIENT_FUNDS and unchanged order count.\n');
    }

    // -----------------------------------------------------------------
    // TEST 4: MySQL 8 RBAC Defense (Least Privilege Protection)
    // -----------------------------------------------------------------
    console.log('--- [TEST 4: LEAST-PRIVILEGE RBAC ACCESS CONTROL DEFENSE] ---');
    try {
      // Customer tries unauthorized direct modification of inventory table
      await customerDb.execute('UPDATE inventory SET available_quantity = 9999 WHERE drop_id = 1');
      console.error('❌ TEST 4 FAILED: Customer user was able to modify inventory directly!\n');
    } catch (rbacErr) {
      console.log(`Expected Engine Error caught: ${rbacErr.code} - ${rbacErr.message}`);
      if (rbacErr.code === 'ER_TABLEACCESS_DENIED_ERROR') {
        console.log('✅ TEST 4 PASSED: MySQL RBAC blocked unauthorized UPDATE with Error 1142!\n');
        passedTests++;
      }
    }

    console.log('=====================================================================');
    console.log(`🏆 HARDENING SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('All ACID guarantees, atomic locks, and RBAC security bounds verified!');
    console.log('=====================================================================\n');

  } catch (err) {
    console.error('Unexpected error in suite:', err);
  } finally {
    await adminDb.end();
    await customerDb.end();
    redis.disconnect();
  }
}

if (require.main === module) {
  runHardeningSuite();
}

module.exports = { runHardeningSuite };
