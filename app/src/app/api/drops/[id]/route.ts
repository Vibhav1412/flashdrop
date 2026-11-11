import { NextResponse } from 'next/server';
import { customerPool } from '@/lib/db';
import { getLiveStock, getQueuePosition } from '@/lib/redis';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const dropId = params.id;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const [rows]: any = await customerPool.query(
      `SELECT * FROM vw_live_drop_catalog WHERE drop_id = ?`,
      [dropId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Drop not found' }, { status: 404 });
    }

    const drop = rows[0];
    const liveStock = await getLiveStock(dropId);

    let queuePosition = null;
    if (userId) {
      queuePosition = await getQueuePosition(dropId, userId);
    }

    return NextResponse.json({
      success: true,
      drop: {
        ...drop,
        live_stock: liveStock !== null ? liveStock : drop.available_quantity,
        queue_position: queuePosition,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

