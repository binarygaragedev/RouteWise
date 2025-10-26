# 🗄️ Supabase Production Database Setup

## 📋 Complete Database Configuration for RouteWise AI

### Step 1: Create Supabase Project

1. **Sign up** at [supabase.com](https://supabase.com)
2. **Create new project**:
   - Name: `RouteWise AI Production`
   - Database Password: `[generate strong password]`
   - Region: Choose closest to your users
   - Plan: Start with Free tier (can upgrade later)

### Step 2: Database Schema Setup

Execute these SQL commands in Supabase SQL Editor:

#### A. Create Core Tables

```sql
-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;

-- Users table (integrates with Auth0)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('driver', 'passenger', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver profiles
CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_color TEXT NOT NULL,
  is_available BOOLEAN DEFAULT false,
  current_latitude DECIMAL(10,8),
  current_longitude DECIMAL(11,8),
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Passenger preferences  
CREATE TABLE passenger_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  music_genres TEXT[] DEFAULT ARRAY[]::TEXT[],
  temperature_preference TEXT CHECK (temperature_preference IN ('cool', 'warm', 'normal')),
  conversation_preference TEXT CHECK (conversation_preference IN ('chatty', 'quiet', 'normal')),
  payment_method TEXT DEFAULT 'card',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rides table
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10,8) NOT NULL,
  pickup_longitude DECIMAL(11,8) NOT NULL,
  destination_address TEXT NOT NULL,
  destination_latitude DECIMAL(10,8) NOT NULL,
  destination_longitude DECIMAL(11,8) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'accepted', 'in_progress', 'completed', 'cancelled')),
  fare_estimate DECIMAL(10,2),
  final_fare DECIMAL(10,2),
  distance_km DECIMAL(10,2),
  duration_minutes INTEGER,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  ai_insights JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI agent logs for audit trail
CREATE TABLE ai_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### B. Create Indexes for Performance

```sql
-- Performance indexes
CREATE INDEX idx_users_auth0_id ON users(auth0_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_driver_profiles_user_id ON driver_profiles(user_id);
CREATE INDEX idx_driver_profiles_available ON driver_profiles(is_available) WHERE is_available = true;
CREATE INDEX idx_passenger_preferences_user_id ON passenger_preferences(user_id);
CREATE INDEX idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created_at ON rides(created_at);
CREATE INDEX idx_ai_agent_logs_user_id ON ai_agent_logs(user_id);
CREATE INDEX idx_ai_agent_logs_ride_id ON ai_agent_logs(ride_id);
CREATE INDEX idx_ai_agent_logs_agent_type ON ai_agent_logs(agent_type);
```

### Step 3: Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE passenger_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth0_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth0_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Driver profiles accessible by the driver and passengers who book them
CREATE POLICY "Drivers can manage their own profile" ON driver_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = driver_profiles.user_id 
      AND users.auth0_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Passengers can view driver profiles during rides" ON driver_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rides 
      JOIN users ON users.id = rides.passenger_id
      WHERE rides.driver_id = (
        SELECT id FROM users WHERE users.id = driver_profiles.user_id
      )
      AND users.auth0_id = current_setting('request.jwt.claims', true)::json->>'sub'
      AND rides.status IN ('accepted', 'in_progress')
    )
  );

-- Passenger preferences only accessible by the passenger
CREATE POLICY "Passengers can manage their own preferences" ON passenger_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = passenger_preferences.user_id 
      AND users.auth0_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Rides accessible by passenger and driver involved
CREATE POLICY "Users can view rides they are involved in" ON rides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (users.id = rides.passenger_id OR users.id = rides.driver_id)
      AND users.auth0_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Passengers can create rides" ON rides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = rides.passenger_id 
      AND users.auth0_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Drivers and passengers can update rides" ON rides
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE (users.id = rides.passenger_id OR users.id = rides.driver_id)
      AND users.auth0_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- AI agent logs accessible by the user they belong to
CREATE POLICY "Users can view their own AI agent logs" ON ai_agent_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = ai_agent_logs.user_id 
      AND users.auth0_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );
```

### Step 4: Create Database Functions

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passenger_preferences_updated_at BEFORE UPDATE ON passenger_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate ride fare
CREATE OR REPLACE FUNCTION calculate_ride_fare(
  distance_km DECIMAL,
  duration_minutes INTEGER
) RETURNS DECIMAL AS $$
BEGIN
  -- Base fare + distance rate + time rate
  RETURN 2.50 + (distance_km * 1.20) + (duration_minutes * 0.15);
END;
$$ LANGUAGE plpgsql;

-- Function to find available drivers near location
CREATE OR REPLACE FUNCTION find_nearby_drivers(
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  radius_km DECIMAL DEFAULT 10
) RETURNS TABLE (
  driver_id UUID,
  distance_km DECIMAL,
  driver_name TEXT,
  vehicle_info TEXT,
  rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.user_id,
    (6371 * acos(
      cos(radians(pickup_lat)) * 
      cos(radians(dp.current_latitude)) * 
      cos(radians(dp.current_longitude) - radians(pickup_lng)) + 
      sin(radians(pickup_lat)) * 
      sin(radians(dp.current_latitude))
    )) as distance,
    u.name,
    CONCAT(dp.vehicle_make, ' ', dp.vehicle_model, ' (', dp.vehicle_color, ')'),
    dp.rating
  FROM driver_profiles dp
  JOIN users u ON u.id = dp.user_id
  WHERE dp.is_available = true
  AND (6371 * acos(
    cos(radians(pickup_lat)) * 
    cos(radians(dp.current_latitude)) * 
    cos(radians(dp.current_longitude) - radians(pickup_lng)) + 
    sin(radians(pickup_lat)) * 
    sin(radians(dp.current_latitude))
  )) <= radius_km
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;
```

### Step 5: Insert Sample Data for Testing

```sql
-- Sample users
INSERT INTO users (auth0_id, email, name, user_type) VALUES
  ('auth0|sample-driver-1', 'driver1@routewise.ai', 'Mike Rodriguez', 'driver'),
  ('auth0|sample-driver-2', 'driver2@routewise.ai', 'Sarah Johnson', 'driver'),
  ('auth0|sample-passenger-1', 'passenger1@routewise.ai', 'John Smith', 'passenger'),
  ('auth0|sample-passenger-2', 'passenger2@routewise.ai', 'Emily Davis', 'passenger');

-- Sample driver profiles
INSERT INTO driver_profiles (user_id, license_number, vehicle_make, vehicle_model, vehicle_year, vehicle_plate, vehicle_color, is_available, current_latitude, current_longitude)
SELECT 
  u.id,
  'DL' || LPAD((ROW_NUMBER() OVER())::TEXT, 8, '0'),
  CASE (ROW_NUMBER() OVER()) % 3 
    WHEN 1 THEN 'Toyota'
    WHEN 2 THEN 'Honda' 
    ELSE 'Nissan'
  END,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 1 THEN 'Camry'
    WHEN 2 THEN 'Accord'
    ELSE 'Altima' 
  END,
  2020 + (ROW_NUMBER() OVER()) % 4,
  'ABC' || LPAD((ROW_NUMBER() OVER())::TEXT, 3, '0'),
  CASE (ROW_NUMBER() OVER()) % 4
    WHEN 1 THEN 'Black'
    WHEN 2 THEN 'White'
    WHEN 3 THEN 'Silver'
    ELSE 'Blue'
  END,
  true,
  40.7589 + (RANDOM() * 0.01),  -- Near Times Square
  -73.9851 + (RANDOM() * 0.01)
FROM users u 
WHERE u.user_type = 'driver';

-- Sample passenger preferences
INSERT INTO passenger_preferences (user_id, music_genres, temperature_preference, conversation_preference)
SELECT 
  u.id,
  ARRAY['Pop', 'Rock', 'Jazz'],
  'normal',
  'normal'
FROM users u 
WHERE u.user_type = 'passenger';
```

### Step 6: Configure Authentication Integration

#### A. Enable Auth0 Integration in Supabase
1. Go to **Authentication > Settings** in Supabase dashboard
2. Disable email confirmation (Auth0 handles this)
3. Configure JWT settings:

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid-from-auth0",
  "email": "user@example.com",
  "role": "authenticated"
}
```

#### B. Configure Service Role Access
1. Go to **Settings > API** in Supabase dashboard
2. Copy the **Service Role Key** (needed for admin operations)
3. Add to Vercel environment variables

### Step 7: Environment Variables for Vercel

Add these to your Vercel Dashboard:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 8: Test Database Connection

```bash
# Test database connectivity
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/test-db" \
  -H "Content-Type: application/json"

# Test user creation
curl -X POST "https://routewise-h0xr8db1u-binarygaragedevs-projects.vercel.app/api/users/create" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "userType": "passenger"}'
```

## 🔧 Troubleshooting

### Common Issues:

**RLS Policies Blocking Access**
- Check JWT token format matches policy expectations
- Verify Auth0 integration is properly configured

**Connection Timeout**
- Ensure Supabase project is in same region as Vercel
- Check firewall settings

**Performance Issues**
- Verify indexes are created properly
- Monitor query performance in Supabase dashboard

## ✅ Verification Checklist

- [ ] Supabase project created and configured
- [ ] All tables created with proper schema
- [ ] Row Level Security policies implemented
- [ ] Database functions and triggers working
- [ ] Sample data inserted for testing
- [ ] Environment variables added to Vercel
- [ ] Database connectivity tested
- [ ] Auth0 integration configured

Once the database is set up, proceed to configure external API keys!