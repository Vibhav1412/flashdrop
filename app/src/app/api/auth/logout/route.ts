import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/flashdrop_session=([a-f0-9]+)/);
    const token = match ? match[1] : null;

    if (token) {
      await redis.del(`session:${token}`);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('flashdrop_session', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
