'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import { RideshareDB, Ride, DriverProfile } from '@/lib/rideshare-db';

export default function DriverAppPage() {
  const { user, isLoading } = useUser();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, total: 0 });

  // Get driver's location
  useEffect(() => {
    if (navigator.geolocation && isOnline) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(newLocation);
          
          // Update location in database
          if (user?.sub && driverProfile) {
            updateLocationInDB(newLocation.lat, newLocation.lng);
          }
        },
        (error) => {
          console.log('Location error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline, user, driverProfile]);

  // Load driver profile
  useEffect(() => {
    if (user?.sub) {
      loadDriverProfile();
    }
  }, [user]);

  // Real-time ride requests
  useEffect(() => {
    if (isOnline && location) {
      loadAvailableRides();
      
      // Subscribe to new ride requests
      const subscription = RideshareDB.subscribeToDriverRequests(location, (payload) => {
        console.log('New ride request:', payload);
        loadAvailableRides();
      });

      // Refresh rides every 30 seconds
      const interval = setInterval(() => {
        loadAvailableRides();
      }, 30000);

      return () => {
        subscription.unsubscribe();
        clearInterval(interval);
      };
    }
  }, [isOnline, location]);

  const loadDriverProfile = async () => {
    try {
      if (!user?.sub) return;

      let dbUser = await RideshareDB.getUserByAuth0Id(user.sub);
      if (!dbUser) {
        // Create user if doesn't exist
        dbUser = await RideshareDB.createUser({
          auth0_id: user.sub,
          email: user.email!,
          name: user.name!,
          user_type: 'driver'
        });
      }

      // Check if driver profile exists
      const { data } = await RideshareDB.supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', dbUser.id)
        .single();

      if (data) {
        setDriverProfile(data);
        setIsOnline(data.is_online);
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
    }
  };

  const createDriverProfile = async (profileData: any) => {
    try {
      if (!user?.sub) return;

      const dbUser = await RideshareDB.getUserByAuth0Id(user.sub);
      if (!dbUser) return;

      const profile = await RideshareDB.createDriverProfile({
        user_id: dbUser.id,
        license_number: profileData.licenseNumber,
        vehicle_make: profileData.vehicleMake,
        vehicle_model: profileData.vehicleModel,
        vehicle_year: parseInt(profileData.vehicleYear),
        vehicle_color: profileData.vehicleColor,
        license_plate: profileData.licensePlate,
        driver_rating: 5.0,
        total_rides: 0,
        is_online: false
      });

      setDriverProfile(profile);
    } catch (error) {
      console.error('Error creating driver profile:', error);
      alert('Failed to create driver profile');
    }
  };

  const toggleOnlineStatus = async () => {
    if (!driverProfile) return;

    try {
      const newStatus = !isOnline;
      
      if (newStatus && !location) {
        // Request location if going online
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setLocation(newLocation);
            
            await RideshareDB.updateDriverLocation(driverProfile.user_id, newLocation.lat, newLocation.lng);
            await RideshareDB.setDriverOnlineStatus(driverProfile.user_id, newStatus);
            setIsOnline(newStatus);
          },
          (error) => {
            alert('Location access is required to go online');
          }
        );
      } else {
        await RideshareDB.setDriverOnlineStatus(driverProfile.user_id, newStatus);
        setIsOnline(newStatus);
        
        if (!newStatus) {
          setAvailableRides([]);
        }
      }
    } catch (error) {
      console.error('Error toggling online status:', error);
    }
  };

  const updateLocationInDB = async (lat: number, lng: number) => {
    try {
      if (driverProfile) {
        await RideshareDB.updateDriverLocation(driverProfile.user_id, lat, lng);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const loadAvailableRides = async () => {
    try {
      if (!location) return;

      const rides = await RideshareDB.getAvailableRides(location.lat, location.lng, 20);
      setAvailableRides(rides);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const acceptRide = async (rideId: string) => {
    try {
      if (!driverProfile) return;

      await RideshareDB.acceptRide(rideId, driverProfile.user_id);
      
      // Load the accepted ride
      const ride = await RideshareDB.getRideById(rideId);
      setCurrentRide(ride);
      
      // Remove from available rides
      setAvailableRides(prev => prev.filter(r => r.id !== rideId));

      // Start AI agent safety monitoring
      await fetch('/api/agent/safety-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId })
      });
      
    } catch (error) {
      console.error('Error accepting ride:', error);
      alert('Failed to accept ride');
    }
  };

  const updateRideStatus = async (status: Ride['status']) => {
    if (!currentRide) return;

    try {
      await RideshareDB.updateRideStatus(currentRide.id, status);
      const updatedRide = await RideshareDB.getRideById(currentRide.id);
      setCurrentRide(updatedRide);

      if (status === 'completed') {
        // Calculate earnings
        const fare = currentRide.estimated_fare || 0;
        setEarnings(prev => ({
          today: prev.today + fare,
          week: prev.week + fare,
          total: prev.total + fare
        }));
        
        setCurrentRide(null);
        if (isOnline) {
          loadAvailableRides();
        }
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };

  if (isLoading) {
    return <div className="container">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h2>🔐 Sign In Required</h2>
          <p>Please sign in to access the driver app</p>
          <a href="/api/auth/login" className="btn btn-primary">Sign In</a>
        </div>
      </div>
    );
  }

  if (!driverProfile) {
    return <DriverProfileSetup onProfileCreated={createDriverProfile} />;
  }

  return (
    <div className="container">
      <div className="driver-header">
        <h1>🚗 Driver Dashboard</h1>
        <div className="driver-status">
          <button
            onClick={toggleOnlineStatus}
            className={`btn ${isOnline ? 'btn-success' : 'btn-secondary'} online-toggle`}
          >
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </button>
        </div>
      </div>

      <div className="driver-stats">
        <div className="stat-card">
          <h3>💰 Today</h3>
          <p>${earnings.today.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>📊 This Week</h3>
          <p>${earnings.week.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>⭐ Rating</h3>
          <p>{driverProfile.driver_rating}/5.0</p>
        </div>
        <div className="stat-card">
          <h3>🚕 Rides</h3>
          <p>{driverProfile.total_rides}</p>
        </div>
      </div>

      {currentRide ? (
        <CurrentRideCard ride={currentRide} onStatusChange={updateRideStatus} />
      ) : (
        <>
          {isOnline ? (
            <div className="available-rides">
              <h2>📍 Available Rides ({availableRides.length})</h2>
              {availableRides.length === 0 ? (
                <div className="card">
                  <p>🔍 Looking for ride requests...</p>
                  <div className="spinner-small"></div>
                </div>
              ) : (
                <div className="rides-list">
                  {availableRides.map(ride => (
                    <RideRequestCard 
                      key={ride.id} 
                      ride={ride} 
                      driverLocation={location!}
                      onAccept={() => acceptRide(ride.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="offline-message">
              <div className="card">
                <h2>📴 You're Offline</h2>
                <p>Go online to start receiving ride requests</p>
                <button onClick={toggleOnlineStatus} className="btn btn-primary">
                  🟢 Go Online
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .driver-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .online-toggle {
          padding: 12px 24px;
          font-weight: bold;
          font-size: 16px;
        }

        .driver-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .stat-card h3 {
          color: #64748b;
          font-size: 14px;
          margin: 0 0 8px 0;
        }

        .stat-card p {
          color: #1e293b;
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .rides-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .spinner-small {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .offline-message {
          text-align: center;
          margin-top: 50px;
        }
      `}</style>
    </div>
  );
}

function DriverProfileSetup({ onProfileCreated }: { onProfileCreated: (data: any) => void }) {
  const [formData, setFormData] = useState({
    licenseNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    licensePlate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProfileCreated(formData);
  };

  return (
    <div className="container">
      <div className="setup-form">
        <h1>🚗 Driver Registration</h1>
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label>Driver's License Number</label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
              required
              className="form-control"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Make</label>
              <input
                type="text"
                value={formData.vehicleMake}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleMake: e.target.value }))}
                required
                className="form-control"
                placeholder="e.g., Honda"
              />
            </div>
            <div className="form-group">
              <label>Vehicle Model</label>
              <input
                type="text"
                value={formData.vehicleModel}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                required
                className="form-control"
                placeholder="e.g., Civic"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                value={formData.vehicleYear}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleYear: e.target.value }))}
                required
                className="form-control"
                min="2010"
                max="2024"
              />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input
                type="text"
                value={formData.vehicleColor}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleColor: e.target.value }))}
                required
                className="form-control"
                placeholder="e.g., Blue"
              />
            </div>
          </div>

          <div className="form-group">
            <label>License Plate</label>
            <input
              type="text"
              value={formData.licensePlate}
              onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
              required
              className="form-control"
              placeholder="e.g., ABC123"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-large">
            🚗 Complete Registration
          </button>
        </form>
      </div>

      <style jsx>{`
        .setup-form {
          max-width: 600px;
          margin: 0 auto;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
        }

        .form-control {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
        }

        .btn-large {
          width: 100%;
          padding: 15px;
          font-size: 18px;
        }
      `}</style>
    </div>
  );
}

function RideRequestCard({ ride, driverLocation, onAccept }: { 
  ride: Ride; 
  driverLocation: { lat: number; lng: number };
  onAccept: () => void; 
}) {
  const distance = RideshareDB.calculateDistance(
    driverLocation.lat, driverLocation.lng,
    ride.pickup_latitude, ride.pickup_longitude
  );

  const estimatedTime = Math.round(distance * 2); // 2 min per km estimate

  return (
    <div className="ride-card">
      <div className="ride-info">
        <div className="passenger-info">
          <h3>👤 {ride.passenger?.name}</h3>
          <p>⭐ Passenger rating: 4.9/5.0</p>
        </div>
        
        <div className="ride-details">
          <p>📍 <strong>Pickup:</strong> {ride.pickup_address}</p>
          <p>🎯 <strong>Destination:</strong> {ride.destination_address}</p>
          <p>💰 <strong>Fare:</strong> ${ride.estimated_fare}</p>
          <p>📏 <strong>Distance to pickup:</strong> {distance.toFixed(1)} km (~{estimatedTime} min)</p>
        </div>
      </div>

      <div className="ride-actions">
        <button onClick={onAccept} className="btn btn-success accept-btn">
          ✅ Accept Ride
        </button>
      </div>

      <style jsx>{`
        .ride-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }

        .ride-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .passenger-info h3 {
          margin: 0 0 5px 0;
          color: #1e293b;
        }

        .passenger-info p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .ride-details {
          margin-top: 15px;
        }

        .ride-details p {
          margin: 5px 0;
          font-size: 14px;
        }

        .accept-btn {
          padding: 12px 24px;
          font-weight: bold;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .ride-card {
            flex-direction: column;
            text-align: center;
          }

          .ride-actions {
            margin-top: 15px;
            width: 100%;
          }

          .accept-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

function CurrentRideCard({ ride, onStatusChange }: { 
  ride: Ride; 
  onStatusChange: (status: Ride['status']) => void; 
}) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'accepted': return '🎯 Going to pickup';
      case 'pickup': return '🚶 Passenger pickup';
      case 'in_progress': return '🚗 En route to destination';
      default: return status;
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'accepted': return { text: '🚶 Arrived for Pickup', nextStatus: 'pickup' as const };
      case 'pickup': return { text: '🚗 Start Trip', nextStatus: 'in_progress' as const };
      case 'in_progress': return { text: '✅ Complete Trip', nextStatus: 'completed' as const };
      default: return null;
    }
  };

  const nextAction = getNextAction(ride.status);

  return (
    <div className="current-ride">
      <h2>🚗 Current Ride</h2>
      
      <div className="card">
        <div className="ride-status">
          <h3>{getStatusDisplay(ride.status)}</h3>
          <div className="passenger-info">
            <p><strong>Passenger:</strong> {ride.passenger?.name}</p>
            <p><strong>Phone:</strong> {ride.passenger?.phone}</p>
          </div>
        </div>

        <div className="trip-details">
          <p>📍 <strong>Pickup:</strong> {ride.pickup_address}</p>
          <p>🎯 <strong>Destination:</strong> {ride.destination_address}</p>
          <p>💰 <strong>Fare:</strong> ${ride.estimated_fare}</p>
          <p>⏱️ <strong>Duration:</strong> ~{ride.estimated_duration} minutes</p>
        </div>

        <div className="ai-status">
          <h4>🤖 AI Agents Active</h4>
          <div className="agent-list">
            <div className="agent-item">
              🛡️ Safety Monitor: Active (Score: {ride.safety_score}/100)
            </div>
            <div className="agent-item">
              🎵 Music Agent: Enhancing ride experience
            </div>
            <div className="agent-item">
              🗺️ Route Agent: Optimizing navigation
            </div>
          </div>
        </div>

        <div className="ride-controls">
          <button className="btn btn-primary">📞 Call Passenger</button>
          <button className="btn btn-info">💬 Message</button>
          <button className="btn btn-warning">🗺️ Navigate</button>
          {nextAction && (
            <button 
              onClick={() => onStatusChange(nextAction.nextStatus)}
              className="btn btn-success"
            >
              {nextAction.text}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .current-ride {
          margin-bottom: 30px;
        }

        .ride-status h3 {
          color: #059669;
          margin: 0 0 15px 0;
          font-size: 20px;
        }

        .passenger-info {
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }

        .passenger-info p {
          margin: 5px 0;
        }

        .trip-details {
          margin: 20px 0;
        }

        .trip-details p {
          margin: 8px 0;
          font-size: 16px;
        }

        .ai-status {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }

        .ai-status h4 {
          margin: 0 0 10px 0;
          color: #374151;
        }

        .agent-item {
          padding: 5px 0;
          font-size: 14px;
          color: #6b7280;
        }

        .ride-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .ride-controls {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}