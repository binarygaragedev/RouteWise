// API endpoint to get user by Auth0 ID with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auth0Id = searchParams.get('auth0_id');
    
    if (!auth0Id) {
      return NextResponse.json({
        error: 'auth0_id parameter is required'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    // Get user with admin privileges (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth0_id', auth0Id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('User fetch error:', error);
      return NextResponse.json({
        error: error.message
      }, { status: 500 });
    }
    
    // Return null if user not found (PGRST116 is "no rows" error)
    return NextResponse.json(data || null);
    
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}