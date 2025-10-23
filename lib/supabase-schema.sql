-- RouteWise AI - Real Rideshare Database Schema
-- This creates the complete database structure for a working rideshare app

-- Users table (Auth0 users + rideshare profile)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id TEXT UNIQUE NOT NULL, -- Auth0 user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  profile_image TEXT,
  user_type TEXT CHECK (user_type IN ('passenger', 'driver', 'both')) DEFAULT 'passenger',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver profiles (extended info for drivers)
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_color TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  vehicle_photo TEXT,
  driver_rating DECIMAL(3,2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  current_latitude DECIMAL(10,8),
  current_longitude DECIMAL(11,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rides table (the core of the rideshare app)
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID REFERENCES users(id) NOT NULL,
  driver_id UUID REFERENCES users(id),
  
  -- Pickup location
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10,8) NOT NULL,
  pickup_longitude DECIMAL(11,8) NOT NULL,
  
  -- Destination
  destination_address TEXT NOT NULL,
  destination_latitude DECIMAL(10,8) NOT NULL,
  destination_longitude DECIMAL(11,8) NOT NULL,
  
  -- Ride details
  estimated_distance DECIMAL(8,2), -- in kilometers
  estimated_duration INTEGER, -- in minutes
  estimated_fare DECIMAL(8,2), -- in currency
  
  -- Status tracking
  status TEXT CHECK (status IN (
    'requested',     -- Passenger requested ride
    'searching',     -- Looking for driver
    'accepted',      -- Driver accepted
    'pickup',        -- Driver going to pickup
    'in_progress',   -- Ride in progress
    'completed',     -- Ride completed
    'cancelled'      -- Ride cancelled
  )) DEFAULT 'requested',
  
  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  pickup_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- AI Agent enhancements
  ai_insights JSONB, -- AI-generated ride insights
  music_playlist TEXT, -- Spotify playlist ID
  weather_info JSONB, -- Weather data for ride
  safety_score INTEGER DEFAULT 100, -- Safety monitoring score
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time ride tracking
CREATE TABLE IF NOT EXISTS ride_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2), -- km/h
  heading INTEGER, -- 0-360 degrees
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Agent interactions log
CREATE TABLE IF NOT EXISTS agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id),
  user_id UUID REFERENCES users(id),
  agent_type TEXT NOT NULL, -- 'ride-preparation', 'safety-monitoring', etc.
  action TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  tokens_used JSONB, -- Which API tokens were used
  permissions_checked JSONB, -- What permissions were verified
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  ride_id UUID REFERENCES rides(id),
  type TEXT NOT NULL, -- 'ride_accepted', 'driver_arriving', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_requested_at ON rides(requested_at);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_online ON driver_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_location ON driver_profiles(current_latitude, current_longitude);
CREATE INDEX IF NOT EXISTS idx_ride_tracking_ride_id ON ride_tracking(ride_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - can be enhanced)
CREATE POLICY "Users can view their own data" ON users FOR ALL USING (auth0_id = auth.jwt() ->> 'sub');
CREATE POLICY "Drivers can view their profile" ON driver_profiles FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth0_id = auth.jwt() ->> 'sub'));
CREATE POLICY "Users can view rides they're involved in" ON rides FOR ALL USING (
  passenger_id IN (SELECT id FROM users WHERE auth0_id = auth.jwt() ->> 'sub') OR
  driver_id IN (SELECT id FROM users WHERE auth0_id = auth.jwt() ->> 'sub')
);

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE PROCEDURE update_updated_at();