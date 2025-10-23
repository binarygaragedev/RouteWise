import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { RidePreparationAgent } from '@/agents/RidePreparation';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pickup, destination, preferences } = await request.json();

    // Validate required fields
    if (!pickup || !destination) {
      return NextResponse.json({ 
        error: 'Pickup and destination are required' 
      }, { status: 400 });
    }

    // For demo mode, skip database operations
    if (!db) {
      console.log('🚧 Demo mode: Skipping database operations');
    }

    // Run AI agent for ride preparation
    const agent = new RidePreparationAgent();
    const result = await agent.execute(
      'system-driver', // System driver for preparation
      session.user.sub
    );

    return NextResponse.json({
      success: result.success,
      data: result.data,
      message: result.success ? "Ride prepared successfully!" : "Ride preparation failed"
    });

  } catch (error) {
    console.error('Ride preparation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}