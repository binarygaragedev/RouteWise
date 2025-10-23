// API endpoint to test database operations directly
import { RideshareDB } from '@/lib/rideshare-db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing database operations via API...');
    
    // Test 1: Create a test user
    const testUser = {
      auth0_id: 'api-test-user-' + Date.now(),
      email: 'api-test@routewise.ai',
      name: 'API Test User',
      user_type: 'passenger' as const
    };
    
    console.log('Creating test user...');
    const user = await RideshareDB.createUser(testUser);
    console.log('✅ User created:', user.id);
    
    // Test 2: Create a test ride
    const testRide = {
      passenger_id: user.id,
      pickup_address: 'API Test Pickup',
      pickup_latitude: 40.7128,
      pickup_longitude: -74.0060,
      destination_address: 'API Test Destination',
      destination_latitude: 40.7589,
      destination_longitude: -73.9851,
      estimated_distance: 3.2,
      estimated_duration: 10,
      estimated_fare: 15.50,
      status: 'searching' as const,
      safety_score: 100
    };
    
    console.log('Creating test ride...');
    const ride = await RideshareDB.createRide(testRide);
    console.log('✅ Ride created:', ride.id);
    
    // Test 3: Query rides
    console.log('Querying rides...');
    const userRides = await RideshareDB.getRidesForUser(user.id);
    console.log('✅ Found rides:', userRides.length);
    
    // Clean up
    console.log('Cleaning up...');
    await RideshareDB.supabase.from('rides').delete().eq('id', ride.id);
    await RideshareDB.supabase.from('users').delete().eq('id', user.id);
    console.log('✅ Cleanup complete');
    
    return NextResponse.json({
      success: true,
      message: 'Database operations successful!',
      data: {
        userId: user.id,
        rideId: ride.id,
        ridesFound: userRides.length
      }
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to test database operations',
    instructions: 'Send a POST request to /api/test-db to run database tests'
  });
}