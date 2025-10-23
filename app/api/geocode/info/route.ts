import { NextRequest, NextResponse } from 'next/server';
import { GeocodingManager } from '@/lib/geocoding-manager';

// Get information about available geocoding providers
export async function GET(request: NextRequest) {
  try {
    const providerInfo = GeocodingManager.getProviderInfo();
    const config = GeocodingManager.getConfig();
    
    return NextResponse.json({
      success: true,
      config: {
        currentProvider: config.provider,
        hasGoogleMapsKey: !!config.googleMapsApiKey,
        fallbackToMock: config.fallbackToMock
      },
      providers: providerInfo,
      capabilities: {
        reverseGeocoding: true,
        forwardGeocoding: true,
        autocomplete: true,
        realTimeSearch: config.provider !== 'mock'
      }
    });
  } catch (error) {
    console.error('Error getting geocoding info:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get geocoding information'
    }, { status: 500 });
  }
}