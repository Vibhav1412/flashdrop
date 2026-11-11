import { NextResponse } from 'next/server';
import { adminPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const attackerIp = '198.51.100.42';
    // Pick an active user to simulate compromise/bot usage
    const [activeUsers]: any = await adminPool.execute(
      "SELECT user_id, email FROM users WHERE status = 'active' AND user_id > 10 LIMIT 10"
    );

    const target = activeUsers[Math.floor(Math.random() * activeUsers.length)] || { user_id: 888, email: 'bot_victim@flashdrop.com' };

    // 1. Log burst rate-limited attempts
    for (let i = 0; i < 5; i++) {
      await adminPool.execute(
        `INSERT INTO purchase_attempts (user_id, drop_id, ip_address, user_agent, outcome)
         VALUES (?, 1, ?, 'Mozilla/5.0 HeadlessBot/2.4 (ConcurrencyContentionAttack)', 'RATE_LIMITED')`,
        [target.user_id, attackerIp]
      );
    }

    // 2. Insert into fraud_flags -> Fires trigger trg_auto_suspend_fraud_user
    const [flagRes]: any = await adminPool.execute(
      `INSERT INTO fraud_flags (user_id, reason, severity)
       VALUES (?, 'Redis Sliding-Window Rate Limiter tripped (>30 req/sec from bot IP)', 'critical')`,
      [target.user_id]
    );

    // 3. Verify that the MySQL trigger flipped user status to suspended
    const [userRows]: any = await adminPool.execute(
      'SELECT user_id, email, status FROM users WHERE user_id = ?',
      [target.user_id]
    );

    return NextResponse.json({
      success: true,
      attackerIp,
      targetUser: userRows[0],
      flagId: flagRes.insertId,
      message: `Bot burst attack intercepted! MySQL trigger automatically changed user status to: ${userRows[0]?.status.toUpperCase()}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

