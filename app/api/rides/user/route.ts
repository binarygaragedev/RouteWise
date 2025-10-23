// API endpoint for getting rides for a specific user with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({
        error: 'User ID is required'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    // Build query with admin privileges (bypasses RLS)
    let query = supabaseAdmin
      .from('rides')
      .select(`
        *,
        passenger:passenger_id (name, phone, profile_image),
        driver:driver_id (name, phone, profile_image)
      `)
      .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
      .order('requested_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Get rides for user error:', error);
      return NextResponse.json({
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
    
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}