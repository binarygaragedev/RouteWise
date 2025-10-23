-- Database Schema for Passenger Preferences
-- Run this in Supabase SQL editor to create the passenger_preferences table

CREATE TABLE IF NOT EXISTS passenger_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id TEXT NOT NULL,
  
  -- Music Preferences
  music_genre TEXT DEFAULT 'pop',
  music_volume TEXT DEFAULT 'medium' CHECK (music_volume IN ('low', 'medium', 'high')),
  music_enabled BOOLEAN DEFAULT true,
  
  -- Communication Preferences
  communication_style TEXT DEFAULT 'neutral' CHECK (communication_style IN ('chatty', 'quiet', 'neutral')),
  language_preference TEXT DEFAULT 'english',
  small_talk BOOLEAN DEFAULT true,
  
  -- Safety Preferences
  share_trip_status BOOLEAN DEFAULT true,
  emergency_contacts JSONB DEFAULT '[]',
  ride_recording BOOLEAN DEFAULT true,
  photo_verification BOOLEAN DEFAULT true,
  
  -- Comfort Preferences
  temperature_preference INTEGER DEFAULT 22,
  window_preference TEXT DEFAULT 'no_preference' CHECK (window_preference IN ('open', 'closed', 'no_preference')),
  seat_adjustment BOOLEAN DEFAULT false,
  
  -- Privacy Preferences
  phone_usage TEXT DEFAULT 'no_preference' CHECK (phone_usage IN ('allowed', 'silent', 'no_preference')),
  personal_calls BOOLEAN DEFAULT true,
  
  -- Special Needs
  accessibility_needs JSONB DEFAULT '[]',
  medical_conditions JSONB DEFAULT '[]',
  service_animal BOOLEAN DEFAULT false,
  
  -- Trip Preferences
  route_preference TEXT DEFAULT 'fastest' CHECK (route_preference IN ('fastest', 'scenic', 'safest')),
  stops_allowed BOOLEAN DEFAULT false,
  max_detour_time INTEGER DEFAULT 5,
  
  -- Driver Access Control (RAG)
  privacy_level TEXT DEFAULT 'selective' CHECK (privacy_level IN ('open', 'selective', 'minimal')),
  min_driver_rating DECIMAL(2,1) DEFAULT 4.0 CHECK (min_driver_rating >= 1.0 AND min_driver_rating <= 5.0),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(passenger_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_passenger_preferences_passenger_id ON passenger_preferences(passenger_id);

-- Enable Row Level Security (RLS)
ALTER TABLE passenger_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for passenger preferences
CREATE POLICY "Passengers can view their own preferences" 
  ON passenger_preferences FOR SELECT 
  USING (passenger_id = current_user::text);

CREATE POLICY "Passengers can update their own preferences" 
  ON passenger_preferences FOR UPDATE 
  USING (passenger_id = current_user::text);

CREATE POLICY "Passengers can insert their own preferences" 
  ON passenger_preferences FOR INSERT 
  WITH CHECK (passenger_id = current_user::text);

-- Create policy for drivers to view preferences with RAG filtering
-- Note: This will be handled by the application layer for more complex RAG logic
CREATE POLICY "Allow service role access" 
  ON passenger_preferences FOR ALL 
  USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_passenger_preferences_updated_at ON passenger_preferences;
CREATE TRIGGER update_passenger_preferences_updated_at
    BEFORE UPDATE ON passenger_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();