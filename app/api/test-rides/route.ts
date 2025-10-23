// API endpoint to test ride functionality
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Get all rides with admin privileges
    const { data: rides, error: ridesError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (ridesError) {
      console.error('Error fetching rides:', ridesError);
      return NextResponse.json({ error: ridesError.message }, { status: 500 });
    }
    
    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    
    // Get all driver profiles
    const { data: driverProfiles, error: driversError } = await supabaseAdmin
      .from('driver_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (driversError) {
      console.error('Error fetching driver profiles:', driversError);
      return NextResponse.json({ error: driversError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'Database test successful',
      data: {
        rides: rides || [],
        users: users || [],
        driverProfiles: driverProfiles || []
      }
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}