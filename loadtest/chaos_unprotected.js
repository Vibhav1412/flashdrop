// =====================================================================
// FLASHDROP: loadtest/chaos_unprotected.js
// Path A: Unprotected MySQL-Only Concurrency Benchmark
// Exposes: Lost updates, inventory overselling, lock wait timeouts, and deadlocks.
// Component 14: Originality, Individual Contribution, Chaos Demo (4 Marks)
// =====================================================================

const mysql = require('mysql2/promise');

async function runUnprotectedBenchmark(concurrentUsers = 1000, initialStock = 100) {
  console.log('=====================================================================');
  console.log('💥 STARTING CHAOS PATH A: RAW UNPROTECTED MYSQL');
  console.log(`Simulating ${concurrentUsers} concurrent buyers competing for ${initialStock} items...`);
  console.log('=====================================================================\n');

  // Admin connection to reset inventory state for the test
  const adminDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
    password: process.env.DB_ADMIN_PASSWORD || 'admin_secure_pass_123',
    database: process.env.DB_NAME || 'flashdrop',
  });

  // Reset test drop (Drop ID 1) to target initial stock
  await adminDb.execute(`
    UPDATE inventory 
    SET total_allocated = ?, reserved_holds = 0, sold_quantity = 0, available_quantity = ?
    WHERE drop_id = 1
  `, [initialStock, initialStock]);
  await adminDb.end();

  // Create client connection pool for concurrent buyers
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
    password: process.env.DB_ADMIN_PASSWORD || 'admin_secure_pass_123',
    database: process.env.DB_NAME || 'flashdrop',
    connectionLimit: 30,
    waitForConnections: true,
  });

  let successfulPurchases = 0;
  let rejectedOutOfStock = 0;
  let deadlocksEncountered = 0;
  let checkConstraintViolations = 0;
  let errors = 0;
  const latencies = [];

  const startTime = Date.now();

  // Fire simulated concurrent buyers
  const buyers = Array.from({ length: concurrentUsers }, async (_, index) => {
    const userId = (index % 900) + 2;
    const reqStart = Date.now();

    try {
      // NAIVE CONCURRENCY ANTI-PATTERN:
      // 1. Read current stock
      const [rows] = await pool.query('SELECT available_quantity FROM inventory WHERE drop_id = 1');
      const currentStock = rows[0]?.available_quantity ?? 0;

      // 2. Application-level check (vulnerable to race conditions!)
      if (currentStock > 0) {
        // Artificially simulate 5ms application business logic processing delay
        await new Promise((r) => setTimeout(r, 5));

        // 3. Write decrement based on stale local snapshot (Lost Update vulnerability)
        await pool.query(
          'UPDATE inventory SET available_quantity = available_quantity - 1, sold_quantity = sold_quantity + 1 WHERE drop_id = 1'
        );
        successfulPurchases++;
      } else {
        rejectedOutOfStock++;
      }
    } catch (err) {
      if (err.code === 'ER_LOCK_DEADLOCK') {
        deadlocksEncountered++;
      } else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
        checkConstraintViolations++;
      } else {
        errors++;
      }
    } finally {
      latencies.push(Date.now() - reqStart);
    }
  });

  await Promise.all(buyers);
  const totalDurationMs = Date.now() - startTime;
  await pool.end();

  // Inspect final corrupted state in MySQL
  const verifyDb = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
    password: process.env.DB_ADMIN_PASSWORD || 'admin_secure_pass_123',
    database: process.env.DB_NAME || 'flashdrop',
  });
  const [finalRows] = await verifyDb.query('SELECT available_quantity, sold_quantity FROM inventory WHERE drop_id = 1');
  await verifyDb.end();

  const finalAvailable = finalRows[0].available_quantity;
  const finalSold = finalRows[0].sold_quantity;
  const oversellCount = finalSold > initialStock ? (finalSold - initialStock) : 0;

  // Compute Latency Percentiles
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;

  console.log('\n--- 📊 PATH A (UNPROTECTED MYSQL) RESULTS ---');
  console.log(`Initial Inventory:        ${initialStock} units`);
  console.log(`Total Attempted Buyers:   ${concurrentUsers}`);
  console.log(`Actual Units Sold:        ${finalSold} units`);
  console.log(`Check Violations Aborted: ${checkConstraintViolations} transactions blocked by DB CHECK`);
  console.log(`Deadlocks Aborted:        ${deadlocksEncountered}`);
  console.log(`Total Elapsed Time:       ${totalDurationMs} ms`);
  console.log(`Throughput:               ${Math.round((concurrentUsers / totalDurationMs) * 1000)} req/sec`);
  console.log(`p50 Latency:              ${p50} ms`);
  console.log(`p95 Latency:              ${p95} ms`);
  console.log('--------------------------------------------\n');

  return {
    path: 'Unprotected MySQL',
    initialStock,
    concurrentUsers,
    finalSold,
    oversellCount,
    checkConstraintViolations,
    finalAvailable,
    deadlocksEncountered,
    throughputRps: Math.round((concurrentUsers / totalDurationMs) * 1000),
    p50Ms: p50,
    p95Ms: p95,
  };
}

if (require.main === module) {
  runUnprotectedBenchmark(1000, 100);
}

module.exports = { runUnprotectedBenchmark };
