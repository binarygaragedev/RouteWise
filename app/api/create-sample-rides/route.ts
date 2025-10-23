// API to create sample ride requests for testing driver functionality
import { createAdminClient } from '@/lib/rideshare-db';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Create a sample passenger first
    const samplePassenger = {
      auth0_id: 'sample-passenger-' + Date.now(),
      email: 'sample.passenger@routewise.ai',
      name: 'Sample Passenger',
      user_type: 'passenger' as const
    };
    
    const { data: passenger, error: passengerError } = await supabaseAdmin
      .from('users')
      .insert([samplePassenger])
      .select()
      .single();
    
    if (passengerError) throw passengerError;
    
    // Create multiple sample ride requests
    const sampleRides = [
      {
        passenger_id: passenger.id,
        pickup_address: 'Times Square, New York',
        pickup_latitude: 40.7580,
        pickup_longitude: -73.9855,
        destination_address: 'Central Park, New York',
        destination_latitude: 40.7812,
        destination_longitude: -73.9665,
        estimated_distance: 2.1,
        estimated_duration: 8,
        estimated_fare: 15.50,
        status: 'searching',
        safety_score: 100
      },
      {
        passenger_id: passenger.id,
        pickup_address: 'Brooklyn Bridge, New York',
        pickup_latitude: 40.7061,
        pickup_longitude: -73.9969,
        destination_address: 'Wall Street, New York',
        destination_latitude: 40.7074,
        destination_longitude: -74.0113,
        estimated_distance: 1.8,
        estimated_duration: 6,
        estimated_fare: 12.25,
        status: 'searching',
        safety_score: 100
      },
      {
        passenger_id: passenger.id,
        pickup_address: 'Empire State Building, New York',
        pickup_latitude: 40.7484,
        pickup_longitude: -73.9857,
        destination_address: 'LaGuardia Airport, New York',
        destination_latitude: 40.7769,
        destination_longitude: -73.8740,
        estimated_distance: 12.5,
        estimated_duration: 25,
        estimated_fare: 35.75,
        status: 'searching',
        safety_score: 100
      }
    ];
    
    const { data: rides, error: ridesError } = await supabaseAdmin
      .from('rides')
      .insert(sampleRides.map(ride => ({
        ...ride,
        requested_at: new Date().toISOString()
      })))
      .select();
    
    if (ridesError) throw ridesError;
    
    return NextResponse.json({
      success: true,
      message: `Created ${rides.length} sample ride requests for driver testing`,
      data: {
        passengerId: passenger.id,
        ridesCreated: rides.length,
        rides: rides.map(r => ({
          id: r.id,
          from: r.pickup_address,
          to: r.destination_address,
          fare: r.estimated_fare
        }))
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create sample rides',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Sample Ride Creator',
    instruction: 'Send POST request to create sample ride requests for driver testing'
  });
}