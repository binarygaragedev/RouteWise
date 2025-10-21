import { BaseAgent, AgentResult } from './BaseAgent';
import { auth0Manager } from '../lib/auth0';
import { tokenVault } from '../lib/tokenVault';
import { spotifyService } from '../services/spotify';
import { mapsService } from '../services/maps';
import { weatherService } from '../services/weather';

export interface RideInsights {
  routeSuggestion?: {
    route: string;
    duration: string;
    traffic: string;
  };
  musicRecommendation?: {
    playlist: string;
    vibe: string;
  };
  weatherUpdate?: {
    temperature: string;
    conditions: string;
    recommendation: string;
  };
  tips: string[];
}

export class RidePreparationAgent extends BaseAgent {
  constructor() {
    super('Ride Preparation Agent');
  }

  async execute(driverId: string, passengerId: string): Promise<AgentResult> {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🤖 RIDE PREPARATION AGENT ACTIVATED`);
      console.log(`Driver: ${driverId} → Passenger: ${passengerId}`);
      console.log(`${'='.repeat(60)}\n`);

      await this.initialize();

      // Step 1: Check permissions (what data can we access?)
      const permissions = await this.checkDataPermissions(passengerId, driverId);
      console.log(`✓ Permissions checked: ${JSON.stringify(permissions)}\n`);

      // Step 2: Gather context from allowed APIs
      const context = await this.gatherRideContext(passengerId, permissions);
      console.log(`✓ Context gathered from ${context.sources.length} API(s)\n`);

      // Step 3: Generate AI insights
      const insights = await this.generateRideInsights(context, permissions);
      console.log(`✓ AI insights generated\n`);

      return {
        success: true,
        data: insights,
        dataAccessed: context.sources,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check what data the driver has permission to access
   */
  private async checkDataPermissions(passengerId: string, driverId: string) {
    const passenger = await auth0Manager.getUser(passengerId);
    const driverPermissions = passenger.user_metadata?.driver_permissions || {};

    const permissions = {
      music: driverPermissions.music_access === true,
      route: driverPermissions.route_preferences === true,
      weather: true, // Weather is public data
      conversation: driverPermissions.conversation_topics === true,
      climate: driverPermissions.climate_preferences === true,
    };

    // Log the permission check
    const allowedPermissions = Object.entries(permissions)
      .filter(([_, allowed]) => allowed)
      .map(([key, _]) => key);

    await this.logAction({
      action: 'check_permissions',
      subjectId: passengerId,
      dataAccessed: allowedPermissions,
      reason: `Driver ${driverId} checking data access permissions`,
    });

    return permissions;
  }

  /**
   * Gather context from various APIs based on permissions
   */
  private async gatherRideContext(passengerId: string, permissions: any) {
    const context: { data: Record<string, any>, sources: string[] } = { 
      data: {}, 
      sources: [] 
    };
    const tasks: Promise<any>[] = [];

    // Music data (if permitted)
    if (permissions.music) {
      tasks.push(this.fetchMusicPreferences(passengerId));
      context.sources.push('spotify');
    }

    // Route data (if permitted)
    if (permissions.route) {
      tasks.push(this.fetchRoutePreferences(passengerId));
      context.sources.push('google_maps');
    }

    // Weather data (always allowed)
    if (permissions.weather) {
      tasks.push(this.fetchWeatherData());
      context.sources.push('weather_api');
    }

    // Execute all API calls in parallel
    const results = await Promise.all(tasks);
    
    // Combine results
    results.forEach((result: any, index: number) => {
      if (result) {
        const source = context.sources[index];
        context.data[source] = result;
      }
    });

    return context;
  }

  /**
   * Fetch music preferences via Token Vault
   */
  private async fetchMusicPreferences(passengerId: string) {
    try {
      const spotifyToken = await tokenVault.getToken(passengerId, 'spotify');
      if (!spotifyToken) {
        console.log('⚠️  No Spotify token found for passenger');
        return null;
      }

      const playlists = await spotifyService.getUserPlaylists(spotifyToken);
      console.log(`🎵 Fetched ${playlists.length} Spotify playlists`);

      await this.logAction({
        action: 'fetch_music_data',
        subjectId: passengerId,
        dataAccessed: ['spotify_playlists'],
        reason: 'Gathering music preferences for ride preparation',
      });

      return { playlists, preferences: 'upbeat_driving_music' };
    } catch (error) {
      console.log('⚠️  Failed to fetch music preferences:', (error as Error).message || 'Unknown error');
      return null;
    }
  }

  /**
   * Fetch route preferences (mock implementation)
   */
  private async fetchRoutePreferences(passengerId: string) {
    try {
      // In a real implementation, this would fetch from Google Maps API
      const routeData = await mapsService.getRoutes(
        { lat: 40.7128, lng: -74.0060 }, // Mock origin
        { lat: 40.7589, lng: -73.9851 }  // Mock destination
      );
      console.log(`🗺️  Calculated optimal route`);

      await this.logAction({
        action: 'fetch_route_data',
        subjectId: passengerId,
        dataAccessed: ['route_preferences', 'traffic_data'],
        reason: 'Gathering route preferences for ride preparation',
      });

      return routeData[0] || { route: 'Default route', duration: '15 min', traffic: 'Light' };
    } catch (error) {
      console.log('⚠️  Failed to fetch route preferences:', (error as Error).message || 'Unknown error');
      return null;
    }
  }

  /**
   * Fetch weather data
   */
  private async fetchWeatherData() {
    try {
      const weather = await weatherService.getCurrentWeather(40.7128, -74.0060); // NYC coords
      console.log(`🌤️  Fetched current weather conditions`);
      return weather;
    } catch (error) {
      console.log('⚠️  Failed to fetch weather data:', (error as Error).message || 'Unknown error');
      return null;
    }
  }

  /**
   * Generate AI insights from gathered context
   */
  private async generateRideInsights(context: any, permissions: any): Promise<RideInsights> {
    const allowedData = Object.keys(permissions).filter(key => permissions[key]);
    
    const aiResponse = await this.callAI([
      {
        role: 'system',
        content: `You are an AI agent preparing a rideshare experience. 
                 Generate helpful, actionable insights based ONLY on the provided data.
                 Available data sources: ${allowedData.join(', ')}.
                 Focus on route optimization, music curation, and comfort recommendations.`
      },
      {
        role: 'user',
        content: `Context: ${JSON.stringify(context.data)}`
      }
    ]);
    
    await this.logAction({
      action: 'generate_insights',
      subjectId: 'ride_preparation',
      dataAccessed: context.sources,
      reason: 'Generated AI insights for ride optimization',
    });

    const insights: RideInsights = {
      tips: this.extractTipsFromAI(aiResponse)
    };

    // Add specific insights based on available data
    if (context.data.google_maps) {
      insights.routeSuggestion = {
        route: context.data.google_maps.route || 'Optimal route calculated',
        duration: context.data.google_maps.duration || '15 minutes',
        traffic: context.data.google_maps.traffic || 'Light traffic'
      };
    }

    if (context.data.spotify) {
      insights.musicRecommendation = {
        playlist: 'Driving Favorites',
        vibe: 'Upbeat and energetic'
      };
    }

    if (context.data.weather_api) {
      insights.weatherUpdate = {
        temperature: context.data.weather_api.temperature || '72°F',
        conditions: context.data.weather_api.conditions || 'Clear',
        recommendation: 'Perfect weather for the ride!'
      };
    }

    return insights;
  }

  /**
   * Extract actionable tips from AI response
   */
  private extractTipsFromAI(aiResponse: string): string[] {
    // Simple extraction - in production, this would be more sophisticated
    const lines = aiResponse.split('\n').filter(line => line.trim());
    return lines.slice(0, 3).map(line => line.replace(/^[-*]\s*/, '').trim());
  }
}

// Export singleton instance
export const ridePreparationAgent = new RidePreparationAgent();