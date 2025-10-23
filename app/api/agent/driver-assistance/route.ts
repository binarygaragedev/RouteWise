// API endpoint for Driver Assistance Agent
import { NextRequest, NextResponse } from 'next/server';
import { DriverAssistanceAgent } from '@/agents/DriverAssistanceAgent';

export async function POST(request: NextRequest) {
  try {
    const { rideId, driverId, passengerId, location, rideStatus } = await request.json();
    
    if (!rideId || !driverId) {
      return NextResponse.json({
        error: 'Ride ID and driver ID are required'
      }, { status: 400 });
    }

    console.log('👨‍💼 [AUTH0 AI AGENTS] Driver Assistance Agent - Real AI with security controls');
    console.log('\n🚀 API: Driver assistance request received');
    console.log(`   Ride ID: ${rideId}`);
    console.log(`   Driver: ${driverId}`);
    console.log(`   Status: ${rideStatus}`);

    const agent = new DriverAssistanceAgent();
    const result = await agent.execute({
      rideId,
      driverId,
      passengerId,
      location,
      rideStatus
    });

    if (result.success) {
      console.log('\n✅ Driver assistance ready');
      console.log(`🎵 Music preference: ${result.data.passengerInsights.preferredMusic}`);
      console.log(`💰 Ride value: $${result.data.earnings.currentRide}`);
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Driver assistance error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// GET endpoint for live guidance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rideId = searchParams.get('rideId');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    
    if (!rideId) {
      return NextResponse.json({
        error: 'Ride ID is required'
      }, { status: 400 });
    }

    const agent = new DriverAssistanceAgent();
    const liveGuidance = await agent.provideLiveGuidance(rideId, { lat, lng });

    return NextResponse.json({
      success: true,
      data: { liveGuidance }
    });
    
  } catch (error) {
    console.error('Live guidance error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}