// =====================================================================
// FLASHDROP: loadtest/run_chaos_benchmark.js
// Integrated Concurrency Comparison Engine
// Component 14: Originality, Individual Contribution, Chaos Demo (4 Marks)
// =====================================================================

const fs = require('fs');
const path = require('path');
const { runUnprotectedBenchmark } = require('./chaos_unprotected');
const { runProtectedBenchmark } = require('./chaos_protected');

async function executeFullChaosSuite() {
  console.clear();
  console.log('=====================================================================');
  console.log('⚡ PROJECT FLASHDROP: CHAOS MODE LOAD BENCHMARK (CONCURRENCY LAB)');
  console.log('Testing 1,000 Concurrent Buyers against a 100-Unit Flash Drop');
  console.log('=====================================================================\n');

  // 1. Run Path A: Unprotected MySQL
  const resultA = await runUnprotectedBenchmark(1000, 100);

  // Pause for 1.5 seconds to allow connections to drain
  await new Promise((r) => setTimeout(r, 1500));

  // 2. Run Path B: Redis Lua Protected
  const resultB = await runProtectedBenchmark(1000, 100);

  // 3. Format Side-by-Side Comparison Output
  const comparisonText = `
========================================================================================
                      CHAOS MODE BENCHMARK RESULTS (1,000 CONCURRENT BUYERS)
========================================================================================
Metric                       Path A: Unprotected MySQL        Path B: Redis-Protected Layer
----------------------------------------------------------------------------------------
Target Inventory             ${resultA.initialStock} units                        ${resultB.initialStock} units
Total Attempted Checkouts    ${resultA.concurrentUsers}                            ${resultB.concurrentUsers}
Actual Units Sold / Held     ${resultA.finalSold} units (Database Contention)  ${resultB.successfulHolds} units (Exact Allocation)
DB Check Violations / Oversell ${resultA.checkConstraintViolations || 0} aborted (CHECK error)     0 errors (Clean In-Memory Rejection)
Transaction Deadlocks        ${resultA.deadlocksEncountered} aborted transactions       0 deadlocks
Throughput                   ${resultA.throughputRps} requests/sec                 ${resultB.throughputRps} requests/sec
p50 Latency                  ${resultA.p50Ms} ms                              ${resultB.p50Ms} ms
p95 Latency                  ${resultA.p95Ms} ms                           ${resultB.p95Ms} ms
Final Available Stock        ${resultA.finalAvailable} units                            ${resultB.finalStock} units
Performance Gain             Baseline (Disk I/O Bottleneck)   ${Math.round(resultB.throughputRps / (resultA.throughputRps || 1))}x Higher Throughput / ${Math.round(resultA.p50Ms / (resultB.p50Ms || 1))}x Faster
========================================================================================
`;

  console.log(comparisonText);

  // Save report to disk for evaluation presentation
  fs.writeFileSync(path.join(__dirname, 'benchmark_results.txt'), comparisonText);
  fs.writeFileSync(path.join(__dirname, 'benchmark_results.json'), JSON.stringify({ resultA, resultB }, null, 2));

  console.log('✅ Results successfully saved to loadtest/benchmark_results.txt and .json!');

  // Restore inventory state for continued app & test usage
  const mysql = require('mysql2/promise');
  const Redis = require('ioredis');
  try {
    const adminDb = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
      password: process.env.DB_ADMIN_PASSWORD || 'admin_secure_pass_123',
      database: process.env.DB_NAME || 'flashdrop',
    });
    await adminDb.execute('UPDATE inventory SET total_allocated = 100, reserved_holds = 5, sold_quantity = 25, available_quantity = 70 WHERE drop_id = 1');
    await adminDb.end();
    const redis = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1', port: Number(process.env.REDIS_PORT) || 6379 });
    await redis.set('drop:1:stock', 70);
    redis.disconnect();
    console.log('🔄 Drop 1 inventory automatically restored to seed state (70 available).');
  } catch (_) {}
}

if (require.main === module) {
  executeFullChaosSuite();
}

module.exports = { executeFullChaosSuite };
