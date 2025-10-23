// API endpoint for ride creation with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function POST(request: NextRequest) {
  try {
    const rideData = await request.json();
    
    // Validate required fields
    if (!rideData.passenger_id || !rideData.pickup_address || !rideData.destination_address) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    // Add timestamp and create ride with admin privileges (bypasses RLS)
    const rideWithTimestamp = {
      ...rideData,
      requested_at: new Date().toISOString()
    };
    
    const { data, error } = await supabaseAdmin
      .from('rides')
      .insert([rideWithTimestamp])
      .select()
      .single();
    
    if (error) {
      console.error('Ride creation error:', error);
      return NextResponse.json({
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}