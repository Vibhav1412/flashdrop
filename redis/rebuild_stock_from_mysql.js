// =====================================================================
// FLASHDROP: redis/rebuild_stock_from_mysql.js
// Startup State Hydration: MySQL -> Redis Stock Synchronization
// Ensures MySQL remains the durable source of truth.
// =====================================================================

const mysql = require('mysql2/promise');
const Redis = require('ioredis');

async function syncStockToRedis() {
  console.log('🔄 Rebuilding Redis inventory state from MySQL (Durable Source of Truth)...');

  const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
  });

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
    password: process.env.DB_ADMIN_PASSWORD || 'admin_secure_pass_123',
    database: process.env.DB_NAME || 'flashdrop',
  });

  try {
    const [rows] = await db.execute(`
      SELECT d.drop_id, d.title, d.status, inv.available_quantity
      FROM drops d
      INNER JOIN inventory inv ON d.drop_id = inv.drop_id
      WHERE d.status IN ('live', 'scheduled')
    `);

    console.log(`Found ${rows.length} active/scheduled drops in MySQL.\n`);

    for (const drop of rows) {
      const stockKey = `drop:${drop.drop_id}:stock`;
      await redis.set(stockKey, drop.available_quantity);
      console.log(`  ⚡ Synced ${stockKey} -> ${drop.available_quantity} units ("${drop.title}")`);
    }

    console.log('\n✅ Redis state successfully re-hydrated from MySQL!');
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
  } finally {
    await db.end();
    redis.disconnect();
  }
}

if (require.main === module) {
  syncStockToRedis();
}

module.exports = { syncStockToRedis };

