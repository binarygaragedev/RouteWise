// API endpoint for getting available rides with admin privileges
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/rideshare-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverLatitude = parseFloat(searchParams.get('lat') || '0');
    const driverLongitude = parseFloat(searchParams.get('lng') || '0');
    const radiusKm = parseFloat(searchParams.get('radius') || '20');
    
    if (!driverLatitude || !driverLongitude) {
      return NextResponse.json({
        error: 'Driver location (lat, lng) is required'
      }, { status: 400 });
    }
    
    // Create admin client on server side
    const supabaseAdmin = createAdminClient();
    
    // Get rides with admin privileges (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('rides')
      .select(`
        *,
        passenger:passenger_id (name, phone, profile_image)
      `)
      .in('status', ['requested', 'searching'])
      .order('requested_at', { ascending: true });
    
    if (error) {
      console.error('Get available rides error:', error);
      return NextResponse.json({
        error: error.message
      }, { status: 500 });
    }
    
    // Filter by distance from driver
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in kilometers
      const toRad = (degrees: number) => degrees * (Math.PI/180);
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const lat1Rad = toRad(lat1);
      const lat2Rad = toRad(lat2);

      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    const availableRides = data?.filter(ride => {
      const distance = calculateDistance(
        driverLatitude, driverLongitude,
        ride.pickup_latitude, ride.pickup_longitude
      );
      return distance <= radiusKm;
    }) || [];
    
    return NextResponse.json(availableRides);
    
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}