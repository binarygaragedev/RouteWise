import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { RidePreparationAgent } from '@/agents/RidePreparation';

/**
 * POST /api/agent/prepare-ride
 * Trigger the Ride Preparation Agent for real rides
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { rideId, passengerId, driverId } = body;

    if (!rideId || !passengerId) {
      return NextResponse.json(
        { error: 'Missing required fields: rideId, passengerId' },
        { status: 400 }
      );
    }

    console.log(`\n🚀 API: Real ride preparation request received`);
    console.log(`   Ride ID: ${rideId}`);
    console.log(`   Passenger: ${passengerId}`);
    console.log(`   Driver: ${driverId || 'TBD'}\n`);

    // Execute the agent for real ride
    const agent = new RidePreparationAgent();
    const result = await agent.prepareRealRide(passengerId, driverId, rideId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      insights: result.data,
      metadata: {
        actionsToken: result.actionsToken,
        dataAccessed: result.dataAccessed,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/prepare-ride?rideId=xxx
 * Get cached ride insights
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rideId = searchParams.get('rideId');

    if (!rideId) {
      return NextResponse.json(
        { error: 'Missing rideId parameter' },
        { status: 400 }
      );
    }

    // In production: Fetch from database
    // const ride = await db.from('rides').select('ai_insights').eq('id', rideId).single();

    return NextResponse.json({
      success: true,
      insights: {
        summary: 'Cached insights would appear here',
        cached: true,
      },
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}