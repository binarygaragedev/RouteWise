import { BaseAgent, AgentResult } from './BaseAgent';

export interface DriverGuidance {
  navigationTips: string[];
  passengerInsights: {
    preferredMusic: string;
    chattiness: 'chatty' | 'quiet' | 'neutral';
    specialRequests: string[];
    accessLevel: string;
    ratingSufficient: boolean;
  };
  safetyAlerts: string[];
  earnings: {
    currentRide: number;
    dailyTotal: number;
    efficiency: number;
  };
  weatherAdvisory: string;
  ragInfo?: {
    driverRating: number;
    accessGranted: string;
    hiddenPreferences: number;
  };
}

export class DriverAssistanceAgent extends BaseAgent {
  constructor() {
    super('Driver Assistance Agent', 'ride-preparation');
  }

  async execute(data: {
    rideId: string;
    driverId: string;
    passengerId: string;
    location: { lat: number; lng: number };
    rideStatus: string;
  }): Promise<AgentResult> {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👨‍💼 DRIVER ASSISTANCE AGENT ACTIVATED`);
      console.log(`Ride: ${data.rideId}`);
      console.log(`Status: ${data.rideStatus}`);
      console.log(`${'='.repeat(60)}\n`);

      await this.initialize(data.driverId);

      const guidance = await this.generateDriverGuidance(data);
      
      console.log(`✅ Driver assistance ready!`);
      console.log(`🎵 Music preference: ${guidance.passengerInsights.preferredMusic}`);
      console.log(`💰 Current ride value: $${guidance.earnings.currentRide}`);
      console.log(`🔒 RAG Access Level: ${guidance.ragInfo?.accessGranted}`);
      console.log(`⭐ Driver Rating: ${guidance.ragInfo?.driverRating}`);

      return {
        success: true,
        data: guidance,
        dataAccessed: ['rider-preferences', 'driver-profile', 'earnings-data'],
        securityCheck: {
          userAuthenticated: true,
          tokensRequested: ['driver-access', 'passenger-preferences'],
          permissionsGranted: ['ride-assistance', 'earnings-data'],
          dataSourcesAccessed: ['user-preferences', 'ride-database', 'weather-api']
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async generateDriverGuidance(data: {
    rideId: string;
    driverId: string;
    passengerId: string;
    location: { lat: number; lng: number };
    rideStatus: string;
  }): Promise<DriverGuidance> {
    
    if (this.isDemoMode) {
      console.log('🔄 [DEMO] Generating mock driver guidance with RAG...');
      return this.generateMockGuidance(data);
    }

    // In production, fetch real passenger preferences with RAG
    try {
      const driverRating = await this.getDriverRating(data.driverId);
      const passengerPrefs = await this.getPassengerPreferencesWithRAG(data.passengerId, driverRating);
      return this.generateGuidanceFromPreferences(data, passengerPrefs, driverRating);
    } catch (error) {
      console.error('Error fetching preferences, using mock data:', error);
      return this.generateMockGuidance(data);
    }
  }

  private async getDriverRating(driverId: string): Promise<number> {
    // In production, fetch from driver profile
    // For demo, return random rating
    return 4.0 + Math.random() * 1.0;
  }

  private async getPassengerPreferencesWithRAG(passengerId: string, driverRating: number): Promise<any> {
    try {
      const response = await fetch(`/api/passenger/preferences?passengerId=${passengerId}&driverRating=${driverRating}`);
      const result = await response.json();
      
      if (result.success) {
        console.log(`🔒 RAG Access: ${result.data.accessLevel.accessLevel} (Rating: ${driverRating})`);
        return result.data;
      }
      
      throw new Error('Failed to fetch preferences');
    } catch (error) {
      console.error('RAG preferences fetch error:', error);
      return null;
    }
  }

  private generateGuidanceFromPreferences(data: any, prefsData: any, driverRating: number): DriverGuidance {
    const prefs = prefsData?.filteredPreferences || {};
    const accessLevel = prefsData?.accessLevel || { accessLevel: 'minimal' };
    
    return {
      navigationTips: [
        '🛣️ Route optimized for passenger preferences',
        `🚦 ${prefs.route_preference || 'fastest'} route selected`
      ],
      passengerInsights: {
        preferredMusic: prefs.music_enabled ? (prefs.music_genre || 'No preference') : 'Music disabled',
        chattiness: prefs.communication_style || 'neutral',
        specialRequests: this.generateSpecialRequests(prefs),
        accessLevel: accessLevel.accessLevel,
        ratingSufficient: driverRating >= (prefs.min_driver_rating || 4.0)
      },
      safetyAlerts: this.generateSafetyAlerts(prefs),
      earnings: {
        currentRide: 8.50 + Math.random() * 10,
        dailyTotal: 125.75 + Math.random() * 200,
        efficiency: 85 + Math.random() * 15
      },
      weatherAdvisory: this.getWeatherAdvisory(),
      ragInfo: {
        driverRating: Math.round(driverRating * 10) / 10,
        accessGranted: accessLevel.accessLevel,
        hiddenPreferences: accessLevel.hiddenPreferences?.length || 0
      }
    };
  }

  private generateSpecialRequests(prefs: any): string[] {
    const requests: string[] = [];
    
    if (prefs.temperature_preference) {
      requests.push(`🌡️ Preferred temp: ${prefs.temperature_preference}°C`);
    }
    if (prefs.window_preference && prefs.window_preference !== 'no_preference') {
      requests.push(`🪟 Windows: ${prefs.window_preference}`);
    }
    if (prefs.phone_usage === 'silent') {
      requests.push(`📱 Silent ride preferred`);
    }
    if (prefs.accessibility_needs?.length > 0) {
      requests.push(`♿ Accessibility needs: ${prefs.accessibility_needs.join(', ')}`);
    }
    
    return requests;
  }

  private generateSafetyAlerts(prefs: any): string[] {
    const alerts: string[] = [];
    
    if (prefs.service_animal) {
      alerts.push('🐕‍🦺 Service animal on board');
    }
    if (prefs.medical_conditions?.length > 0) {
      alerts.push('⚕️ Medical considerations noted');
    }
    if (prefs.photo_verification) {
      alerts.push('📸 Photo verification required');
    }
    
    return alerts.length > 0 ? alerts : ['🛡️ Standard safety protocols active'];
  }

  private generateMockGuidance(data: {
    rideId: string;
    driverId: string;
    passengerId: string;
    location: { lat: number; lng: number };
    rideStatus: string;
  }): DriverGuidance {
    
    const musicPreferences = ['Pop hits', 'Jazz', 'Classical', 'No music', 'Driver\'s choice'];
    const chatStyles = ['chatty', 'quiet', 'neutral'] as const;
    
    const selectedMusic = musicPreferences[Math.floor(Math.random() * musicPreferences.length)];
    const selectedChatStyle = chatStyles[Math.floor(Math.random() * chatStyles.length)];
    
    const navigationTips = [
      '🛣️ Stay in right lane for next 0.5 miles',
      '🚦 Traffic light ahead - maintain steady speed',
      '🏗️ Construction zone in 1 mile - expect delays',
      '🚗 Merge carefully - heavy traffic reported'
    ];

    const safetyAlerts = [
      '⚠️ School zone ahead - reduce speed to 25 mph',
      '🌧️ Wet roads - increase following distance',
      '🚧 Lane closure reported 2 miles ahead'
    ];

    const specialRequests = [
      'Window slightly open for fresh air',
      'Quiet ride - important call expected',
      'Temperature at 72°F preferred'
    ];

    const currentRideValue = 15.50 + Math.random() * 20;
    const dailyTotal = 125.75 + Math.random() * 200;
    const efficiency = 85 + Math.random() * 15;

    // Simulate driver rating and RAG access control
    const driverRating = 4.0 + Math.random() * 1.0; // 4.0-5.0
    const accessLevel = driverRating >= 4.8 ? 'full' : driverRating >= 4.5 ? 'moderate' : driverRating >= 4.0 ? 'basic' : 'minimal';
    const ratingSufficient = driverRating >= 4.0;

    return {
      navigationTips: navigationTips.slice(0, 2),
      passengerInsights: {
        preferredMusic: selectedMusic,
        chattiness: selectedChatStyle,
        specialRequests: specialRequests.slice(0, Math.floor(Math.random() * 3) + 1),
        accessLevel: accessLevel,
        ratingSufficient: ratingSufficient
      },
      safetyAlerts: safetyAlerts.slice(0, Math.floor(Math.random() * 2) + 1),
      earnings: {
        currentRide: Math.round(currentRideValue * 100) / 100,
        dailyTotal: Math.round(dailyTotal * 100) / 100,
        efficiency: Math.round(efficiency * 10) / 10
      },
      weatherAdvisory: this.getWeatherAdvisory(),
      ragInfo: {
        driverRating: Math.round(driverRating * 10) / 10,
        accessGranted: accessLevel,
        hiddenPreferences: accessLevel === 'full' ? 0 : accessLevel === 'moderate' ? 2 : accessLevel === 'basic' ? 5 : 8
      }
    };
  }

  private getWeatherAdvisory(): string {
    const advisories = [
      '☀️ Clear skies - perfect driving conditions',
      '🌤️ Partly cloudy - good visibility',
      '🌧️ Light rain - use windshield wipers, reduce speed',
      '☁️ Overcast - normal driving conditions',
      '❄️ Snow flurries - drive carefully, winter conditions'
    ];
    
    return advisories[Math.floor(Math.random() * advisories.length)];
  }

  async provideLiveGuidance(rideId: string, currentLocation: { lat: number; lng: number }): Promise<string[]> {
    const liveGuidance = [
      '📱 Passenger just texted - running 2 minutes late',
      '🎵 Passenger requested music volume down',
      '🌡️ Passenger adjusted temperature to 70°F',
      '📍 Destination updated - proceeding to new location',
      '⭐ This passenger typically tips 20%',
      '🚗 Optimal parking spot available on the right'
    ];

    return liveGuidance.slice(0, Math.floor(Math.random() * 3) + 1);
  }
}