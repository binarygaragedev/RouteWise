import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { ridePreparationAgent } from '@/agents/RidePreparation';

/**
 * POST /api/agent/prepare-ride
 * Trigger the Ride Preparation Agent
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
    const { driverId, passengerId, rideId } = body;

    if (!driverId || !passengerId || !rideId) {
      return NextResponse.json(
        { error: 'Missing required fields: driverId, passengerId, rideId' },
        { status: 400 }
      );
    }

    // Verify user is either the driver or an admin
    const userAuth0Id = session.user.sub;
    if (userAuth0Id !== driverId && !session.user['https://routewise.app/roles']?.includes('admin')) {
      return NextResponse.json(
        { error: 'Forbidden: You can only prepare your own rides' },
        { status: 403 }
      );
    }

    console.log(`\n🚀 API: Prepare ride request received`);
    console.log(`   Driver: ${driverId}`);
    console.log(`   Passenger: ${passengerId}`);
    console.log(`   Ride: ${rideId}\n`);

    // Execute the agent
    const result = await ridePreparationAgent.execute(driverId, passengerId);

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