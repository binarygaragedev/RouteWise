import { initAuth0 } from '@auth0/nextjs-auth0';
import axios from 'axios';

// Initialize Auth0
export const auth0 = initAuth0({
  secret: process.env.AUTH0_SECRET!,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
  baseURL: process.env.AUTH0_BASE_URL!,
  clientID: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
});

// Auth0 Management API Client
class Auth0Manager {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private isDemoMode: boolean;

  constructor() {
    const auth0Url = process.env.AUTH0_ISSUER_BASE_URL;
    this.isDemoMode = !auth0Url || auth0Url.includes('demo.auth0.com') || auth0Url.includes('YOUR_DOMAIN');
  }

  async getAccessToken(): Promise<string> {
    if (this.isDemoMode) {
      console.log('📊 [DEMO] Mock Auth0 access token');
      return 'demo-access-token-' + Date.now();
    }
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await axios.post(
      `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
      {
        grant_type: 'client_credentials',
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/`,
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    
    if (!this.accessToken) {
      throw new Error('Failed to obtain Auth0 access token');
    }
    
    return this.accessToken;
  }

  async getUser(userId: string) {
    if (this.isDemoMode) {
      console.log('📊 [DEMO] Mock Auth0 user:', userId);
      return {
        user_id: userId,
        email: 'demo@example.com',
        name: 'Demo User',
        user_metadata: {
          driver_permissions: {
            music_access: true,
            route_preferences: true,
            conversation_topics: true,
            climate_preferences: false
          },
          emergency_contact: {
            name: 'Emergency Contact',
            phone: '+1-555-0123'
          }
        }
      };
    }

    const token = await this.getAccessToken();
    const response = await axios.get(
      `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  async updateUserMetadata(userId: string, metadata: any) {
    const token = await this.getAccessToken();
    const response = await axios.patch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users/${userId}`,
      { user_metadata: metadata },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  async updateAppMetadata(userId: string, metadata: any) {
    if (this.isDemoMode) {
      console.log('📊 [DEMO] Mock Auth0 update app metadata:', userId, metadata);
      return { success: true };
    }

    const token = await this.getAccessToken();
    const response = await axios.patch(
      `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/users/${userId}`,
      { app_metadata: metadata },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  async createAuditLog(log: {
    action: string;
    actor: string;
    subject?: string;
    reason?: string;
    data_accessed?: string[];
    justification?: string;
  }) {
    // Store in your database
    console.log('🔒 Audit Log:', JSON.stringify(log, null, 2));
    // In production: await db.auditLogs.create(log);
    return log;
  }
}

export const auth0Manager = new Auth0Manager();

// Permission checking utilities
export interface ConsentSettings {
  music?: {
    share_with: 'all_drivers' | 'verified_only' | 'specific_drivers' | 'none';
    expires_after_ride: boolean;
    granted_to?: string[];
  };
  climate?: {
    share_with: 'all_drivers' | 'verified_only' | 'specific_drivers' | 'none';
    expires_after_ride: boolean;
  };
  conversation?: {
    share_with: 'all_drivers' | 'verified_only' | 'specific_drivers' | 'none';
    expires_after_ride: boolean;
  };
  route?: {
    share_with: 'all_drivers' | 'verified_only' | 'specific_drivers' | 'none';
    expires_after_ride: boolean;
  };
  location_history?: {
    share_with: 'all_drivers' | 'verified_only' | 'specific_drivers' | 'none';
    expires_after_ride: boolean;
  };
  emergency_contact?: {
    share_with: 'verified_only' | 'emergency_only' | 'none';
    only_during_ride: boolean;
  };
}

export async function checkPermissions(
  passengerId: string,
  driverId: string,
  dataCategory: keyof ConsentSettings
): Promise<{ allowed: boolean; reason?: string }> {
  // Get passenger's consent settings
  const passenger = await auth0Manager.getUser(passengerId);
  const consentSettings: ConsentSettings = passenger.user_metadata?.consent_settings || {};

  if (!consentSettings[dataCategory]) {
    return { allowed: false, reason: 'No consent settings found' };
  }

  const consent = consentSettings[dataCategory] as any;

  // Check if driver is in specific granted list
  if (consent.share_with === 'specific_drivers') {
    if (!consent.granted_to?.includes(driverId)) {
      return { allowed: false, reason: 'Driver not in allowed list' };
    }
  }

  // Check driver verification level
  const driver = await auth0Manager.getUser(driverId);
  const driverLevel = driver.app_metadata?.verification_level || 'new';

  if (consent.share_with === 'none') {
    return { allowed: false, reason: 'Passenger chose not to share' };
  }

  if (consent.share_with === 'verified_only' && driverLevel === 'new') {
    return { allowed: false, reason: 'Driver not verified' };
  }

  if (consent.share_with === 'emergency_only' && dataCategory === 'emergency_contact') {
    return { allowed: false, reason: 'Emergency contacts only accessible during emergencies' };
  }

  // All checks passed
  return { allowed: true };
}

export type DriverVerificationLevel = 'new' | 'verified' | 'premium';
