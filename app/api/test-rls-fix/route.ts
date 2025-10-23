// Quick test API to verify RLS fix
import { RideshareDB } from '@/lib/rideshare-db';
import { createAdminClient } from '@/lib/rideshare-db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🧪 Testing RLS fix...');
    
    // Test user creation with admin client
    const testUser = {
      auth0_id: 'test-rls-fix-' + Date.now(),
      email: 'test-rls@routewise.ai',
      name: 'RLS Fix Test',
      user_type: 'passenger' as const
    };
    
    const user = await RideshareDB.createUser(testUser);
    console.log('✅ User created:', user.id);
    
    // Test ride creation with admin client
    const testRide = {
      passenger_id: user.id,
      pickup_address: 'Test Pickup Location',
      pickup_latitude: 40.7128,
      pickup_longitude: -74.0060,
      destination_address: 'Test Destination',
      destination_latitude: 40.7589,
      destination_longitude: -73.9851,
      estimated_distance: 3.5,
      estimated_duration: 12,
      estimated_fare: 18.50,
      status: 'searching' as const,
      safety_score: 100
    };
    
    const ride = await RideshareDB.createRide(testRide);
    console.log('✅ Ride created:', ride.id);
    
    // Clean up
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.from('rides').delete().eq('id', ride.id);
    await supabaseAdmin.from('users').delete().eq('id', user.id);
    console.log('🧹 Cleanup done');
    
    return NextResponse.json({
      success: true,
      message: '🎉 RLS fix successful! Ride booking should work now.',
      testData: {
        userCreated: user.id,
        rideCreated: ride.id
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: 'RLS fix test failed',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'RLS Fix Test Endpoint',
    instruction: 'Send POST request to test if Row Level Security issue is fixed'
  });
}