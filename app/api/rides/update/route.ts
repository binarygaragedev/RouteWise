// API endpoint for updating ride status with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function PUT(request: NextRequest) {
  try {
    const { rideId, status, additionalData = {} } = await request.json();
    
    if (!rideId || !status) {
      return NextResponse.json({
        error: 'Ride ID and status are required'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    const updateData: any = { status, ...additionalData };
    
    // Set timestamps based on status
    if (status === 'accepted') updateData.accepted_at = new Date().toISOString();
    if (status === 'pickup') updateData.pickup_at = new Date().toISOString();
    if (status === 'completed') updateData.completed_at = new Date().toISOString();
    
    // Update ride with admin privileges (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('rides')
      .update(updateData)
      .eq('id', rideId)
      .select()
      .single();
    
    if (error) {
      console.error('Ride update error:', error);
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