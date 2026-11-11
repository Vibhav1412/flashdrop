import { NextResponse } from 'next/server';
import { adminPool } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    // 1. Fetch executive summary view via elevated adminPool
    const [summaryRows]: any = await adminPool.query(
      `SELECT * FROM vw_admin_sales_summary ORDER BY drop_id ASC`
    );

    // 2. Fetch recent fraud flags
    const [fraudRows]: any = await adminPool.query(`
      SELECT ff.flag_id, ff.user_id, u.email, ff.risk_score, ff.flag_reason, ff.flagged_at
      FROM fraud_flags ff
      INNER JOIN users u ON ff.user_id = u.user_id
      ORDER BY ff.flagged_at DESC
      LIMIT 5
    `);

    // 3. Inspect Redis active queue depths
    const queueLength = await redis.zcard('drop:1:queue');
    const liveRedisStock = await redis.get('drop:1:stock');

    return NextResponse.json({
      success: true,
      summary: summaryRows,
      recentFraudFlags: fraudRows,
      realtime: {
        drop1QueueLength: queueLength,
        drop1RedisStock: liveRedisStock !== null ? parseInt(liveRedisStock, 10) : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
