import { BaseAgent, AgentResult } from './BaseAgent';

export interface PassengerExperience {
  personalizedGreeting: string;
  rideUpdates: {
    estimatedArrival: string;
    driverInfo: {
      name: string;
      rating: number;
      vehicleInfo: string;
      funFact: string;
    };
    routeInsights: string[];
  };
  entertainment: {
    musicSuggestions: string[];
    localTips: string[];
    newsHeadlines: string[];
  };
  convenience: {
    weatherAtDestination: string;
    nearbyServices: string[];
    bookmarkSuggestions: string[];
  };
  safetyFeatures: {
    shareRideStatus: string;
    emergencyContacts: string[];
    rideRecording: boolean;
  };
}

export class PassengerExperienceAgent extends BaseAgent {
  constructor() {
    super('Passenger Experience Agent', 'ride-preparation');
  }

  async execute(data: {
    rideId: string;
    passengerId: string;
    driverId: string;
    pickup: { lat: number; lng: number; address: string };
    destination: { lat: number; lng: number; address: string };
    rideStatus: string;
  }): Promise<AgentResult> {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🎭 PASSENGER EXPERIENCE AGENT ACTIVATED`);
      console.log(`Ride: ${data.rideId}`);
      console.log(`Enhancing passenger experience...`);
      console.log(`${'='.repeat(60)}\n`);

      await this.initialize(data.passengerId);

      const experience = await this.createPersonalizedExperience(data);
      
      console.log(`✅ Passenger experience personalized!`);
      console.log(`👋 Greeting: ${experience.personalizedGreeting}`);
      console.log(`🎵 Music: ${experience.entertainment.musicSuggestions[0]}`);

      return {
        success: true,
        data: experience,
        dataAccessed: ['passenger-profile', 'driver-profile', 'location-data'],
        securityCheck: {
          userAuthenticated: true,
          tokensRequested: ['passenger-access', 'location-services'],
          permissionsGranted: ['ride-enhancement', 'personalization'],
          dataSourcesAccessed: ['user-preferences', 'location-api', 'entertainment-service']
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async createPersonalizedExperience(data: {
    rideId: string;
    passengerId: string;
    driverId: string;
    pickup: { lat: number; lng: number; address: string };
    destination: { lat: number; lng: number; address: string };
    rideStatus: string;
  }): Promise<PassengerExperience> {
    
    if (this.isDemoMode) {
      console.log('🔄 [DEMO] Creating personalized passenger experience...');
      return this.generateMockExperience(data);
    }

    // Real implementation would use passenger history, preferences, etc.
    return this.generateMockExperience(data);
  }

  private generateMockExperience(data: {
    rideId: string;
    passengerId: string;
    driverId: string;
    pickup: { lat: number; lng: number; address: string };
    destination: { lat: number; lng: number; address: string };
    rideStatus: string;
  }): PassengerExperience {
    
    const timeOfDay = new Date().getHours();
    const greetings = {
      morning: "Good morning! Ready for a smooth ride to start your day? ☀️",
      afternoon: "Good afternoon! Hope you're having a great day! 🌤️",
      evening: "Good evening! Let's get you to your destination comfortably! 🌅",
      night: "Good evening! Safe travels tonight! 🌙"
    };

    let greeting = greetings.morning;
    if (timeOfDay >= 12 && timeOfDay < 17) greeting = greetings.afternoon;
    else if (timeOfDay >= 17 && timeOfDay < 21) greeting = greetings.evening;
    else if (timeOfDay >= 21 || timeOfDay < 6) greeting = greetings.night;

    const driverNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey'];
    const vehicles = ['Tesla Model 3', 'Toyota Camry', 'Honda Accord', 'Nissan Altima', 'BMW 3 Series'];
    const funFacts = [
      'Speaks 3 languages fluently',
      'Former chef with amazing restaurant recommendations',
      'Local history enthusiast with great stories',
      'Music producer who knows all the latest hits',
      'Travel blogger with tips from around the world'
    ];

    const selectedDriver = driverNames[Math.floor(Math.random() * driverNames.length)];
    const selectedVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
    const selectedFact = funFacts[Math.floor(Math.random() * funFacts.length)];

    const musicSuggestions = [
      '🎵 Chill Indie Playlist (based on your previous rides)',
      '🎶 Top 40 Hits (currently trending)',
      '🎼 Classical Focus Music (for productive rides)',
      '🎸 Acoustic Favorites (relaxing vibes)',
      '🎤 Podcast: "Tech Talks" (matches your interests)'
    ];

    const localTips = [
      '🍕 Amazing pizza place 2 blocks from your destination',
      '☕ New coffee shop with 5-star reviews nearby',
      '🏛️ Free museum exhibit this weekend in the area',
      '🎬 Movie theater showing latest releases around the corner',
      '🛍️ Weekend farmers market happening tomorrow'
    ];

    const newsHeadlines = [
      '📰 Local tech company announces major expansion',
      '🏀 Home team wins championship game last night',
      '🌤️ Beautiful weather expected for the weekend',
      '🚇 New subway line opening next month',
      '🎨 Art festival coming to downtown next week'
    ];

    const nearbyServices = [
      '🏥 Hospital: 0.5 miles from destination',
      '⛽ Gas station: 2 blocks away',
      '🏪 24/7 convenience store nearby',
      '🏧 ATM at your destination building',
      '🚗 Parking garage with hourly rates'
    ];

    return {
      personalizedGreeting: greeting,
      rideUpdates: {
        estimatedArrival: this.calculateArrivalTime(),
        driverInfo: {
          name: selectedDriver,
          rating: 4.8 + Math.random() * 0.2,
          vehicleInfo: selectedVehicle,
          funFact: selectedFact
        },
        routeInsights: [
          '🛣️ Taking the scenic route to avoid traffic',
          '⚡ Electric vehicle - eco-friendly ride!',
          '🎯 Optimal route selected for fastest arrival'
        ]
      },
      entertainment: {
        musicSuggestions: musicSuggestions.slice(0, 3),
        localTips: localTips.slice(0, 2),
        newsHeadlines: newsHeadlines.slice(0, 3)
      },
      convenience: {
        weatherAtDestination: this.getDestinationWeather(),
        nearbyServices: nearbyServices.slice(0, 3),
        bookmarkSuggestions: [
          '📍 Save this destination as "Work"?',
          '🏠 Add pickup location to favorites?'
        ]
      },
      safetyFeatures: {
        shareRideStatus: '✅ Ride status shared with emergency contact',
        emergencyContacts: ['Mom', 'Emergency Services'],
        rideRecording: true
      }
    };
  }

  private calculateArrivalTime(): string {
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + (15 + Math.random() * 20) * 60000); // 15-35 minutes
    return arrivalTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  private getDestinationWeather(): string {
    const conditions = [
      '☀️ Sunny, 72°F - perfect weather!',
      '🌤️ Partly cloudy, 68°F - nice and mild',
      '🌧️ Light rain, 65°F - umbrella recommended',
      '☁️ Overcast, 70°F - comfortable temperature',
      '❄️ Snow, 32°F - dress warmly!'
    ];
    
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  async provideLiveUpdates(rideId: string): Promise<string[]> {
    const updates = [
      '🚗 Driver is 2 minutes away from pickup',
      '📱 Driver has arrived at pickup location',
      '🛣️ En route - estimated arrival in 12 minutes',
      '🚦 Brief delay due to traffic light sequence',
      '📍 Approaching destination - prepare for arrival',
      '✅ Ride completed - thank you for choosing us!'
    ];

    // Return 1-2 relevant updates based on ride status
    return updates.slice(0, Math.floor(Math.random() * 2) + 1);
  }
}