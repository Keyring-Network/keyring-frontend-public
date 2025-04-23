import keyringClient from '@/services/keyring';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, proof, publicSignals, policyId } = body;

    if (!userId || !proof || !publicSignals || !policyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const response = await keyringClient.getBlindedSignature(userId, policyId, {
      proof,
      public_signals: publicSignals,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.response?.data?.detail || 'Failed to get blinded signature',
      },
      { status: error.response?.status || 500 }
    );
  }
}
