// =====================================================================
// FLASHDROP: app/src/lib/db.ts
// Dual MySQL Connection Pooling (Database-Enforced Least Privilege)
// Component 11: Backend/API & DB Integration (2 Marks)
// Component 12: Role-Based Access Control in DB (4 Marks)
// =====================================================================

import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_NAME = process.env.DB_NAME || 'flashdrop';

// ---------------------------------------------------------------------
// 1. Customer Connection Pool
// Authenticated strictly as flashdrop_customer_user with least-privilege role.
// Used for storefront, view queries, and transactional stored procedures.
// Direct DML writes to inventory/orders are physically rejected by MySQL!
// ---------------------------------------------------------------------
export const customerPool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: process.env.DB_CUSTOMER_USER || 'flashdrop_customer_user',
  password: process.env.DB_CUSTOMER_PASSWORD || 'customer_secure_pass_123',
  waitForConnections: true,
  connectionLimit: 40,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// ---------------------------------------------------------------------
// 2. Admin Connection Pool
// Authenticated as flashdrop_admin_user with full operational privileges.
// Used exclusively for admin dashboards, drop scheduling, and analytics.
// ---------------------------------------------------------------------
export const adminPool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: process.env.DB_ADMIN_USER || 'flashdrop_admin_user',
  password: process.env.DB_ADMIN_PASSWORD || 'admin_secure_pass_123',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
});

// ---------------------------------------------------------------------
// 3. Role-Based Connection Router
// Dynamically selects the least-privilege pool based on user session role.
// ---------------------------------------------------------------------
export function getDbPool(role?: string) {
  if (role === 'admin') {
    return adminPool;
  }
  return customerPool;
}
