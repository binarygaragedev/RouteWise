// API endpoint for updating driver location and online status with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function PATCH(request: NextRequest) {
  try {
    const updateData = await request.json();
    const { userId, ...updates } = updateData;
    
    if (!userId) {
      return NextResponse.json({
        error: 'userId is required'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    // Update driver profile with admin privileges (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('driver_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Driver profile update error:', error);
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