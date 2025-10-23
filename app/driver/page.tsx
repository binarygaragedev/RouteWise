'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import { RideshareDB, Ride, DriverProfile } from '@/lib/rideshare-db';
import AIAgentIntegration from '@/components/AIAgentIntegration';

export default function DriverPage() {
  const { user, isLoading } = useUser();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [newRideNotification, setNewRideNotification] = useState<string | null>(null);
  const [driverStats, setDriverStats] = useState({
    totalRides: 0,
    rating: 5.0,
    totalEarnings: 0,
    todayRides: 0,
    todayEarnings: 0,
    onlineTime: '0h 0m'
  });

  // Setup geolocation when online
  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(newLocation);
          
          if (driverProfile) {
            updateLocationInDB(newLocation.lat, newLocation.lng);
          }
        },
        (error) => console.log('Location error:', error),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline, driverProfile]);

  // Load driver profile
  useEffect(() => {
    if (user?.sub) {
      loadDriverProfile();
      loadDriverStats();
    }
  }, [user]);

  // Load available rides when online
  useEffect(() => {
    if (isOnline && location) {
      loadAvailableRides();
      const interval = setInterval(loadAvailableRides, 10000);
      return () => clearInterval(interval);
    }
  }, [isOnline, location]);

  // Real-time ride updates
  useEffect(() => {
    if (currentRide) {
      const subscription = RideshareDB.subscribeToRideUpdates(currentRide.id, (payload) => {
        console.log('Ride update:', payload);
        setCurrentRide(payload.new);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentRide]);

  const loadDriverProfile = async () => {
    try {
      if (!user?.sub) return;

      const dbUser = await RideshareDB.getUserByAuth0Id(user.sub);
      if (!dbUser) {
        console.error('User not found in database');
        return;
      }

      // Get driver profile using API endpoint
      const profileResponse = await fetch(`/api/driver-profiles/get?user_id=${dbUser.id}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData) {
          setDriverProfile(profileData);
          setIsOnline(profileData.is_online);
        }
      } else {
        console.error('Failed to fetch driver profile:', profileResponse.statusText);
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
    }
  };

  const loadDriverStats = async () => {
    try {
      if (!user?.sub) return;
      
      // Load real stats from database or use mock data for demo
      setDriverStats({
        totalRides: 127,
        rating: 4.9,
        totalEarnings: 2840.50,
        todayRides: 5,
        todayEarnings: 124.75,
        onlineTime: '4h 32m'
      });
    } catch (error) {
      console.error('Error loading driver stats:', error);
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
          () => alert('Location access is required to go online')
        );
      } else {
        await RideshareDB.setDriverOnlineStatus(driverProfile.user_id, newStatus);
        setIsOnline(newStatus);
        
        if (!newStatus) {
          setAvailableRides([]);
          setShowMap(false);
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

      const newRides = await RideshareDB.getAvailableRides(location.lat, location.lng, 20);
      
      // Check for new rides to show notification
      const previousRideIds = availableRides.map((r: Ride) => r.id);
      const newRideIds = newRides.filter((r: Ride) => !previousRideIds.includes(r.id));
      
      if (newRideIds.length > 0 && availableRides.length > 0) {
        setNewRideNotification(`🚨 ${newRideIds.length} new ride request${newRideIds.length > 1 ? 's' : ''}!`);
        
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMgBSZ+1/LNeSsF');
          audio.play().catch(() => {});
        } catch (e) {}
        
        setTimeout(() => {
          setNewRideNotification(null);
        }, 5000);
      }
      
      setAvailableRides(newRides);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const acceptRide = async (rideId: string) => {
    try {
      if (!driverProfile) return;

      await RideshareDB.acceptRide(rideId, driverProfile.user_id);
      
      const ride = await RideshareDB.getRideById(rideId);
      setCurrentRide(ride);
      setAvailableRides(prev => prev.filter(r => r.id !== rideId));
      setShowMap(true);

      // Trigger AI agent preparation for the ride
      await fetch('/api/agent/prepare-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rideId: ride.id,
          passengerId: ride.passenger_id,
          driverId: driverProfile.user_id
        })
      });

      console.log('🤖 AI agents started for ride preparation');
      
    } catch (error) {
      console.error('Error accepting ride:', error);
      alert('Failed to accept ride');
    }
  };

  const rejectRide = async (rideId: string, reason?: string) => {
    try {
      await RideshareDB.rejectRide(rideId, reason);
      setAvailableRides(prev => prev.filter(r => r.id !== rideId));
      console.log(`🚫 Ride ${rideId} rejected by driver`);
    } catch (error) {
      console.error('Error rejecting ride:', error);
    }
  };

  const updateRideStatus = async (status: Ride['status']) => {
    if (!currentRide) return;

    try {
      await RideshareDB.updateRideStatus(currentRide.id, status);
      const updatedRide = await RideshareDB.getRideById(currentRide.id);
      setCurrentRide(updatedRide);

      if (status === 'completed') {
        setCurrentRide(null);
        setShowMap(false);
        loadDriverStats(); // Refresh stats after completion
        if (isOnline) {
          loadAvailableRides();
        }
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };

  const cancelRide = async () => {
    if (!currentRide) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel this ride? The passenger will be notified and the ride will be made available to other drivers.'
    );

    if (!confirmed) return;

    try {
      console.log('🚫 Attempting to cancel ride:', currentRide.id);
      
      await RideshareDB.updateRideStatus(currentRide.id, 'cancelled', { 
        driver_id: undefined
      });
      
      console.log('✅ Ride cancelled successfully');
      
      setCurrentRide(null);
      setShowMap(false);
      
      if (isOnline) {
        loadAvailableRides();
      }

      console.log(`🚫 Driver cancelled ride ${currentRide.id}`);
      
    } catch (error) {
      console.error('❌ Error cancelling ride:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to cancel ride: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="login-section">
          <div className="login-card">
            <div className="login-header">
              <h1>🚗 Driver Portal</h1>
              <p>Join RouteWise as a driver and start earning today</p>
            </div>
            <div className="login-features">
              <div className="feature">
                <span className="feature-icon">💰</span>
                <span>Competitive earnings</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🤖</span>
                <span>AI-powered assistance</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📱</span>
                <span>Flexible schedule</span>
              </div>
            </div>
            <a href="/api/auth/login?returnTo=/driver&role=driver" className="btn btn-primary btn-large">
              🚗 Sign In as Driver
            </a>
            <div className="alternative-login">
              <p>Looking for a ride?</p>
              <a href="/api/auth/login?returnTo=/passenger&role=passenger" className="btn btn-secondary btn-large">
                👥 Sign In as Passenger
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!driverProfile) {
    return <DriverSetup onProfileCreated={createDriverProfile} />;
  }

  return (
    <div className="driver-dashboard">
      {/* Header with Basic Driver Info */}
      <header className="driver-header">
        <div className="driver-info">
          <div className="driver-avatar">
            <img src={user.picture || '/default-avatar.png'} alt="Driver" />
            <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '🟢' : '🔴'}
            </div>
          </div>
          <div className="driver-details">
            <h1>{user.name}</h1>
            <p className="driver-vehicle">
              {driverProfile.vehicle_color} {driverProfile.vehicle_year} {driverProfile.vehicle_make} {driverProfile.vehicle_model}
            </p>
            <p className="license-plate">{driverProfile.license_plate}</p>
          </div>
        </div>
        <div className="driver-controls">
          <button
            onClick={toggleOnlineStatus}
            className={`btn status-toggle ${isOnline ? 'online' : 'offline'}`}
          >
            {isOnline ? '🟢 Online' : '🔴 Go Online'}
          </button>
          <div className="rating-display">
            ⭐ {driverStats.rating}/5.0
          </div>
          <a href="/api/auth/logout" className="btn btn-logout">
            🚪 Logout
          </a>
        </div>
      </header>

      {/* Current Ride Section */}
      {currentRide ? (
        <section className="current-ride-section">
          <div className="section-header">
            <h2>🚗 Current Ride</h2>
            <span className={`ride-status ${currentRide.status}`}>
              {currentRide.status === 'accepted' && '🎯 Going to pickup'}
              {currentRide.status === 'pickup' && '🚶 At pickup location'}
              {currentRide.status === 'in_progress' && '🚗 En route to destination'}
            </span>
          </div>

          <div className="ride-content">
            <div className="ride-info-grid">
              <div className="passenger-card">
                <h3>👤 Passenger</h3>
                <div className="passenger-details">
                  <p className="passenger-name">{currentRide.passenger?.name}</p>
                  <p className="passenger-phone">📞 {currentRide.passenger?.phone}</p>
                  <p className="passenger-rating">⭐ 4.9/5.0</p>
                </div>
                <div className="passenger-actions">
                  <button className="btn btn-secondary">📞 Call</button>
                  <button className="btn btn-secondary">💬 Message</button>
                  <button 
                    onClick={() => updateRideStatus('completed')}
                    className="btn btn-success"
                    title="Complete this ride immediately"
                  >
                    🏁 Complete Ride
                  </button>
                  <button 
                    onClick={cancelRide}
                    className="btn btn-warning"
                    title="Cancel this ride immediately"
                  >
                    🚫 Cancel Ride
                  </button>
                </div>
              </div>

              <div className="trip-details-card">
                <h3>📍 Trip Details</h3>
                <div className="location-info">
                  <div className="location-item pickup">
                    <span className="location-icon">🎯</span>
                    <div>
                      <p className="location-label">Pickup</p>
                      <p className="location-address">{currentRide.pickup_address}</p>
                    </div>
                  </div>
                  <div className="location-divider">└─────┘</div>
                  <div className="location-item destination">
                    <span className="location-icon">📍</span>
                    <div>
                      <p className="location-label">Destination</p>
                      <p className="location-address">{currentRide.destination_address}</p>
                    </div>
                  </div>
                </div>
                <div className="trip-metrics">
                  <div className="metric">
                    <span className="metric-label">Distance</span>
                    <span className="metric-value">{currentRide.estimated_distance?.toFixed(1)} km</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Fare</span>
                    <span className="metric-value">${currentRide.estimated_fare}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Duration</span>
                    <span className="metric-value">{currentRide.estimated_duration} min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="map-section">
              <div className="map-header">
                <h3>🗺️ Navigation</h3>
                <div className="map-controls">
                  <button className="btn btn-sm">🧭 Directions</button>
                  <button className="btn btn-sm">🛣️ Route Options</button>
                </div>
              </div>
              <div className="map-container">
                <div className="map-placeholder">
                  <div className="route-visualization">
                    <div className="route-point start">
                      <span className="point-icon">🚗</span>
                      <span className="point-label">You</span>
                    </div>
                    <div className="route-line"></div>
                    <div className="route-point pickup">
                      <span className="point-icon">🎯</span>
                      <span className="point-label">Pickup</span>
                    </div>
                    <div className="route-line"></div>
                    <div className="route-point destination">
                      <span className="point-icon">📍</span>
                      <span className="point-label">Drop-off</span>
                    </div>
                  </div>
                  <div className="navigation-info">
                    <div className="nav-item">
                      <span className="nav-icon">⏱️</span>
                      <span>ETA: {currentRide.status === 'accepted' ? '5 min' : `${currentRide.estimated_duration} min`}</span>
                    </div>
                    <div className="nav-item">
                      <span className="nav-icon">🛣️</span>
                      <span>Fastest route selected</span>
                    </div>
                    <div className="nav-item">
                      <span className="nav-icon">🤖</span>
                      <span>AI assistance active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ride Actions */}
            <div className="ride-actions">
              {currentRide.status === 'accepted' && (
                <>
                  <button 
                    onClick={() => updateRideStatus('pickup')}
                    className="btn btn-success btn-large"
                  >
                    🚶 Arrived for Pickup
                  </button>
                  <button 
                    onClick={cancelRide}
                    className="btn btn-danger"
                  >
                    ❌ Cancel Ride
                  </button>
                </>
              )}
              
              {currentRide.status === 'pickup' && (
                <>
                  <button 
                    onClick={() => updateRideStatus('in_progress')}
                    className="btn btn-success btn-large"
                  >
                    🚗 Start Trip
                  </button>
                  <button 
                    onClick={cancelRide}
                    className="btn btn-danger"
                  >
                    ❌ Cancel Ride
                  </button>
                </>
              )}
              
              {currentRide.status === 'in_progress' && (
                <>
                  <button 
                    onClick={() => updateRideStatus('completed')}
                    className="btn btn-success btn-large"
                  >
                    ✅ Complete Trip
                  </button>
                  <button 
                    onClick={cancelRide}
                    className="btn btn-danger"
                  >
                    ❌ End Ride Early
                  </button>
                </>
              )}
              
              {/* Always Available Quick Actions */}
              <div className="quick-actions">
                <button 
                  onClick={() => updateRideStatus('completed')}
                  className="btn btn-primary btn-complete-now"
                  title="Complete this ride immediately"
                >
                  🏁 Complete Ride Now
                </button>
                <button 
                  onClick={cancelRide}
                  className="btn btn-secondary btn-cancel-now"
                  title="Cancel this ride immediately"
                >
                  🚫 Cancel Ride Now
                </button>
              </div>
            </div>
          </div>

          {/* AI Agent Integration */}
          <AIAgentIntegration
            rideId={currentRide.id}
            passengerId={currentRide.passenger_id}
            driverId={currentRide.driver_id}
            pickup={{
              lat: currentRide.pickup_latitude,
              lng: currentRide.pickup_longitude,
              address: currentRide.pickup_address
            }}
            destination={{
              lat: currentRide.destination_latitude,
              lng: currentRide.destination_longitude,
              address: currentRide.destination_address
            }}
            rideStatus={currentRide.status}
          />
        </section>
      ) : (
        /* Available Rides Section */
        <section className="available-rides-section">
          <div className="section-header">
            <h2>📍 Available Rides</h2>
            <span className="ride-count">{availableRides.length} requests</span>
          </div>

          {!isOnline ? (
            <div className="offline-message">
              <div className="offline-card">
                <span className="offline-icon">🔴</span>
                <h3>You're offline</h3>
                <p>Go online to start receiving ride requests</p>
                <button onClick={toggleOnlineStatus} className="btn btn-primary">
                  🟢 Go Online
                </button>
              </div>
            </div>
          ) : newRideNotification ? (
            <div className="notification-banner">
              {newRideNotification}
            </div>
          ) : availableRides.length === 0 ? (
            <div className="no-rides-message">
              <div className="searching-animation">
                <div className="pulse-circle"></div>
                <span className="search-icon">🔍</span>
              </div>
              <h3>Looking for ride requests...</h3>
              <p>Stay online and we'll notify you when new rides become available</p>
            </div>
          ) : (
            <div className="rides-grid">
              {availableRides.map(ride => {
                const distance = location ? RideshareDB.calculateDistance(
                  location.lat, location.lng,
                  ride.pickup_latitude, ride.pickup_longitude
                ).toFixed(1) : 'N/A';
                
                return (
                  <div key={ride.id} className="ride-request-card">
                    <div className="ride-card-header">
                      <div className="passenger-info">
                        <span className="passenger-icon">👤</span>
                        <span className="passenger-name">{ride.passenger?.name || 'Passenger'}</span>
                      </div>
                      <div className="ride-distance">{distance} km away</div>
                    </div>
                    
                    <div className="ride-card-route">
                      <div className="route-point">
                        <span className="route-icon">🎯</span>
                        <span className="route-address">{ride.pickup_address}</span>
                      </div>
                      <div className="route-arrow">→</div>
                      <div className="route-point">
                        <span className="route-icon">📍</span>
                        <span className="route-address">{ride.destination_address}</span>
                      </div>
                    </div>
                    
                    <div className="ride-card-details">
                      <div className="ride-metric">
                        <span className="metric-icon">💰</span>
                        <span className="metric-text">${ride.estimated_fare}</span>
                      </div>
                      <div className="ride-metric">
                        <span className="metric-icon">📏</span>
                        <span className="metric-text">{ride.estimated_distance?.toFixed(1)} km</span>
                      </div>
                      <div className="ride-metric">
                        <span className="metric-icon">⏱️</span>
                        <span className="metric-text">{ride.estimated_duration} min</span>
                      </div>
                    </div>
                    
                    <div className="ride-card-actions">
                      <button 
                        onClick={() => acceptRide(ride.id)}
                        className="btn btn-success"
                      >
                        ✅ Accept
                      </button>
                      <button 
                        onClick={() => rejectRide(ride.id)}
                        className="btn btn-secondary"
                      >
                        ❌ Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* AI Experience & Passenger Insights Section */}
      <section className="ai-experience-section">
        <div className="section-header">
          <h2>🤖 AI Experience Dashboard</h2>
          <span className="ai-status">🟢 AI Active</span>
        </div>

        <div className="ai-dashboard-grid">
          {/* Enhanced AI Features */}
          <div className="ai-features-card enhanced">
            <h3>🤖 AI Capabilities</h3>
            <div className="ai-features-grid">
              <div className="ai-feature-item">
                <div className="ai-feature-header">
                  <span className="ai-icon large">🛡️</span>
                  <div>
                    <span className="ai-title">Safety Monitoring</span>
                    <span className="ai-status-indicator active">Active</span>
                  </div>
                </div>
                <p className="ai-desc">Real-time safety analysis, speed monitoring, and route hazard detection</p>
                <div className="ai-metrics">
                  <span className="metric">🚗 Speed: 45 km/h</span>
                  <span className="metric">⚠️ Alerts: 0</span>
                </div>
              </div>

              <div className="ai-feature-item">
                <div className="ai-feature-header">
                  <span className="ai-icon large">🗺️</span>
                  <div>
                    <span className="ai-title">Smart Routing</span>
                    <span className="ai-status-indicator active">Active</span>
                  </div>
                </div>
                <p className="ai-desc">Optimized routes, traffic analysis, and dynamic re-routing</p>
                <div className="ai-metrics">
                  <span className="metric">🚦 Traffic: Light</span>
                  <span className="metric">⏱️ ETA: On time</span>
                </div>
              </div>

              <div className="ai-feature-item">
                <div className="ai-feature-header">
                  <span className="ai-icon large">🎵</span>
                  <div>
                    <span className="ai-title">Passenger Preferences</span>
                    <span className="ai-status-indicator active">Learning</span>
                  </div>
                </div>
                <p className="ai-desc">Music preferences, climate control, and conversation style</p>
                <div className="ai-metrics">
                  <span className="metric">🎶 Jazz Preferred</span>
                  <span className="metric">🌡️ 22°C</span>
                </div>
              </div>

              <div className="ai-feature-item">
                <div className="ai-feature-header">
                  <span className="ai-icon large">💬</span>
                  <div>
                    <span className="ai-title">Communication Assistant</span>
                    <span className="ai-status-indicator active">Ready</span>
                  </div>
                </div>
                <p className="ai-desc">Natural conversation help and passenger interaction insights</p>
                <div className="ai-metrics">
                  <span className="metric">💬 Quiet ride</span>
                  <span className="metric">😊 Mood: Good</span>
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Insights */}
          {currentRide && (
            <div className="passenger-insights-card">
              <h3>👤 Passenger Insights</h3>
              <div className="passenger-profile">
                <div className="passenger-avatar">
                  <img src="/default-passenger.png" alt="Passenger" />
                  <div className="passenger-status">
                    <span className="status-dot"></span>
                    Verified
                  </div>
                </div>
                <div className="passenger-info">
                  <h4>{currentRide.passenger?.name || 'Anonymous Passenger'}</h4>
                  <p className="passenger-level">🌟 Gold Member</p>
                  <div className="passenger-stats">
                    <div className="stat">
                      <span className="stat-label">Rating</span>
                      <span className="stat-value">4.9 ⭐</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Rides</span>
                      <span className="stat-value">47</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Member</span>
                      <span className="stat-value">2 years</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="passenger-preferences">
                <h4>🎯 AI-Learned Preferences</h4>
                <div className="preferences-grid">
                  <div className="preference-item">
                    <span className="pref-icon">🎵</span>
                    <div>
                      <span className="pref-label">Music</span>
                      <span className="pref-value">Jazz, Classical</span>
                    </div>
                  </div>
                  <div className="preference-item">
                    <span className="pref-icon">🌡️</span>
                    <div>
                      <span className="pref-label">Temperature</span>
                      <span className="pref-value">22°C</span>
                    </div>
                  </div>
                  <div className="preference-item">
                    <span className="pref-icon">💬</span>
                    <div>
                      <span className="pref-label">Conversation</span>
                      <span className="pref-value">Minimal</span>
                    </div>
                  </div>
                  <div className="preference-item">
                    <span className="pref-icon">📱</span>
                    <div>
                      <span className="pref-label">Phone Use</span>
                      <span className="pref-value">Business calls</span>
                    </div>
                  </div>
                  <div className="preference-item">
                    <span className="pref-icon">🚗</span>
                    <div>
                      <span className="pref-label">Driving Style</span>
                      <span className="pref-value">Smooth</span>
                    </div>
                  </div>
                  <div className="preference-item">
                    <span className="pref-icon">⏰</span>
                    <div>
                      <span className="pref-label">Punctuality</span>
                      <span className="pref-value">Very important</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ai-recommendations">
                <h4>🤖 AI Recommendations</h4>
                <div className="recommendations-list">
                  <div className="recommendation">
                    <span className="rec-icon">🎵</span>
                    <span>Play ambient jazz playlist</span>
                  </div>
                  <div className="recommendation">
                    <span className="rec-icon">🌡️</span>
                    <span>Set AC to 22°C</span>
                  </div>
                  <div className="recommendation">
                    <span className="rec-icon">💬</span>
                    <span>Keep conversation professional and brief</span>
                  </div>
                  <div className="recommendation">
                    <span className="rec-icon">🚗</span>
                    <span>Maintain smooth acceleration/braking</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Driver Performance Section */}
      <section className="experience-section">
        <div className="experience-grid">
          <div className="stats-card">
            <h3>📊 Your Performance</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{driverStats.totalRides}</span>
                <span className="stat-label">Total Rides</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">⭐ {driverStats.rating}</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">${driverStats.totalEarnings}</span>
                <span className="stat-label">Total Earned</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{driverStats.onlineTime}</span>
                <span className="stat-label">Online Today</span>
              </div>
            </div>
          </div>

          <div className="today-summary-card">
            <h3>📅 Today's Summary</h3>
            <div className="today-stats">
              <div className="today-item">
                <span className="today-icon">🚗</span>
                <div>
                  <span className="today-value">{driverStats.todayRides}</span>
                  <span className="today-label">Rides completed</span>
                </div>
              </div>
              <div className="today-item">
                <span className="today-icon">💰</span>
                <div>
                  <span className="today-value">${driverStats.todayEarnings}</span>
                  <span className="today-label">Earnings</span>
                </div>
              </div>
              <div className="today-item">
                <span className="today-icon">⏰</span>
                <div>
                  <span className="today-value">{driverStats.onlineTime}</span>
                  <span className="today-label">Time online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .driver-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .driver-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .driver-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .driver-avatar {
          position: relative;
        }

        .driver-avatar img {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .status-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .driver-details h1 {
          margin: 0;
          font-size: 28px;
          color: #1a202c;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .driver-vehicle {
          margin: 8px 0;
          color: #4a5568;
          font-weight: 600;
          font-size: 16px;
        }

        .license-plate {
          margin: 0;
          color: #718096;
          font-size: 15px;
          font-weight: 500;
          background: #f7fafc;
          padding: 4px 12px;
          border-radius: 8px;
          display: inline-block;
        }

        .driver-controls {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .status-toggle {
          padding: 16px 28px;
          border-radius: 30px;
          border: none;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          letter-spacing: 0.025em;
        }

        .status-toggle.online {
          background: linear-gradient(135deg, #48bb78, #38a169);
          color: white;
        }

        .status-toggle.online:hover {
          background: linear-gradient(135deg, #38a169, #2f855a);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
        }

        .status-toggle.offline {
          background: linear-gradient(135deg, #e2e8f0, #cbd5e0);
          color: #4a5568;
        }

        .status-toggle.offline:hover {
          background: linear-gradient(135deg, #cbd5e0, #a0aec0);
          transform: translateY(-2px);
        }

        .rating-display {
          font-size: 20px;
          font-weight: 700;
          color: #f6ad55;
          background: rgba(246, 173, 85, 0.1);
          padding: 12px 20px;
          border-radius: 20px;
          border: 2px solid rgba(246, 173, 85, 0.2);
        }

        .current-ride-section,
        .available-rides-section,
        .experience-section,
        .ai-experience-section {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .ai-experience-section {
          background: rgba(255,255,255,0.08);
          border-radius: 32px;
          margin-bottom: 40px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ai-status {
          background: rgba(72, 187, 120, 0.15);
          color: #22c55e;
          padding: 12px 24px;
          border-radius: 30px;
          font-weight: 700;
          border: 2px solid rgba(72, 187, 120, 0.2);
          box-shadow: 0 4px 12px rgba(72, 187, 120, 0.2);
        }

        .ai-dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
        }

        .ai-features-card.enhanced {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 28px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          border: 2px solid rgba(66, 153, 225, 0.2);
          backdrop-filter: blur(20px);
        }

        .ai-features-card.enhanced h3 {
          margin: 0 0 30px 0;
          color: #2d3748;
          font-size: 28px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        .ai-features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 25px;
        }

        .ai-feature-item {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-radius: 20px;
          padding: 25px;
          border: 2px solid rgba(226, 232, 240, 0.5);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .ai-feature-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 0%, rgba(66, 153, 225, 0.03) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .ai-feature-item:hover::before {
          opacity: 1;
        }

        .ai-feature-item:hover {
          border-color: #4299e1;
          transform: translateY(-8px);
          box-shadow: 0 15px 40px rgba(66, 153, 225, 0.2);
        }

        .ai-feature-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 10px;
        }

        .ai-icon.large {
          font-size: 24px;
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #4299e1, #667eea);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-title {
          display: block;
          font-weight: bold;
          color: #2d3748;
          font-size: 16px;
        }

        .ai-status-indicator {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 10px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ai-status-indicator.active {
          background: #c6f6d5;
          color: #22543d;
        }

        .ai-desc {
          color: #4a5568;
          margin-bottom: 15px;
          line-height: 1.4;
        }

        .ai-metrics {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .ai-metrics .metric {
          background: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: bold;
          color: #2d3748;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .passenger-insights-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          border: 3px solid #48bb78;
        }

        .passenger-insights-card h3 {
          margin: 0 0 25px 0;
          color: #2d3748;
          font-size: 20px;
        }

        .passenger-insights-card h4 {
          margin: 0 0 15px 0;
          color: #2d3748;
          font-size: 16px;
        }

        .passenger-profile {
          margin-bottom: 25px;
        }

        .passenger-avatar {
          position: relative;
          margin-bottom: 15px;
          text-align: center;
        }

        .passenger-avatar img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid #e2e8f0;
        }

        .passenger-status {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 12px;
          color: #48bb78;
          font-weight: bold;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #48bb78;
          border-radius: 50%;
        }

        .passenger-info h4 {
          text-align: center;
          margin-bottom: 5px;
          font-size: 18px;
        }

        .passenger-level {
          text-align: center;
          color: #f6ad55;
          margin-bottom: 15px;
          font-weight: bold;
        }

        .passenger-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .passenger-stats .stat {
          text-align: center;
          background: #f8fafc;
          padding: 10px;
          border-radius: 8px;
        }

        .stat-label {
          display: block;
          font-size: 11px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }

        .stat-value {
          display: block;
          font-weight: bold;
          color: #2d3748;
          font-size: 14px;
        }

        .preferences-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 25px;
        }

        .preference-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .pref-icon {
          font-size: 16px;
        }

        .pref-label {
          display: block;
          font-size: 12px;
          color: #718096;
          margin-bottom: 2px;
        }

        .pref-value {
          display: block;
          font-weight: bold;
          color: #2d3748;
          font-size: 13px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .recommendation {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #e6fffa;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #81e6d9;
          font-size: 14px;
          color: #234e52;
        }

        .rec-icon {
          font-size: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .section-header h2 {
          color: white;
          font-size: 28px;
          margin: 0;
        }

        .ride-status {
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
        }

        .ride-count {
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
        }

        .ride-content {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .ride-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .passenger-card,
        .trip-details-card {
          background: #f8fafc;
          border-radius: 15px;
          padding: 25px;
        }

        .passenger-card h3,
        .trip-details-card h3 {
          margin: 0 0 20px 0;
          color: #2d3748;
        }

        .passenger-details {
          margin-bottom: 20px;
        }

        .passenger-name {
          font-size: 20px;
          font-weight: bold;
          margin: 0 0 8px 0;
          color: #1a202c;
        }

        .passenger-phone,
        .passenger-rating {
          margin: 5px 0;
          color: #4a5568;
        }

        .passenger-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .passenger-actions .btn {
          flex: 1;
          min-width: 100px;
          font-size: 14px;
          padding: 10px 12px;
        }

        .location-info {
          margin-bottom: 25px;
        }

        .location-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }

        .location-icon {
          font-size: 18px;
          margin-top: 2px;
        }

        .location-label {
          font-weight: bold;
          color: #2d3748;
          margin: 0 0 5px 0;
          font-size: 14px;
        }

        .location-address {
          margin: 0;
          color: #4a5568;
          line-height: 1.4;
        }

        .location-divider {
          text-align: center;
          color: #cbd5e0;
          margin: 10px 0;
          font-family: monospace;
        }

        .trip-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .metric {
          text-align: center;
          background: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .metric-label {
          display: block;
          font-size: 12px;
          color: #718096;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          display: block;
          font-size: 18px;
          font-weight: bold;
          color: #2d3748;
        }

        .map-section {
          margin-bottom: 30px;
        }

        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .map-header h3 {
          margin: 0;
          color: #2d3748;
        }

        .map-controls {
          display: flex;
          gap: 10px;
        }

        .map-container {
          background: #f1f5f9;
          border-radius: 15px;
          padding: 30px;
          min-height: 300px;
        }

        .route-visualization {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          position: relative;
        }

        .route-point {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 2;
        }

        .point-icon {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .point-label {
          font-size: 12px;
          font-weight: bold;
          color: #4a5568;
        }

        .route-line {
          flex: 1;
          height: 3px;
          background: linear-gradient(90deg, #4299e1, #48bb78);
          margin: 0 20px;
          border-radius: 2px;
          position: relative;
        }

        .navigation-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .nav-icon {
          font-size: 18px;
        }

        .ride-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .offline-message,
        .no-rides-message {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        .offline-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .offline-icon {
          font-size: 48px;
          margin-bottom: 20px;
          display: block;
        }

        .offline-card h3 {
          margin: 0 0 10px 0;
          color: #2d3748;
        }

        .offline-card p {
          color: #4a5568;
          margin-bottom: 25px;
        }

        .searching-animation {
          position: relative;
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .pulse-circle {
          width: 80px;
          height: 80px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .search-icon {
          position: absolute;
          font-size: 32px;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .no-rides-message {
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 60px;
          text-align: center;
          color: white;
        }

        .no-rides-message h3 {
          margin: 0 0 10px 0;
        }

        .notification-banner {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 20px;
          border-radius: 15px;
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 20px;
          animation: slideIn 0.5s ease;
        }

        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .rides-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
        }

        .ride-request-card {
          background: white;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }

        .ride-request-card:hover {
          transform: translateY(-5px);
        }

        .ride-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .passenger-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .passenger-icon {
          font-size: 20px;
        }

        .passenger-name {
          font-weight: bold;
          color: #2d3748;
        }

        .ride-distance {
          background: #edf2f7;
          color: #4a5568;
          padding: 5px 12px;
          border-radius: 15px;
          font-size: 14px;
          font-weight: bold;
        }

        .ride-card-route {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .route-point {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .route-icon {
          font-size: 16px;
        }

        .route-address {
          font-size: 14px;
          color: #4a5568;
          line-height: 1.3;
        }

        .route-arrow {
          color: #cbd5e0;
          font-weight: bold;
        }

        .ride-card-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 10px;
        }

        .ride-metric {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .metric-icon {
          font-size: 16px;
        }

        .metric-text {
          font-weight: bold;
          color: #2d3748;
        }

        .ride-card-actions {
          display: flex;
          gap: 12px;
        }

        .ride-card-actions .btn {
          flex: 1;
        }

        .experience-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 25px;
        }

        .stats-card,
        .today-summary-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }

        .stats-card h3,
        .today-summary-card h3 {
          margin: 0 0 25px 0;
          color: #2d3748;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .stat-item {
          text-align: center;
          background: #f8fafc;
          padding: 20px;
          border-radius: 15px;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 14px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .today-stats {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .today-item {
          display: flex;
          align-items: center;
          gap: 15px;
          background: #f8fafc;
          padding: 20px;
          border-radius: 15px;
        }

        .today-icon {
          font-size: 24px;
        }

        .today-value {
          display: block;
          font-size: 20px;
          font-weight: bold;
          color: #2d3748;
        }

        .today-label {
          font-size: 14px;
          color: #718096;
        }

        .btn {
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: #4299e1;
          color: white;
        }

        .btn-primary:hover {
          background: #3182ce;
          transform: translateY(-2px);
        }

        .btn-success {
          background: #48bb78;
          color: white;
        }

        .btn-success:hover {
          background: #38a169;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        .btn-danger {
          background: #f56565;
          color: white;
        }

        .btn-danger:hover {
          background: #e53e3e;
        }

        .btn-warning {
          background: #ed8936;
          color: white;
        }

        .btn-warning:hover {
          background: #dd6b20;
        }

        .btn-logout {
          background: #718096;
          color: white;
          font-size: 14px;
          padding: 10px 16px;
        }

        .btn-logout:hover {
          background: #4a5568;
          transform: translateY(-2px);
        }

        .btn-demo {
          border: 2px dashed #ed8936;
          background: rgba(237, 137, 54, 0.1);
          color: #ed8936;
          font-size: 14px;
          margin-top: 15px;
          transition: all 0.3s ease;
        }

        .btn-demo:hover {
          background: #ed8936;
          color: white;
          transform: translateY(-2px);
        }

        .demo-actions {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px dashed #e2e8f0;
        }

        .quick-actions {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 25px;
          padding: 20px;
          background: rgba(66, 153, 225, 0.1);
          border-radius: 15px;
          border: 2px solid rgba(66, 153, 225, 0.2);
        }

        .btn-complete-now {
          background: linear-gradient(135deg, #48bb78, #38a169);
          color: white;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
          border: none;
        }

        .btn-complete-now:hover {
          background: linear-gradient(135deg, #38a169, #2f855a);
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
        }

        .btn-cancel-now {
          background: #e2e8f0;
          color: #4a5568;
          border: 2px solid #cbd5e0;
        }

        .btn-cancel-now:hover {
          background: #cbd5e0;
          border-color: #a0aec0;
          transform: translateY(-2px);
        }

        .btn-large {
          padding: 16px 32px;
          font-size: 16px;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 14px;
        }

        .container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          color: white;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-section {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          padding: 30px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 45px;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 450px;
          width: 100%;
        }

        .login-header h1 {
          margin: 0 0 15px 0;
          color: #2d3748;
          font-weight: 800;
          font-size: 2.5rem;
          text-shadow: 0 2px 8px rgba(45, 55, 72, 0.15);
        }

        .login-header p {
          color: rgba(74, 85, 104, 0.8);
          margin-bottom: 35px;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.025em;
        }

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 35px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 15px;
          background: rgba(248, 250, 252, 0.9);
          backdrop-filter: blur(10px);
          padding: 18px;
          border-radius: 16px;
          border: 1px solid rgba(248, 250, 252, 0.5);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .feature:hover {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-2px);
        }

        .feature-icon {
          font-size: 22px;
        }

        .alternative-login {
          margin-top: 35px;
          padding-top: 25px;
          border-top: 1px solid rgba(226, 232, 240, 0.3);
          text-align: center;
        }

        .alternative-login p {
          color: rgba(113, 128, 150, 0.8);
          margin-bottom: 18px;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.025em;
        }

        @media (max-width: 768px) {
          .driver-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .driver-controls {
            flex-direction: column;
            gap: 10px;
          }

          .ai-dashboard-grid {
            grid-template-columns: 1fr;
          }

          .ai-features-grid {
            grid-template-columns: 1fr;
          }

          .preferences-grid {
            grid-template-columns: 1fr;
          }

          .passenger-stats {
            grid-template-columns: 1fr;
          }

          .ride-info-grid {
            grid-template-columns: 1fr;
          }

          .navigation-info {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .ride-card-details {
            flex-direction: column;
            gap: 10px;
          }

          .ride-card-actions {
            flex-direction: column;
          }

          .experience-grid {
            grid-template-columns: 1fr;
          }

          .rides-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

// Driver Setup Component
function DriverSetup({ onProfileCreated }: { onProfileCreated: (data: any) => void }) {
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
        <div className="card">
          <h1>🚗 Driver Registration</h1>
          <h2>Complete your profile to start driving</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Driver's License Number</label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                required
                className="form-control"
                placeholder="Enter your license number"
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
                  placeholder="Honda, Toyota, etc."
                />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input
                  type="text"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleModel: e.target.value }))}
                  required
                  className="form-control"
                  placeholder="Civic, Corolla, etc."
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
                  placeholder="Blue, Red, etc."
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
                placeholder="ABC123"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-large">
              🚗 Complete Registration
            </button>
          </form>

          <style jsx>{`
            .setup-form {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
            }

            .card {
              background: white;
              border-radius: 20px;
              padding: 40px;
              max-width: 600px;
              width: 100%;
              box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            }

            .card h1 {
              text-align: center;
              margin: 0 0 10px 0;
              color: #2d3748;
              font-size: 28px;
            }

            .card h2 {
              text-align: center;
              margin: 0 0 40px 0;
              color: #4a5568;
              font-weight: normal;
              font-size: 18px;
            }

            .form-group {
              margin-bottom: 25px;
            }

            .form-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }

            .form-group label {
              display: block;
              margin-bottom: 8px;
              color: #2d3748;
              font-weight: bold;
            }

            .form-control {
              width: 100%;
              padding: 15px;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              font-size: 16px;
              transition: border-color 0.3s ease;
            }

            .form-control:focus {
              outline: none;
              border-color: #4299e1;
              box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
            }

            .btn {
              padding: 12px 20px;
              border: none;
              border-radius: 10px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }

            .btn-primary {
              background: #4299e1;
              color: white;
            }

            .btn-primary:hover {
              background: #3182ce;
              transform: translateY(-2px);
            }

            .btn-large {
              padding: 16px 32px;
              font-size: 16px;
              width: 100%;
              margin-top: 20px;
            }

            @media (max-width: 768px) {
              .form-row {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}