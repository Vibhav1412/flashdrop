import { NextResponse } from 'next/server';
import { acquireHold, releaseHold, getHoldTtl } from '@/lib/redis';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const dropId = params.id;

  try {
    const body = await request.json();
    const userId = body.userId || 2; // Default to demo customer (user 2)
    const ttlSeconds = body.ttlSeconds || 300; // 5-minute hold

    // Execute atomic Lua script
    const result = await acquireHold(dropId, userId, ttlSeconds);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        code: result.code,
        message: result.code === 'OUT_OF_STOCK' 
          ? 'Sorry, this drop has completely sold out!' 
          : 'You already hold an active reservation for this drop.',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      code: result.code,
      remainingStock: result.remainingStock,
      holdKey: result.holdKey,
      ttl: ttlSeconds,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const dropId = params.id;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '2';

  try {
    const result = await releaseHold(dropId, userId);
    return NextResponse.json({ success: result.success, code: result.code });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

