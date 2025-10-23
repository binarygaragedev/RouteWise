import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { RidePreparationAgent } from '@/agents/RidePreparation';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
    const { pickup, destination } = await request.json();

    // Test ride preparation agent with real OpenAI
    const agent = new RidePreparationAgent();
    const result = await agent.execute(
      'driver-123', // driverId
      session.user.sub // passengerId (authenticated user)
    );

    return NextResponse.json({
      success: true,
      result,
      message: "✅ AI Agent working with real OpenAI API!"
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}