import { NextResponse } from 'next/server';
import { testFlexibeeConnection } from '@/lib/flexibee';

export async function POST() {
  try {
    await testFlexibeeConnection();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Test zlyhal.' },
      { status: 500 }
    );
  }
}
