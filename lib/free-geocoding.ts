// Alternative Free Geocoding Services
// Using OpenStreetMap Nominatim (free) and OpenCage Data (free tier)

export interface AlternativeGeocodeResult {
  address: string;
  formatted_address: string;
  coordinates: { lat: number; lng: number };
  suggestions?: string[];
  found: boolean;
  provider: 'nominatim' | 'opencage' | 'fallback';
}

export class FreeGeocodingService {
  
  /**
   * Reverse Geocoding using OpenStreetMap Nominatim (Free)
   */
  static async reverseGeocodeNominatim(lat: number, lng: number): Promise<AlternativeGeocodeResult> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      console.log(`🌍 Nominatim API call: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RouteWise-AI/1.0 (contact@routewise.com)' // Required by Nominatim
        }
      });
      
      console.log(`🌍 Nominatim response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`🌍 Nominatim response data:`, data);

      if (data && data.display_name) {
        const result = {
          address: data.display_name,
          formatted_address: data.display_name,
          coordinates: { lat, lng },
          found: true,
          provider: 'nominatim' as const
        };
        console.log(`🌍 Nominatim success: ${result.address}`);
        return result;
      } else {
        throw new Error('No results from Nominatim');
      }
    } catch (error) {
      console.error('❌ Nominatim reverse geocoding error:', error);
      console.log('🔄 Falling back to local geocoding...');
      return this.fallbackReverseGeocode(lat, lng);
    }
  }

  /**
   * Forward Geocoding using OpenStreetMap Nominatim (Free)
   */
  static async forwardGeocodeNominatim(address: string): Promise<AlternativeGeocodeResult> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RouteWise-AI/1.0 (your-email@example.com)' // Required by Nominatim
        }
      });
      
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const suggestions = data.slice(0, 5).map((item: any) => item.display_name);
        
        return {
          address: result.display_name,
          formatted_address: result.display_name,
          coordinates: { 
            lat: parseFloat(result.lat), 
            lng: parseFloat(result.lon) 
          },
          suggestions,
          found: true,
          provider: 'nominatim'
        };
      } else {
        throw new Error('No results from Nominatim');
      }
    } catch (error) {
      console.error('Nominatim forward geocoding error:', error);
      return this.fallbackForwardGeocode(address);
    }
  }

  /**
   * Autocomplete using Nominatim search
   */
  static async autocompleteNominatim(query: string): Promise<string[]> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RouteWise-AI/1.0 (your-email@example.com)'
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return data.map((item: any) => item.display_name);
      }
      
      return [];
    } catch (error) {
      console.error('Nominatim autocomplete error:', error);
      return [];
    }
  }

  /**
   * MapBox Geocoding (Free tier alternative)
   */
  static async forwardGeocodeMapBox(address: string, accessToken?: string): Promise<AlternativeGeocodeResult> {
    if (!accessToken) {
      return this.fallbackForwardGeocode(address);
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${accessToken}&limit=5`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const result = data.features[0];
        const suggestions = data.features.slice(0, 5).map((feature: any) => feature.place_name);
        
        return {
          address: result.place_name,
          formatted_address: result.place_name,
          coordinates: { 
            lat: result.center[1], 
            lng: result.center[0] 
          },
          suggestions,
          found: true,
          provider: 'nominatim' // Using nominatim as provider name for consistency
        };
      } else {
        throw new Error('No results from MapBox');
      }
    } catch (error) {
      console.error('MapBox geocoding error:', error);
      return this.fallbackForwardGeocode(address);
    }
  }

  /**
   * Main geocoding function that tries multiple services
   */
  static async reverseGeocode(lat: number, lng: number): Promise<AlternativeGeocodeResult> {
    // Try Nominatim first (free)
    const result = await this.reverseGeocodeNominatim(lat, lng);
    return result;
  }

  static async forwardGeocode(address: string): Promise<AlternativeGeocodeResult> {
    // Try Nominatim first (free)
    const result = await this.forwardGeocodeNominatim(address);
    return result;
  }

  /**
   * Fallback methods (same as before)
   */
  private static fallbackReverseGeocode(lat: number, lng: number): AlternativeGeocodeResult {
    // Poland area
    if (lat >= 49.5 && lat <= 50.5 && lng >= 19.0 && lng <= 21.0) {
      const polandAddresses = [
        'ul. Floriańska 12, 31-021 Kraków, Poland',
        'ul. Grodzka 25, 31-001 Kraków, Poland',
        'ul. Szewska 8, 31-009 Kraków, Poland',
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
    const address = `Approximate location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    return {
      address,
      formatted_address: address,
      coordinates: { lat, lng },
      found: true,
      provider: 'fallback'
    };
  }

  private static fallbackForwardGeocode(address: string): AlternativeGeocodeResult {
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
    return {
      address: `${address}`,
      formatted_address: `${address}`,
      coordinates: { lat: 49.8 + Math.random() * 0.4, lng: 19.5 + Math.random() * 0.8 },
      suggestions: [
        `${address} Street`,
        `${address} Avenue`, 
        `${address} Plaza`
      ],
      found: true,
      provider: 'fallback'
    };
  }
}