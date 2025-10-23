// API endpoint for Passenger Experience Agent
import { NextRequest, NextResponse } from 'next/server';
import { PassengerExperienceAgent } from '@/agents/PassengerExperienceAgent';

export async function POST(request: NextRequest) {
  try {
    const { 
      rideId, 
      passengerId, 
      driverId, 
      rideStatus, 
      pickup,
      destination 
    } = await request.json();
    
    if (!rideId || !passengerId) {
      return NextResponse.json({
        error: 'Ride ID and passenger ID are required'
      }, { status: 400 });
    }

    console.log('🎭 [AUTH0 AI AGENTS] Passenger Experience Agent - Personalized AI with security');
    console.log('\n🌟 API: Passenger experience request received');
    console.log(`   Ride ID: ${rideId}`);
    console.log(`   Passenger: ${passengerId}`);
    console.log(`   Status: ${rideStatus}`);

    const agent = new PassengerExperienceAgent();
    const result = await agent.execute({
      rideId,
      passengerId,
      driverId,
      rideStatus,
      pickup,
      destination
    });

    if (result.success) {
      console.log('\n✅ Passenger experience enhanced');
      console.log(`🎵 Music: ${result.data.entertainment.musicSuggestions[0]}`);
      console.log(`🌡️ Weather: ${result.data.convenience.weatherAtDestination}`);
      console.log(`📱 Safety: ${result.data.safetyFeatures.shareRideStatus}`);
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Passenger experience error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// GET endpoint for live updates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rideId = searchParams.get('rideId');
    
    if (!rideId) {
      return NextResponse.json({
        error: 'Ride ID is required'
      }, { status: 400 });
    }

    const agent = new PassengerExperienceAgent();
    const updates = await agent.provideLiveUpdates(rideId);

    return NextResponse.json({
      success: true,
      data: { updates }
    });
    
  } catch (error) {
    console.error('Live updates error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}