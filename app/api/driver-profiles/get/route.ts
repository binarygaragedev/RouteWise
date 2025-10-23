// API endpoint to get driver profile by user ID with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({
        error: 'user_id parameter is required'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    // Get driver profile with admin privileges (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('driver_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Driver profile fetch error:', error);
      return NextResponse.json({
        error: error.message
      }, { status: 500 });
    }
    
    // Return null if profile not found (PGRST116 is "no rows" error)
    return NextResponse.json(data || null);
    
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}