import keyringClient from '@/services/keyring';
import { NextRequest, NextResponse } from 'next/server';

export interface ValidateDataRequestBody {
  userId: string;
  policyId: string;
  data: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ValidateDataRequestBody;
    const { userId, policyId, data } = body;

    if (!userId || !policyId || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validationResult = await keyringClient.validateData(
      userId,
      policyId,
      data
    );
    return NextResponse.json(validationResult);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.detail || 'Failed to validate data' },
      { status: error.response?.status || 500 }
    );
  }
}
