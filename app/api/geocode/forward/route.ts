import { NextRequest, NextResponse } from 'next/server';
import { GeocodingManager } from '@/lib/geocoding-manager';

// Smart geocoding using best available provider (Google Maps, Nominatim, or fallback)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  try {
    const result = await GeocodingManager.forwardGeocode(address);
    
    // Add some debug info in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Forward geocoding "${address}" → ${result.address} [${result.provider}]`);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Forward geocoding failed:', error);
    return NextResponse.json({ 
      error: 'Geocoding failed',
      coordinates: { lat: 0, lng: 0 },
      formatted_address: address,
      suggestions: [],
      found: false,
      provider: 'error'
    }, { status: 500 });
  }
}