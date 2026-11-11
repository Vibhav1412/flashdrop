import { NextResponse } from 'next/server';
import { customerPool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '2';

  try {
    // 1. Fetch wallet balance
    const [walletRows]: any = await customerPool.query(
      `SELECT * FROM wallets WHERE user_id = ?`,
      [userId]
    );

    if (walletRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }

    const wallet = walletRows[0];

    // 2. Fetch double-entry ledger history
    const [ledgerRows]: any = await customerPool.query(
      `SELECT * FROM wallet_ledger WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 25`,
      [wallet.wallet_id]
    );

    return NextResponse.json({
      success: true,
      wallet,
      ledger: ledgerRows,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
