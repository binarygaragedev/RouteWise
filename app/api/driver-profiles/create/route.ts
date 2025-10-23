// API endpoint for driver profile creation with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function POST(request: NextRequest) {
  try {
    const profileData = await request.json();
    
    // Validate required fields
    if (!profileData.user_id || !profileData.license_number || !profileData.vehicle_make) {
      return NextResponse.json({
        error: 'Missing required fields: user_id, license_number, vehicle_make'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    // Create driver profile with admin privileges (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('driver_profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (error) {
      console.error('Driver profile creation error:', error);
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