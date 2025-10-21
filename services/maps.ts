import axios from 'axios';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Route {
  name: string;
  duration: string;
  distance: string;
  steps: string[];
}

class MapsService {
  private apiKey = process.env.GOOGLE_MAPS_API_KEY;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  async getRoutes(origin: Location, destination: Location): Promise<Route[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          alternatives: true,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        console.error('Google Maps API error:', response.data.status);
        return this.getMockRoutes();
      }

      return response.data.routes.map((route: any, index: number) => ({
        name: this.getRouteName(route, index),
        duration: route.legs[0].duration.text,
        distance: route.legs[0].distance.text,
        steps: route.legs[0].steps.map((step: any) => step.html_instructions),
      }));
    } catch (error) {
      console.error('Maps API error:', error);
      return this.getMockRoutes();
    }
  }

  private getRouteName(route: any, index: number): string {
    const summary = route.summary;
    if (summary && summary !== '') return summary;
    const names = ['Main Route', 'Scenic Route', 'Alternative Route'];
    return names[index] || `Route ${index + 1}`;
  }

  private getMockRoutes(): Route[] {
    return [
      {
        name: 'Main Route',
        duration: '15 min',
        distance: '8.5 mi',
        steps: ['Head north on Main St', 'Turn right onto Oak Ave', 'Arrive at destination'],
      },
      {
        name: 'Scenic Route',
        duration: '18 min',
        distance: '9.2 mi',
        steps: ['Head west on Harbor Dr', 'Follow coastal road', 'Turn left onto destination'],
      },
    ];
  }
}

export const mapsService = new MapsService();
