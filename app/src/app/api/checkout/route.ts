import { NextResponse } from 'next/server';
import { customerPool } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || 2;
    const dropId = body.dropId || 1;
    const paymentMethod = body.paymentMethod || 'wallet';

    // Call MySQL Stored Procedure within Customer Pool (Least Privilege)
    const [result]: any = await customerPool.query(
      `CALL sp_place_order(?, ?, ?, @order_id, @status_code, @status_message);
       SELECT @order_id AS order_id, @status_code AS status_code, @status_message AS status_message;`,
      [userId, dropId, paymentMethod]
    );

    // MySQL returns array of result packets; the second query has our output variables
    const output = Array.isArray(result) && result.length > 1 ? result[1][0] : null;

    if (!output || output.status_code !== 'SUCCESS') {
      return NextResponse.json({
        success: false,
        code: output?.status_code || 'UNKNOWN_ERROR',
        message: output?.status_message || 'Order could not be processed.',
      }, { status: 400 });
    }

    // On Successful Order Placement: Delete the temporary hold in Redis
    await redis.del(`hold:${dropId}:${userId}`);

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
