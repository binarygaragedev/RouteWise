import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { consentNegotiationAgent } from '@/agents/ConsentNegotiationAgent';

/**
 * POST /api/agent/negotiate-consent
 * Request additional consent from passenger
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { passengerId, dataCategory, reason } = body;

    if (!passengerId || !dataCategory) {
      return NextResponse.json(
        { error: 'Missing required fields: passengerId, dataCategory' },
        { status: 400 }
      );
    }

    const driverId = session.user.sub;

    console.log(`\n🤝 API: Consent negotiation request`);
    console.log(`   Driver: ${driverId}`);
    console.log(`   Requesting: ${dataCategory}\n`);

    // Execute the agent
    const result = await consentNegotiationAgent.execute({
      driverId,
      passengerId,
      dataCategory,
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
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
 * PATCH /api/agent/negotiate-consent
 * Passenger responds to consent request
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { driverId, dataCategory, approved, duration } = body;

    if (!driverId || !dataCategory || approved === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: driverId, dataCategory, approved' },
        { status: 400 }
      );
    }

    const passengerId = session.user.sub;

    console.log(`\n📨 API: Consent response`);
    console.log(`   Passenger: ${passengerId}`);
    console.log(`   Response: ${approved ? 'APPROVED' : 'DENIED'}\n`);

    // Process the response
    const result = await consentNegotiationAgent.processResponse(
      passengerId,
      driverId,
      dataCategory,
      approved,
      duration
    );

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}