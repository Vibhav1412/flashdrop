const mysql = require(require('path').resolve(__dirname, '../app/node_modules/mysql2/promise'));

async function main() {
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'flashdrop_admin_user',
    password: 'admin_secure_pass_123',
    database: 'flashdrop',
  });

  console.log('Updating customer balances for distinct viva evaluation testing...');

  // Customer 1: Buyer2 (user_id: 2) -> $376.00 (Keep existing balance & orders)

  // Customer 2: Buyer3 (user_id: 3) -> $820.50
  await db.query('UPDATE wallets SET balance = 820.50 WHERE user_id = 3');
  await db.query(`
    INSERT INTO wallet_ledger (wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description, created_at)
    VALUES (3, 'CREDIT', 70.50, 820.50, 'referral_bonus', 'BONUS-LOYALTY-3', 'Gold Tier loyalty reward credit', NOW())
  `);

  // Customer 3: Buyer4 (user_id: 4) -> $145.00
  await db.query('UPDATE wallets SET balance = 145.00 WHERE user_id = 4');
  await db.query(`
    INSERT INTO wallet_ledger (wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description, created_at)
    VALUES (4, 'DEBIT', 605.00, 145.00, 'order_payment', 'ORD-RETRO-441', 'Checkout debit for Aero Phantom drop', NOW())
  `);

  // Customer 4: Buyer5 (user_id: 5) -> $1250.00 (High-Roller VIP)
  await db.query('UPDATE wallets SET balance = 1250.00 WHERE user_id = 5');
  await db.query(`
    INSERT INTO wallet_ledger (wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description, created_at)
    VALUES (5, 'CREDIT', 500.00, 1250.00, 'deposit', 'DEP-WIRE-VIP5', 'Wire transfer wallet deposit', NOW())
  `);

  // Customer 5: Buyer6 (user_id: 6) -> $55.00 (Low-balance Shopper)
  await db.query('UPDATE wallets SET balance = 55.00 WHERE user_id = 6');
  await db.query(`
    INSERT INTO wallet_ledger (wallet_id, entry_type, amount, balance_after, reference_type, reference_id, description, created_at)
    VALUES (6, 'DEBIT', 695.00, 55.00, 'order_payment', 'ORD-VINTAGE-601', 'Limited sneaker drop debit', NOW())
  `);

  const [res] = await db.query(
    'SELECT u.user_id, u.email, u.first_name, w.balance FROM users u JOIN wallets w ON u.user_id = w.user_id WHERE u.user_id BETWEEN 2 AND 6 ORDER BY u.user_id'
  );
  console.table(res);

  await db.end();
}

main().catch(console.error);
