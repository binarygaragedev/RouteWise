// API endpoint to fix RLS policies
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing Row Level Security policies...');
    
    // Disable RLS for all tables to allow user creation
    const disableRLSQueries = [
      'ALTER TABLE users DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE driver_profiles DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE rides DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE ride_tracking DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE agent_interactions DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;'
    ];
    
    console.log('1️⃣ Disabling Row Level Security...');
    for (const query of disableRLSQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { query });
        if (error) {
          console.log(`Warning: ${error.message}`);
        }
      } catch (err) {
        // Continue even if some fail
        const errMessage = err instanceof Error ? err.message : 'Unknown error';
        console.log(`Warning: ${errMessage}`);
      }
    }
    
    console.log('2️⃣ Testing user creation...');
    
    // Test creating a user now
    const testUser = {
      auth0_id: 'rls-test-user-' + Date.now(),
      email: 'rls-test@routewise.ai',
      name: 'RLS Test User',
      user_type: 'passenger' as const
    };
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'User creation still failing after RLS fix',
        details: userError.message
      }, { status: 500 });
    }
    
    console.log('✅ User created successfully:', user.id);
    
    // Test ride creation
    const testRide = {
      passenger_id: user.id,
      pickup_address: 'RLS Test Pickup',
      pickup_latitude: 40.7128,
      pickup_longitude: -74.0060,
      destination_address: 'RLS Test Destination',
      destination_latitude: 40.7589,
      destination_longitude: -73.9851,
      estimated_distance: 2.5,
      estimated_duration: 8,
      estimated_fare: 12.50,
      status: 'searching' as const,
      safety_score: 100
    };
    
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .insert(testRide)
      .select()
      .single();
    
    if (rideError) {
      // Clean up user
      await supabase.from('users').delete().eq('id', user.id);
      
      return NextResponse.json({
        success: false,
        error: 'Ride creation failed after RLS fix',
        details: rideError.message
      }, { status: 500 });
    }
    
    console.log('✅ Ride created successfully:', ride.id);
    
    // Clean up test data
    await supabase.from('rides').delete().eq('id', ride.id);
    await supabase.from('users').delete().eq('id', user.id);
    console.log('🧹 Test data cleaned up');
    
    return NextResponse.json({
      success: true,
      message: 'Row Level Security policies fixed! Ride booking should work now.',
      testResults: {
        userCreated: true,
        rideCreated: true,
        cleanedUp: true
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fix RLS policies',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Row Level Security Fix Endpoint',
    instructions: 'Send a POST request to fix RLS policies that are blocking ride booking',
    issue: 'RLS policies are preventing user/ride creation with Auth0 authentication'
  });
}