// API endpoint for getting a specific ride by ID with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rideId = searchParams.get('id');
    
    if (!rideId) {
      return NextResponse.json({
        error: 'Ride ID is required'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    // Get ride with admin privileges (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('rides')
      .select(`
        *,
        passenger:passenger_id (name, phone, profile_image),
        driver:driver_id (name, phone, profile_image)
      `)
      .eq('id', rideId)
      .single();
    
    if (error) {
      console.error('Get ride by ID error:', error);
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