// Real Geocoding Service using Google Maps API
// This replaces the mock geocoding with actual Google Maps data

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface GeocodeResult {
  address: string;
  formatted_address: string;
  coordinates: { lat: number; lng: number };
  suggestions?: string[];
  found: boolean;
  provider?: string;
}

export class RealGeocodingService {
  
  /**
   * Reverse Geocoding: Convert coordinates to address
   */
  static async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found, throwing error for fallback');
      throw new Error('Google Maps API key not configured');
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        
        return {
          address: result.formatted_address,
          formatted_address: result.formatted_address,
          coordinates: { lat, lng },
          found: true,
          provider: 'google'
        };
      } else {
        console.warn('Google Maps API error:', data.status);
        throw new Error(`Google Maps API error: ${data.status}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error; // Re-throw to allow fallback to Nominatim
    }
  }

  /**
   * Forward Geocoding: Convert address to coordinates + suggestions
   */
  static async forwardGeocode(address: string): Promise<GeocodeResult> {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found, throwing error for fallback');
      throw new Error('Google Maps API key not configured');
    }

    try {
      // Use Google Places Autocomplete for suggestions
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const autocompleteResponse = await fetch(autocompleteUrl);
      const autocompleteData = await autocompleteResponse.json();

      let suggestions: string[] = [];
      if (autocompleteData.status === 'OK') {
        suggestions = autocompleteData.predictions
          .slice(0, 5)
          .map((prediction: any) => prediction.description);
      }

      // Get coordinates for the first suggestion or the input address
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
        const result = geocodeData.results[0];
        const location = result.geometry.location;
        
        return {
          address: result.formatted_address,
          formatted_address: result.formatted_address,
          coordinates: { lat: location.lat, lng: location.lng },
          suggestions,
          found: true,
          provider: 'google'
        };
      } else {
        console.warn('Google Maps geocoding error:', geocodeData.status);
        throw new Error(`Google Maps API error: ${geocodeData.status}`);
      }
    } catch (error) {
      console.error('Forward geocoding error:', error);
      throw error; // Re-throw to allow fallback to Nominatim
    }
  }

  /**
   * Fallback reverse geocoding for when Google Maps API fails
   */
  private static fallbackReverseGeocode(lat: number, lng: number): GeocodeResult {
    // Poland area (Southern Poland including Kraków region)
    if (lat >= 49.5 && lat <= 50.5 && lng >= 19.0 && lng <= 21.0) {
      const polandAddresses = [
        'ul. Floriańska 12, 31-021 Kraków, Poland',
        'ul. Grodzka 25, 31-001 Kraków, Poland',
        'ul. Szewska 8, 31-009 Kraków, Poland',
        'ul. Starowiślna 17, 31-038 Kraków, Poland',
        'Rynek Główny 1, 31-042 Kraków, Poland'
      ];
      const address = polandAddresses[Math.floor(Math.random() * polandAddresses.length)];
      return {
        address,
        formatted_address: address,
        coordinates: { lat, lng },
        found: true,
        provider: 'fallback'
      };
    }
    
    // NYC area
    if (lat >= 40.4 && lat <= 41.0 && lng >= -74.5 && lng <= -73.5) {
      const address = '123 Broadway, New York, NY 10013, USA';
      return {
        address,
        formatted_address: address,
        coordinates: { lat, lng },
        found: true,
        provider: 'fallback'
      };
    }

    // Generic fallback
    const address = `${Math.floor(Math.random() * 999 + 1)} Main St, City Center`;
    return {
      address,
      formatted_address: address,
      coordinates: { lat, lng },
      found: true,
      provider: 'fallback'
    };
  }

  /**
   * Fallback forward geocoding for when Google Maps API fails
   */
  private static fallbackForwardGeocode(address: string): GeocodeResult {
    const lowerAddress = address.toLowerCase();
    
    // Polish cities
    if (lowerAddress.includes('krakow') || lowerAddress.includes('cracow')) {
      return {
        address: 'Kraków, Poland',
        formatted_address: 'Kraków, Poland',
        coordinates: { lat: 50.0647, lng: 19.9450 },
        suggestions: [
          'ul. Floriańska, Kraków, Poland',
          'Rynek Główny, Kraków, Poland',
          'ul. Grodzka, Kraków, Poland'
        ],
        found: true,
        provider: 'fallback'
      };
    }

    if (lowerAddress.includes('warsaw')) {
      return {
        address: 'Warsaw, Poland',
        formatted_address: 'Warsaw, Poland',
        coordinates: { lat: 52.2297, lng: 21.0122 },
        suggestions: [
          'ul. Marszałkowska, Warsaw, Poland',
          'Palace of Culture, Warsaw, Poland',
          'Old Town, Warsaw, Poland'
        ],
        found: true,
        provider: 'fallback'
      };
    }

    // Generic suggestions
    const capitalizedAddress = address.charAt(0).toUpperCase() + address.slice(1);
    return {
      address: `${capitalizedAddress}, City`,
      formatted_address: `${capitalizedAddress}, City`,
      coordinates: { lat: 49.8 + Math.random() * 0.4, lng: 19.5 + Math.random() * 0.8 },
      suggestions: [
        `${capitalizedAddress} Street`,
        `${capitalizedAddress} Avenue`,
        `${capitalizedAddress} Plaza`
      ],
      found: true,
      provider: 'fallback'
    };
  }
}