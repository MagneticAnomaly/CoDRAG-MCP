import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // MVP: Simulate success to unblock UI flow. 
    // Actual Lemon Squeezy integration will be added in v1.
    
    console.log(`[Mock] Recovering license for: ${email}`);

    return NextResponse.json({ 
      success: true, 
      message: 'If an order exists, a recovery email has been sent.' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
