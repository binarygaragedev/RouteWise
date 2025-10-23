// Passenger Preferences Database Schema and Management
import { createClient } from '@supabase/supabase-js';

export interface PassengerPreferences {
  id: string;
  passenger_id: string;
  // Music Preferences
  music_genre: string;
  music_volume: 'low' | 'medium' | 'high';
  music_enabled: boolean;
  // Communication Preferences
  communication_style: 'chatty' | 'quiet' | 'neutral';
  language_preference: string;
  small_talk: boolean;
  // Safety Preferences
  share_trip_status: boolean;
  emergency_contacts: string[];
  ride_recording: boolean;
  photo_verification: boolean;
  // Comfort Preferences
  temperature_preference: number; // Celsius
  window_preference: 'open' | 'closed' | 'no_preference';
  seat_adjustment: boolean;
  // Privacy Preferences
  phone_usage: 'allowed' | 'silent' | 'no_preference';
  personal_calls: boolean;
  // Special Needs
  accessibility_needs: string[];
  medical_conditions: string[];
  service_animal: boolean;
  // Trip Preferences
  route_preference: 'fastest' | 'scenic' | 'safest';
  stops_allowed: boolean;
  max_detour_time: number; // minutes
  // Driver Access Control (RAG)
  privacy_level: 'open' | 'selective' | 'minimal';
  min_driver_rating: number; // 1.0 - 5.0
  created_at: string;
  updated_at: string;
}

export interface DriverAccessLevel {
  rating: number;
  accessLevel: 'full' | 'moderate' | 'basic' | 'minimal';
  visiblePreferences: string[];
  hiddenPreferences: string[];
}

export class PassengerPreferencesDB {
  // In-memory storage for demo purposes if database fails
  private static mockStorage: Map<string, PassengerPreferences> = new Map();
  
  private static getClient() {
    // Use the same pattern as other DB operations in the project
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key';
    
    try {
      return createClient(supabaseUrl, supabaseServiceKey);
    } catch (error) {
      console.warn('Supabase client creation failed, using mock storage');
      return null;
    }
  }

  // Get passenger preferences
  static async getPreferences(passengerId: string): Promise<PassengerPreferences | null> {
    try {
      const supabase = this.getClient();
      
      if (!supabase) {
        // Fallback to mock storage
        return this.mockStorage.get(passengerId) || null;
      }
      
      const { data, error } = await supabase
        .from('passenger_preferences')
        .select('*')
        .eq('passenger_id', passengerId)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        // Fallback to mock storage
        return this.mockStorage.get(passengerId) || null;
      }

      return data;
    } catch (error) {
      console.error('Database error:', error);
      // Fallback to mock storage
      return this.mockStorage.get(passengerId) || null;
    }
  }

  // Create or update passenger preferences
  static async updatePreferences(
    passengerId: string, 
    preferences: Partial<PassengerPreferences>
  ): Promise<boolean> {
    try {
      const supabase = this.getClient();
      
      if (!supabase) {
        // Fallback to mock storage
        const existingPrefs = this.mockStorage.get(passengerId);
        const defaultPrefs = this.getDefaultPreferences(passengerId);
        const data = {
          ...defaultPrefs,
          ...existingPrefs,
          ...preferences,
          id: existingPrefs?.id || `mock_${passengerId}`,
          passenger_id: passengerId,
          updated_at: new Date().toISOString()
        };
        this.mockStorage.set(passengerId, data);
        console.log('✅ Preferences saved to mock storage');
        return true;
      }
      
      const existingPrefs = await this.getPreferences(passengerId);
      
      const data = {
        passenger_id: passengerId,
        ...preferences,
        updated_at: new Date().toISOString(),
        ...(existingPrefs ? {} : { created_at: new Date().toISOString() })
      };

      const { error } = await supabase
        .from('passenger_preferences')
        .upsert(data);

      if (error) {
        console.error('Error updating preferences:', error);
        // Fallback to mock storage
        const existingPrefs = this.mockStorage.get(passengerId);
        const defaultPrefs = this.getDefaultPreferences(passengerId);
        const data = {
          ...defaultPrefs,
          ...existingPrefs,
          ...preferences,
          id: existingPrefs?.id || `mock_${passengerId}`,
          passenger_id: passengerId,
          updated_at: new Date().toISOString()
        };
        this.mockStorage.set(passengerId, data);
        console.log('✅ Preferences saved to mock storage (DB fallback)');
        return true;
      }

      console.log('✅ Preferences saved to database');
      return true;
    } catch (error) {
      console.error('Database error:', error);
      // Final fallback to mock storage
      const existingPrefs = this.mockStorage.get(passengerId);
      const defaultPrefs = this.getDefaultPreferences(passengerId);
      const data = {
        ...defaultPrefs,
        ...existingPrefs,
        ...preferences,
        id: existingPrefs?.id || `mock_${passengerId}`,
        passenger_id: passengerId,
        updated_at: new Date().toISOString()
      };
      this.mockStorage.set(passengerId, data);
      console.log('✅ Preferences saved to mock storage (error fallback)');
      return true;
    }
  }

  // RAG: Get filtered preferences based on driver rating
  static getFilteredPreferences(
    preferences: PassengerPreferences,
    driverRating: number
  ): Partial<PassengerPreferences> {
    const accessLevel = this.getDriverAccessLevel(driverRating, preferences.min_driver_rating);
    
    switch (accessLevel.accessLevel) {
      case 'full': // 4.8+ rating
        return {
          ...preferences,
          // Full access to all preferences
        };
        
      case 'moderate': // 4.5+ rating
        return {
          music_genre: preferences.music_genre,
          music_enabled: preferences.music_enabled,
          communication_style: preferences.communication_style,
          small_talk: preferences.small_talk,
          temperature_preference: preferences.temperature_preference,
          route_preference: preferences.route_preference,
          phone_usage: preferences.phone_usage,
          // Hide sensitive preferences
          emergency_contacts: [],
          medical_conditions: [],
          accessibility_needs: []
        };
        
      case 'basic': // 4.0+ rating
        return {
          music_enabled: preferences.music_enabled,
          communication_style: preferences.communication_style,
          temperature_preference: preferences.temperature_preference,
          phone_usage: preferences.phone_usage,
          // Very limited access
        };
        
      case 'minimal': // Below 4.0 rating
        return {
          communication_style: 'neutral',
          music_enabled: false,
          phone_usage: 'no_preference',
          // Minimal access only
        };
        
      default:
        return {};
    }
  }

  // Determine driver access level based on rating
  static getDriverAccessLevel(driverRating: number, minRequired: number): DriverAccessLevel {
    // Check if driver meets minimum requirement
    if (driverRating < minRequired) {
      return {
        rating: driverRating,
        accessLevel: 'minimal',
        visiblePreferences: ['communication_style'],
        hiddenPreferences: ['emergency_contacts', 'medical_conditions', 'accessibility_needs']
      };
    }

    if (driverRating >= 4.8) {
      return {
        rating: driverRating,
        accessLevel: 'full',
        visiblePreferences: ['all'],
        hiddenPreferences: []
      };
    } else if (driverRating >= 4.5) {
      return {
        rating: driverRating,
        accessLevel: 'moderate',
        visiblePreferences: [
          'music_genre', 'music_enabled', 'communication_style', 
          'temperature_preference', 'route_preference'
        ],
        hiddenPreferences: ['emergency_contacts', 'medical_conditions']
      };
    } else if (driverRating >= 4.0) {
      return {
        rating: driverRating,
        accessLevel: 'basic',
        visiblePreferences: [
          'music_enabled', 'communication_style', 'temperature_preference'
        ],
        hiddenPreferences: [
          'emergency_contacts', 'medical_conditions', 'accessibility_needs',
          'music_genre', 'route_preference'
        ]
      };
    } else {
      return {
        rating: driverRating,
        accessLevel: 'minimal',
        visiblePreferences: ['communication_style'],
        hiddenPreferences: ['all_except_basic_communication']
      };
    }
  }

  // Get access level description for UI
  static getAccessLevelDescription(accessLevel: string): string {
    switch (accessLevel) {
      case 'full':
        return '🌟 Full Access - Driver can see all your preferences';
      case 'moderate':
        return '⭐ Moderate Access - Driver sees comfort & music preferences';
      case 'basic':
        return '🔹 Basic Access - Driver sees essential preferences only';
      case 'minimal':
        return '🔒 Minimal Access - Driver sees communication style only';
      default:
        return '❓ Unknown access level';
    }
  }

  // Create default preferences for new passengers
  static getDefaultPreferences(passengerId: string): PassengerPreferences {
    return {
      id: '',
      passenger_id: passengerId,
      // Music Preferences
      music_genre: 'pop',
      music_volume: 'medium',
      music_enabled: true,
      // Communication Preferences
      communication_style: 'neutral',
      language_preference: 'english',
      small_talk: true,
      // Safety Preferences
      share_trip_status: true,
      emergency_contacts: [],
      ride_recording: true,
      photo_verification: true,
      // Comfort Preferences
      temperature_preference: 22, // 72°F
      window_preference: 'no_preference',
      seat_adjustment: false,
      // Privacy Preferences
      phone_usage: 'no_preference',
      personal_calls: true,
      // Special Needs
      accessibility_needs: [],
      medical_conditions: [],
      service_animal: false,
      // Trip Preferences
      route_preference: 'fastest',
      stops_allowed: false,
      max_detour_time: 5,
      // Driver Access Control (RAG)
      privacy_level: 'selective',
      min_driver_rating: 4.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}