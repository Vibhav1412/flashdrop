#!/usr/bin/env node
// =====================================================================
// FLASHDROP: scripts/flashdrop_admin_cli.js
// Interactive CLI Administration Tool for Drop Management & Diagnostics
// =====================================================================

const mysql = require('mysql2/promise');
const Redis = require('ioredis');

async function main() {
  const command = process.argv[2] || 'status';

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
    if (command === 'status') {
      console.log('⚡ FLASHDROP LIVE ENGINE STATUS:');
      const [drops] = await db.execute(`
        SELECT d.drop_id, d.title, d.status, inv.total_allocated, inv.available_quantity, inv.sold_quantity
        FROM drops d
        INNER JOIN inventory inv ON d.drop_id = inv.drop_id
      `);

      console.table(drops);

      console.log('\nRedis Active In-Memory Stock Keys:');
      const keys = await redis.keys('drop:*:stock');
      for (const k of keys) {
        const val = await redis.get(k);
        console.log(`  ${k} -> ${val} units`);
      }
    } else if (command === 'holds') {
      console.log('⚡ ACTIVE CHECKOUT HOLDS (5-MIN TTL):');
      const holdKeys = await redis.keys('hold:*');
      if (holdKeys.length === 0) {
        console.log('  No active holds currently pending.');
      } else {
        for (const h of holdKeys) {
          const ttl = await redis.ttl(h);
          console.log(`  ${h} (Expires in ${ttl}s)`);
        }
      }
    } else {
      console.log(`Unknown command: ${command}. Available commands: status, holds`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await db.end();
    redis.disconnect();
  }
}

main();
