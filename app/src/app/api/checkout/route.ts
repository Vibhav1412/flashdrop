import { NextResponse } from 'next/server';
import { customerPool, adminPool } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || 2;
    const dropId = body.dropId || 1;
    const paymentMethod = body.paymentMethod || 'wallet';

    // 1. Mandatory Hold Validation: Verify buyer holds active in-memory reservation in Redis
    const holdKey = `hold:${dropId}:${userId}`;
    const hasHold = await redis.exists(holdKey);
    if (!hasHold) {
      return NextResponse.json({
        success: false,
        code: 'NO_ACTIVE_HOLD',
        message: 'Active reservation required! Please claim a 5-minute checkout hold on the drop page first.',
      }, { status: 403 });
    }

    // 2. Call MySQL Stored Procedure within Customer Pool (Least-Privilege RBAC)
    const conn = await customerPool.getConnection();
    let output: any = null;
    try {
      await conn.query(
        'CALL sp_place_order(?, ?, ?, @order_id, @status_code, @status_message)',
        [userId, dropId, paymentMethod]
      );
      const [outRows]: any = await conn.query(
        'SELECT @order_id AS order_id, @status_code AS status_code, @status_message AS status_message'
      );
      output = outRows[0];
    } finally {
      conn.release();
    }

    if (!output || output.status_code !== 'SUCCESS') {
      return NextResponse.json({
        success: false,
        code: output?.status_code || 'UNKNOWN_ERROR',
        message: output?.status_message || 'Order could not be processed.',
      }, { status: 400 });
    }

    // 3. On Successful Order Placement: Delete the temporary hold in Redis
    await redis.del(holdKey);

    // 4. Reconcile Redis In-Memory Counter with MySQL Durable Source of Truth
    const [invRows]: any = await adminPool.query(
      'SELECT available_quantity FROM inventory WHERE drop_id = ?',
      [dropId]
    );
    if (invRows && invRows.length > 0) {
      await redis.set(`drop:${dropId}:stock`, invRows[0].available_quantity);
    }

    return NextResponse.json({
      success: true,
      orderId: output.order_id,
      code: output.status_code,
      message: output.status_message,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
