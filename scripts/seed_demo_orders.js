const mysql = require(require('path').resolve(__dirname, '../app/node_modules/mysql2/promise'));

async function main() {
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'flashdrop_admin_user',
    password: 'admin_secure_pass_123',
    database: 'flashdrop',
  });

  console.log('Seeding distinct orders for Customer 2, 3, 5...');

  // Buyer 3 (Customer 2): 1 order on Drop 2
  await db.query(`
    INSERT INTO orders (order_number, user_id, drop_id, total_amount, discount_amount, final_amount, status, created_at)
    VALUES ('ORD-DROP2-BUYER3', 3, 2, 190.00, 0.00, 190.00, 'paid', DATE_SUB(NOW(), INTERVAL 2 DAY))
  `);
  const [b3Order] = await db.query("SELECT order_id FROM orders WHERE order_number = 'ORD-DROP2-BUYER3'");
  const b3Id = b3Order[0].order_id;
  await db.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, 2, 1, 190.00, 190.00)`, [b3Id]);
  await db.query(`INSERT INTO payments (order_id, payment_method, transaction_reference, amount, status, created_at) VALUES (?, 'wallet', 'TXN-BUYER3-01', 190.00, 'success', NOW())`, [b3Id]);

  // Buyer 4 (Customer 3): 2 orders (Drop 2 and Drop 3)
  await db.query(`
    INSERT INTO orders (order_number, user_id, drop_id, total_amount, discount_amount, final_amount, status, created_at)
    VALUES ('ORD-DROP2-BUYER4-A', 4, 2, 190.00, 0.00, 190.00, 'paid', DATE_SUB(NOW(), INTERVAL 3 DAY))
  `);
  const [b4OrderA] = await db.query("SELECT order_id FROM orders WHERE order_number = 'ORD-DROP2-BUYER4-A'");
  await db.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, 2, 1, 190.00, 190.00)`, [b4OrderA[0].order_id]);
  await db.query(`INSERT INTO payments (order_id, payment_method, transaction_reference, amount, status, created_at) VALUES (?, 'wallet', 'TXN-BUYER4-A', 190.00, 'success', NOW())`, [b4OrderA[0].order_id]);

  await db.query(`
    INSERT INTO orders (order_number, user_id, drop_id, total_amount, discount_amount, final_amount, status, created_at)
    VALUES ('ORD-DROP3-BUYER4-B', 4, 3, 160.00, 10.00, 150.00, 'paid', DATE_SUB(NOW(), INTERVAL 1 DAY))
  `);
  const [b4OrderB] = await db.query("SELECT order_id FROM orders WHERE order_number = 'ORD-DROP3-BUYER4-B'");
  await db.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, 3, 1, 160.00, 160.00)`, [b4OrderB[0].order_id]);
  await db.query(`INSERT INTO payments (order_id, payment_method, transaction_reference, amount, status, created_at) VALUES (?, 'wallet', 'TXN-BUYER4-B', 150.00, 'success', NOW())`, [b4OrderB[0].order_id]);

  // Buyer 6 (Customer 5): 1 order (Drop 3)
  await db.query(`
    INSERT INTO orders (order_number, user_id, drop_id, total_amount, discount_amount, final_amount, status, created_at)
    VALUES ('ORD-DROP3-BUYER6', 6, 3, 160.00, 0.00, 160.00, 'paid', DATE_SUB(NOW(), INTERVAL 5 HOUR))
  `);
  const [b6Order] = await db.query("SELECT order_id FROM orders WHERE order_number = 'ORD-DROP3-BUYER6'");
  await db.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, 3, 1, 160.00, 160.00)`, [b6Order[0].order_id]);
  await db.query(`INSERT INTO payments (order_id, payment_method, transaction_reference, amount, status, created_at) VALUES (?, 'wallet', 'TXN-BUYER6-01', 160.00, 'success', NOW())`, [b6Order[0].order_id]);

  const [res] = await db.query(`
    SELECT u.user_id, u.first_name, u.email, w.balance, COUNT(o.order_id) as total_orders
    FROM users u
    JOIN wallets w ON u.user_id = w.user_id
    LEFT JOIN orders o ON u.user_id = o.user_id
    WHERE u.user_id BETWEEN 2 AND 6
    GROUP BY u.user_id, u.first_name, u.email, w.balance
    ORDER BY u.user_id
  `);
  console.table(res);

  await db.end();
}

main().catch(console.error);
