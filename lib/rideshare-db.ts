import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client - only available on server side
export const createAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client can only be used on server side');
  }
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Database types based on our schema
export interface User {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
  phone?: string;
  profile_image?: string;
  user_type: 'passenger' | 'driver' | 'both';
  created_at: string;
  updated_at: string;
}

export interface DriverProfile {
  id: string;
  user_id: string;
  license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  license_plate: string;
  vehicle_photo?: string;
  driver_rating: number;
  total_rides: number;
  is_online: boolean;
  current_latitude?: number;
  current_longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  passenger_id: string;
  driver_id?: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_address: string;
  destination_latitude: number;
  destination_longitude: number;
  estimated_distance?: number;
  estimated_duration?: number;
  estimated_fare?: number;
  status: 'requested' | 'searching' | 'accepted' | 'pickup' | 'in_progress' | 'completed' | 'cancelled';
  requested_at: string;
  accepted_at?: string;
  pickup_at?: string;
  completed_at?: string;
  ai_insights?: any;
  music_playlist?: string;
  weather_info?: any;
  safety_score: number;
  created_at: string;
  updated_at: string;
  // Joined data (when using select with relationships)
  passenger?: { name: string; phone?: string; profile_image?: string };
  driver?: { name: string; phone?: string; profile_image?: string };
}

export interface RideTracking {
  id: string;
  ride_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface AgentInteraction {
  id: string;
  ride_id?: string;
  user_id: string;
  agent_type: string;
  action: string;
  input_data?: any;
  output_data?: any;
  tokens_used?: any;
  permissions_checked?: any;
  timestamp: string;
}

export interface Notification {
  id: string;
  user_id: string;
  ride_id?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Real-time database functions
export class RideshareDB {
  static supabase = supabase; // Expose supabase client for direct queries
  
  // User management
  static async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    // Use API endpoint for user creation to bypass RLS
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('User creation API error:', result);
      throw new Error(result.error || 'Failed to create user');
    }
    
    return result;
  }

  static async getUserByAuth0Id(auth0Id: string) {
    // Use API endpoint to get user with admin privileges
    const response = await fetch(`/api/users/get?auth0_id=${encodeURIComponent(auth0Id)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user');
    }
    
    const user = await response.json();
    return user; // Will be null if user not found
  }

  // Driver management
  static async createDriverProfile(profileData: Omit<DriverProfile, 'id' | 'created_at' | 'updated_at'>) {
    // Use API endpoint for driver profile creation to bypass RLS
    const response = await fetch('/api/driver-profiles/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Driver profile creation API error:', result);
      throw new Error(result.error || 'Failed to create driver profile');
    }
    
    return result;
  }

  static async updateDriverLocation(userId: string, latitude: number, longitude: number) {
    // Use API endpoint for driver updates to bypass RLS
    const response = await fetch('/api/driver-profiles/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        current_latitude: latitude,
        current_longitude: longitude
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Driver location update API error:', result);
      throw new Error(result.error || 'Failed to update driver location');
    }
    
    return result;
  }

  static async setDriverOnlineStatus(userId: string, isOnline: boolean) {
    // Use API endpoint for driver updates to bypass RLS
    const response = await fetch('/api/driver-profiles/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        is_online: isOnline
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Driver status update API error:', result);
      throw new Error(result.error || 'Failed to update driver status');
    }
    
    return result;
  }

  static async getNearbyDrivers(latitude: number, longitude: number, radiusKm: number = 10) {
    // Simple distance calculation - in production, use PostGIS
    const { data, error } = await supabase
      .from('driver_profiles')
      .select(`
        *,
        users:user_id (name, phone, profile_image)
      `)
      .eq('is_online', true)
      .not('current_latitude', 'is', null)
      .not('current_longitude', 'is', null);
    
    if (error) throw error;
    
    // Filter by distance (basic calculation)
    return data?.filter(driver => {
      if (!driver.current_latitude || !driver.current_longitude) return false;
      
      const distance = this.calculateDistance(
        latitude, longitude,
        driver.current_latitude, driver.current_longitude
      );
      
      return distance <= radiusKm;
    }) || [];
  }

  // Ride management
  static async createRide(rideData: Omit<Ride, 'id' | 'created_at' | 'updated_at' | 'requested_at'>) {
    // Use API endpoint for ride creation to bypass RLS
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/rides/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rideData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create ride');
    }
    
    return response.json();
  }

  static async updateRideStatus(rideId: string, status: Ride['status'], additionalData: Partial<Ride> = {}) {
    // Use API endpoint for updating ride status to bypass RLS
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/rides/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rideId, status, additionalData })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update ride status');
    }
    
    return response.json();
  }

  static async acceptRide(rideId: string, driverId: string) {
    return this.updateRideStatus(rideId, 'accepted', { driver_id: driverId });
  }

  static async rejectRide(rideId: string, reason?: string) {
    // For now, we'll just log the rejection and keep the ride available for other drivers
    // In a full implementation, you might track driver rejections
    console.log(`Driver rejected ride ${rideId}. Reason: ${reason || 'No reason provided'}`);
    
    // Optionally, you could update the ride with rejection data
    // return this.updateRideStatus(rideId, 'searching', { rejection_reason: reason });
  }

  static async getRideById(rideId: string) {
    // Use API endpoint for getting ride by ID to bypass RLS
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/rides/get?id=${rideId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get ride');
    }
    
    return response.json();
  }

  static async getRidesForUser(userId: string, status?: string) {
    // Use API endpoint for getting user rides to bypass RLS
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    const url = status 
      ? `${baseUrl}/api/rides/user?user_id=${userId}&status=${status}`
      : `${baseUrl}/api/rides/user?user_id=${userId}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user rides');
    }
    
    return response.json();
  }

  static async getAvailableRides(driverLatitude: number, driverLongitude: number, radiusKm: number = 20) {
    // Use API endpoint for getting available rides to bypass RLS
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/rides/available?lat=${driverLatitude}&lng=${driverLongitude}&radius=${radiusKm}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get available rides');
    }
    
    return response.json();
  }

  // Real-time tracking
  static async addRideTracking(trackingData: Omit<RideTracking, 'id' | 'timestamp'>) {
    const { data, error } = await supabase
      .from('ride_tracking')
      .insert([trackingData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getRideTracking(rideId: string) {
    const { data, error } = await supabase
      .from('ride_tracking')
      .select('*')
      .eq('ride_id', rideId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Agent interactions
  static async logAgentInteraction(interaction: Omit<AgentInteraction, 'id' | 'timestamp'>) {
    const { data, error } = await supabase
      .from('agent_interactions')
      .insert([interaction])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Notifications
  static async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (unreadOnly) {
      query = query.eq('read', false);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Utility functions
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const lat1Rad = this.toRad(lat1);
    const lat2Rad = this.toRad(lat2);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  // Real-time subscriptions
  static subscribeToRideUpdates(rideId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`ride_${rideId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` }, 
        callback
      )
      .subscribe();
  }

  static subscribeToDriverRequests(driverLocation: { lat: number, lng: number }, callback: (payload: any) => void) {
    return supabase
      .channel('ride_requests')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rides' },
        callback
      )
      .subscribe();
  }

  static subscribeToUserNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe();
  }
}