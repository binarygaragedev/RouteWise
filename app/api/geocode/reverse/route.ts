import { NextRequest, NextResponse } from 'next/server';
import { GeocodingManager } from '@/lib/geocoding-manager';

// Smart geocoding using best available provider (Google Maps, Nominatim, or fallback)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const result = await GeocodingManager.reverseGeocode(lat, lng);
    
    // Add some debug info in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌍 Reverse geocoding (${lat}, ${lng}) → ${result.address} [${result.provider}]`);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return NextResponse.json({ 
      error: 'Geocoding failed',
      address: 'Unknown Location',
      formatted_address: 'Unknown Location',
      coordinates: { lat, lng },
      found: false,
      provider: 'error'
    }, { status: 500 });
  }
}