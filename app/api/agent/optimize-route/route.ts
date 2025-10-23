// API endpoint for Route Optimization Agent
import { NextRequest, NextResponse } from 'next/server';
import { RouteOptimizationAgent } from '@/agents/RouteOptimizationAgent';

export async function POST(request: NextRequest) {
  try {
    const { pickup, destination, rideId } = await request.json();
    
    if (!pickup || !destination) {
      return NextResponse.json({
        error: 'Pickup and destination are required'
      }, { status: 400 });
    }

    console.log('🗺️ [AUTH0 AI AGENTS] Route Optimization Agent - Real AI with security controls');
    console.log('\n🚀 API: Route optimization request received');
    console.log(`   Ride ID: ${rideId || 'New ride'}`);
    console.log(`   From: ${pickup.address}`);
    console.log(`   To: ${destination.address}`);

    const agent = new RouteOptimizationAgent();
    const result = await agent.execute({
      pickup,
      destination,
      rideId
    });

    if (result.success) {
      console.log('\n✅ Route optimization completed successfully');
      console.log(`📊 Time saved: ${result.data.estimatedSavings.time} minutes`);
      console.log(`⚡ Fuel saved: ${result.data.estimatedSavings.fuel}%`);
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Route optimization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}