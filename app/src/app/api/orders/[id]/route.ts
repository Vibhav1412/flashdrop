import { NextResponse } from 'next/server';
import { adminPool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = Number(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID.' }, { status: 400 });
    }

    // Query order details with items, customer details, and payment using admin pool
    const [orders]: any = await adminPool.query(
      `SELECT o.order_id, o.order_number, o.user_id, o.total_amount, o.discount_amount, o.final_amount, o.status, o.created_at,
              u.email AS customer_email, CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
              p.payment_id, p.payment_method, p.status AS payment_status, p.transaction_reference,
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

    // Query linked wallet ledger entry for audit trail
    const [ledger]: any = await adminPool.query(
      `SELECT ledger_id, amount, entry_type, balance_after, created_at, reference_id
       FROM wallet_ledger
       WHERE wallet_id = (SELECT wallet_id FROM wallets WHERE user_id = ?)
         AND reference_type = 'order_payment'
       ORDER BY ledger_id DESC
       LIMIT 1`,
      [order.user_id]
    );

    const ledgerRow = ledger && ledger.length > 0 ? ledger[0] : null;

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.order_id,
        orderNumber: order.order_number,
        date: order.created_at,
        status: order.status,
        customerName: order.customer_name || 'Verified Collector',
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
          amount: order.final_amount || order.total_amount,
          status: order.payment_status || 'captured',
          transactionReference: order.transaction_reference,
        },
        ledgerEntry: ledgerRow ? {
          entry_id: ledgerRow.ledger_id,
          amount: ledgerRow.amount,
          balance_after: ledgerRow.balance_after,
          created_at: ledgerRow.created_at,
        } : null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
