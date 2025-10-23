// API endpoint for user creation with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.auth0_id || !userData.email || !userData.name) {
      return NextResponse.json({
        error: 'Missing required fields: auth0_id, email, name'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    // First, try to get existing user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth0_id', userData.auth0_id)
      .single();
    
    if (existingUser) {
      // User already exists, return the existing user
      console.log('User already exists, returning existing user:', existingUser.id);
      return NextResponse.json(existingUser);
    }
    
    // Create new user with admin privileges (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === '23505') {
        // Try to fetch the user again in case of race condition
        const { data: userAfterError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('auth0_id', userData.auth0_id)
          .single();
        
        if (userAfterError) {
          return NextResponse.json(userAfterError);
        }
      }
      
      console.error('User creation error:', error);
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