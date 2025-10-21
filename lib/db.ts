import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Handle demo mode when environment variables might not be properly configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-key';

// Create a dummy client for demo purposes if real credentials aren't available
let db: SupabaseClient | null;
try {
  db = createClient(supabaseUrl, supabaseServiceKey);
} catch (error) {
  console.warn('⚠️  Using mock database client for demo');
  db = null;
}

export { db };

// Database schema types
export interface Passenger {
  id: string;
  auth0_id: string;
  name: string;
  email: string;
  phone?: string;
  preferences: PassengerPreferences;
  created_at: string;
}

export interface PassengerPreferences {
  music?: {
    genres: string[];
    artists: string[];
    energy_level: 'low' | 'medium' | 'high';
    spotify_connected: boolean;
  };
  climate?: {
    preferred_temp: number;
    ac_preference: 'auto' | 'on' | 'off';
  };
  conversation?: {
    level: 'silent' | 'minimal' | 'friendly' | 'chatty';
    topics?: string[];
  };
  route?: {
    preference: 'fastest' | 'scenic' | 'avoid_highways';
    avoid_tolls: boolean;
  };
  special_needs?: {
    accessibility: boolean;
    pet_friendly: boolean;
    child_seat: boolean;
  };
}

export interface Driver {
  id: string;
  auth0_id: string;
  name: string;
  rating: number;
  total_rides: number;
  verification_level: 'new' | 'verified' | 'premium';
  created_at: string;
}

export interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  pickup_location: { lat: number; lng: number; address: string };
  dropoff_location: { lat: number; lng: number; address: string };
  scheduled_time: string;
  started_at?: string;
  completed_at?: string;
  ai_insights?: any;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  actor_type: 'user' | 'agent' | 'system';
  subject_id?: string;
  data_accessed?: string[];
  reason?: string;
  justification?: string;
  created_at: string;
}

// Helper functions
export async function getPassenger(auth0Id: string): Promise<Passenger | null> {
  if (!db) {
    console.log('📊 [DEMO] Mock: Getting passenger', auth0Id);
    return {
      id: auth0Id,
      auth0_id: auth0Id,
      name: 'Demo Passenger John',
      email: 'passenger@demo.com',
      preferences: {
        music: {
          genres: ['pop', 'rock'],
          artists: ['Taylor Swift', 'Ed Sheeran'],
          energy_level: 'medium',
          spotify_connected: true
        },
        route: {
          preference: 'fastest',
          avoid_tolls: false
        },
        conversation: {
          level: 'friendly',
          topics: ['movies', 'travel']
        }
      },
      created_at: new Date().toISOString()
    };
  }

  const { data, error } = await db
    .from('passengers')
    .select('*')
    .eq('auth0_id', auth0Id)
    .single();

  if (error) {
    console.error('Error fetching passenger:', error);
    return null;
  }

  return data;
}

export async function getDriver(auth0Id: string): Promise<Driver | null> {
  if (!db) {
    console.log('📊 [DEMO] Mock: Getting driver', auth0Id);
    return {
      id: auth0Id,
      auth0_id: auth0Id,
      name: 'Demo Driver Sarah',
      rating: 4.8,
      total_rides: 150,
      verification_level: 'verified',
      created_at: new Date().toISOString()
    };
  }

  const { data, error } = await db
    .from('drivers')
    .select('*')
    .eq('auth0_id', auth0Id)
    .single();

  if (error) {
    console.error('Error fetching driver:', error);
    return null;
  }

  return data;
}

export async function getRide(rideId: string): Promise<Ride | null> {
  if (!db) {
    console.log('📊 [DEMO] Mock: Getting ride', rideId);
    return {
      id: rideId,
      passenger_id: 'auth0|passenger_john_123',
      driver_id: 'auth0|driver_sarah_verified',
      status: 'active',
      pickup_location: { lat: 40.7128, lng: -74.0060, address: 'Times Square, NYC' },
      dropoff_location: { lat: 40.7589, lng: -73.9851, address: 'Central Park, NYC' },
      scheduled_time: new Date().toISOString(),
      started_at: new Date().toISOString(),
      ai_insights: { 
        tips: ['Drive safely', 'Play upbeat music'],
        routeSuggestion: { route: 'Via Broadway', duration: '15 min', traffic: 'Light' }
      },
      created_at: new Date().toISOString()
    };
  }

  const { data, error } = await db
    .from('rides')
    .select('*')
    .eq('id', rideId)
    .single();

  if (error) {
    console.error('Error fetching ride:', error);
    return null;
  }

  return data;
}

export async function createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
  if (!db) {
    console.log('📊 [DEMO] Mock audit log:', log.action, log.actor_id);
    return;
  }

  await db.from('audit_logs').insert(log);
}

// SQL Schema for Supabase
export const schema = `
-- Passengers table
CREATE TABLE passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth0_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth0_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  verification_level TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rides table
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID REFERENCES passengers(id),
  driver_id UUID REFERENCES drivers(id),
  status TEXT DEFAULT 'pending',
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  ai_insights JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  subject_id TEXT,
  data_accessed TEXT[],
  reason TEXT,
  justification TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_passengers_auth0_id ON passengers(auth0_id);
CREATE INDEX idx_drivers_auth0_id ON drivers(auth0_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
`;
