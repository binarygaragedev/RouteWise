// Geocoding Configuration
// Switch between different geocoding providers easily

import { RealGeocodingService } from './real-geocoding';
import { FreeGeocodingService } from './free-geocoding';

export type GeocodingProvider = 'google' | 'nominatim' | 'mock';

export interface GeocodingConfig {
  provider: GeocodingProvider;
  googleMapsApiKey?: string;
  mapboxAccessToken?: string;
  fallbackToMock: boolean;
}

export class GeocodingManager {
  private static config: GeocodingConfig = {
    provider: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'google' : 'nominatim',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    fallbackToMock: true
  };

  static setConfig(config: Partial<GeocodingConfig>) {
    this.config = { ...this.config, ...config };
  }

  static getConfig(): GeocodingConfig {
    return this.config;
  }

  /**
   * Reverse geocoding with automatic provider selection
   */
  static async reverseGeocode(lat: number, lng: number) {
    console.log(`🌍 Reverse geocoding with provider: ${this.config.provider}`);
    
    try {
      switch (this.config.provider) {
        case 'google':
          if (this.config.googleMapsApiKey) {
            try {
              const result = await RealGeocodingService.reverseGeocode(lat, lng);
              console.log(`🌍 Google Maps result: ${result.address}`);
              return result;
            } catch (error) {
              console.log(`❌ Google Maps failed, trying Nominatim...`);
              // Fall through to nominatim
            }
          }
          // Fall through to nominatim if no API key or Google failed
          
        case 'nominatim':
          const result = await FreeGeocodingService.reverseGeocode(lat, lng);
          console.log(`🌍 Reverse geocoding (${lat}, ${lng}) → ${result.address} [${result.provider}]`);
          return result;
          
        case 'mock':
          return this.mockReverseGeocode(lat, lng);
          
        default:
          throw new Error(`Unknown provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('All geocoding providers failed:', error);
      
      if (this.config.fallbackToMock) {
        console.log('🔄 Using final mock fallback...');
        return this.mockReverseGeocode(lat, lng);
      }
      
      throw error;
    }
  }

  /**
   * Forward geocoding with automatic provider selection
   */
  static async forwardGeocode(address: string) {
    console.log(`🔍 Forward geocoding "${address}" with provider: ${this.config.provider}`);
    
    try {
      switch (this.config.provider) {
        case 'google':
          if (this.config.googleMapsApiKey) {
            try {
              const result = await RealGeocodingService.forwardGeocode(address);
              console.log(`🌍 Google Maps result: ${result.address}`);
              return result;
            } catch (error) {
              console.log(`❌ Google Maps failed, trying Nominatim...`);
              // Fall through to nominatim
            }
          }
          // Fall through to nominatim if no API key
          
        case 'nominatim':
          const result = await FreeGeocodingService.forwardGeocode(address);
          console.log(`🔍 Forward geocoding "${address}" → ${result.address} [${result.provider}]`);
          return result;
          
        case 'mock':
          return this.mockForwardGeocode(address);
          
        default:
          throw new Error(`Unknown provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('All forward geocoding providers failed:', error);
      
      if (this.config.fallbackToMock) {
        console.log('🔄 Using final mock fallback...');
        return this.mockForwardGeocode(address);
      }
      
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  static async getAutocompleteSuggestions(query: string): Promise<string[]> {
    try {
      switch (this.config.provider) {
        case 'nominatim':
          return await FreeGeocodingService.autocompleteNominatim(query);
          
        case 'google':
          // Google autocomplete would go here
          const result = await this.forwardGeocode(query);
          return result.suggestions || [];
          
        case 'mock':
        default:
          return this.mockAutocompleteSuggestions(query);
      }
    } catch (error) {
      console.error('Autocomplete failed:', error);
      return this.mockAutocompleteSuggestions(query);
    }
  }

  /**
   * Mock geocoding methods (fallback)
   */
  private static async mockReverseGeocode(lat: number, lng: number) {
    // Poland area
    if (lat >= 49.5 && lat <= 50.5 && lng >= 19.0 && lng <= 21.0) {
      const address = 'ul. Floriańska 12, 31-021 Kraków, Poland';
      return {
        address,
        formatted_address: address,
        coordinates: { lat, lng },
        found: true,
        provider: 'mock' as const
      };
    }
    
    const address = `Mock Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    return {
      address,
      formatted_address: address,
      coordinates: { lat, lng },
      found: true,
      provider: 'mock' as const
    };
  }

  private static async mockForwardGeocode(address: string) {
    return {
      address: `Mock: ${address}`,
      formatted_address: `Mock: ${address}`,
      coordinates: { lat: 50.0647, lng: 19.9450 },
      suggestions: [
        `${address} Street`,
        `${address} Avenue`,
        `${address} Plaza`
      ],
      found: true,
      provider: 'mock' as const
    };
  }

  private static mockAutocompleteSuggestions(query: string): string[] {
    return [
      `${query} Street`,
      `${query} Avenue`,
      `${query} Plaza`
    ];
  }

  /**
   * Get provider status and info
   */
  static getProviderInfo() {
    const info = {
      currentProvider: this.config.provider,
      availableProviders: [] as string[],
      recommendations: [] as string[]
    };

    // Check what's available
    if (this.config.googleMapsApiKey) {
      info.availableProviders.push('google (API key found)');
      info.recommendations.push('Google Maps: Most accurate, has usage limits');
    }
    
    info.availableProviders.push('nominatim (free OpenStreetMap)');
    info.recommendations.push('Nominatim: Free, good coverage, no API key needed');
    
    info.availableProviders.push('mock (fallback)');

    return info;
  }
}