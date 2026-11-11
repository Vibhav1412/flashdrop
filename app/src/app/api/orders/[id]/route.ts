import { NextResponse } from 'next/server';
import { customerPool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = Number(params.id);

    // Query order details with items and payment
    const [orders]: any = await customerPool.query(
      `SELECT o.order_id, o.user_id, o.total_amount, o.status, o.created_at,
              u.email AS customer_email, u.full_name AS customer_name,
              p.payment_id, p.payment_method, p.status AS payment_status,
              oi.quantity, oi.unit_price,
              pr.title AS product_title, pr.sku, pr.attributes_json
       FROM orders o
       INNER JOIN users u ON o.user_id = u.user_id
       LEFT JOIN payments p ON o.order_id = p.order_id
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       LEFT JOIN products pr ON oi.product_id = pr.product_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const order = orders[0];

    // Query linked wallet ledger entry
    const [ledger]: any = await customerPool.query(
      `SELECT entry_id, amount, transaction_type, balance_after, created_at
       FROM wallet_ledger
       WHERE reference_type = 'ORDER' AND reference_id = ?
       LIMIT 1`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.order_id,
        date: order.created_at,
        status: order.status,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        item: {
          title: order.product_title || 'Aero Phantom Retro High "Chicago Drop"',
          sku: order.sku || 'FD-SNK-001',
          quantity: order.quantity || 1,
          price: order.unit_price || order.total_amount,
          attributes: typeof order.attributes_json === 'string' ? JSON.parse(order.attributes_json) : order.attributes_json,
        },
        payment: {
          id: order.payment_id,
          method: order.payment_method || 'wallet',
          amount: order.total_amount,
          status: order.payment_status || 'captured',
        },
        ledgerEntry: ledger[0] || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

