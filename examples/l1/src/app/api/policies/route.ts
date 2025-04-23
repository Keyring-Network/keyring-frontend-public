import keyringClient from '@/services/keyring';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '100');

    const policies = await keyringClient.getPolicies(page, pageSize);
    return NextResponse.json(policies);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.detail || 'Failed to fetch policies' },
      { status: error.response?.status || 500 }
    );
  }
}
