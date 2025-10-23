// Test endpoint to verify cancel ride functionality
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const supabaseAdmin = createAdminClient();
    
    if (action === 'create_test_ride') {
      // Create a test ride that can be cancelled
      const testRide = {
        passenger_id: 'test-passenger-123',
        driver_id: 'test-driver-456',
        pickup_address: 'Test Pickup Location',
        pickup_latitude: 40.7128,
        pickup_longitude: -74.0060,
        destination_address: 'Test Destination',
        destination_latitude: 40.7589,
        destination_longitude: -73.9851,
        estimated_distance: 5.0,
        estimated_duration: 15,
        estimated_fare: 20.00,
        status: 'accepted',
        safety_score: 100,
        requested_at: new Date().toISOString(),
        accepted_at: new Date().toISOString()
      };
      
      const { data, error } = await supabaseAdmin
        .from('rides')
        .insert([testRide])
        .select()
        .single();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Test ride created', 
        ride: data 
      });
    }
    
    if (action === 'test_cancel') {
      const { rideId } = await request.json();
      
      // Test cancelling a ride
      const { data, error } = await supabaseAdmin
        .from('rides')
        .update({ 
          status: 'cancelled',
          driver_id: null
        })
        .eq('id', rideId)
        .select()
        .single();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Ride cancelled successfully', 
        ride: data 
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Test cancel error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}