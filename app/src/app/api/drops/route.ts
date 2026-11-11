import { NextResponse } from 'next/server';
import { customerPool } from '@/lib/db';
import { getLiveStock } from '@/lib/redis';

export async function GET() {
  try {
    // Read clean catalog view from MySQL
    const [rows]: any = await customerPool.query(`
      SELECT * FROM vw_live_drop_catalog ORDER BY start_time ASC
    `);

    // Enrich with live real-time stock counters from Redis
    const drops = await Promise.all(
      rows.map(async (drop: any) => {
        let redisStock = await getLiveStock(drop.drop_id);
        // Fallback to MySQL available_quantity if Redis not yet hydrated
        if (redisStock === null || isNaN(redisStock)) {
          redisStock = drop.available_quantity;
        }
        return {
          ...drop,
          live_stock: redisStock,
          is_sold_out: redisStock <= 0,
        };
      })
    );

    return NextResponse.json({ success: true, drops });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

