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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = Number(body.userId || 2);
    const amount = Number(body.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Deposit amount must be greater than zero.' },
        { status: 400 }
      );
    }

    const refId = `DEP-${Date.now()}`;
    await customerPool.query(
      `CALL sp_deposit_wallet(?, ?, ?)`,
      [userId, amount, refId]
    );

    // Fetch updated balance
    const [walletRows]: any = await customerPool.query(
      `SELECT * FROM wallets WHERE user_id = ?`,
      [userId]
    );

    const [ledgerRows]: any = await customerPool.query(
      `SELECT * FROM wallet_ledger WHERE wallet_id = ? ORDER BY created_at DESC LIMIT 25`,
      [walletRows[0].wallet_id]
    );

    return NextResponse.json({
      success: true,
      message: `Successfully deposited $${amount.toFixed(2)} into prepaid wallet.`,
      wallet: walletRows[0],
      ledger: ledgerRows,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


