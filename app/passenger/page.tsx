'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import { RideshareDB, Ride } from '@/lib/rideshare-db';
import AIAgentIntegration from '@/components/AIAgentIntegration';
import PassengerPreferencesComponent from '@/components/PassengerPreferences';

export default function PassengerPage() {
  const { user, isLoading } = useUser();
  const [isBooking, setIsBooking] = useState(false);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [rideForm, setRideForm] = useState({
    pickup: '',
    destination: '',
    pickupCoords: null as { lat: number; lng: number } | null,
    destinationCoords: null as { lat: number; lng: number } | null
  });

  // Get user's current location on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // First set with generic name
          setRideForm(prev => ({
            ...prev,
            pickup: 'Getting location...',
            pickupCoords: { lat: latitude, lng: longitude }
          }));

          // Then get actual address name
          try {
            const response = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
            const data = await response.json();
            
            setRideForm(prev => ({
              ...prev,
              pickup: data.address || 'Current Location',
              pickupCoords: { lat: latitude, lng: longitude }
            }));
          } catch (error) {
            console.error('Error getting address:', error);
            setRideForm(prev => ({
              ...prev,
              pickup: 'Current Location',
              pickupCoords: { lat: latitude, lng: longitude }
            }));
          }
        },
        () => {
          // If location denied, leave pickup empty for user to enter manually
          setRideForm(prev => ({
            ...prev,
            pickup: '',
            pickupCoords: null
          }));
        }
      );
    }
  }, []);

  // Check for existing active ride
  useEffect(() => {
    if (user?.sub) {
      checkActiveRide();
    }
  }, [user]);

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

  const checkActiveRide = async () => {
    try {
      if (!user?.sub) return;
      
      const dbUser = await RideshareDB.getUserByAuth0Id(user.sub);
      if (!dbUser) return;

      const rides = await RideshareDB.getRidesForUser(dbUser.id);
      const activeRide = rides.find((ride: Ride) => 
        ['requested', 'searching', 'accepted', 'pickup', 'in_progress'].includes(ride.status)
      );

      if (activeRide) {
        setCurrentRide(activeRide);
      }
    } catch (error) {
      console.error('Error checking active ride:', error);
    }
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(`/api/geocode/forward?address=${encodeURIComponent(address)}`);
      const data = await response.json();
      return data.coordinates || null;
    } catch (error) {
      return null;
    }
  };

  const handleDestinationChange = async (destination: string) => {
    setRideForm(prev => ({ ...prev, destination }));
    
    if (destination.length > 3) {
      const coords = await geocodeAddress(destination);
      setRideForm(prev => ({ ...prev, destinationCoords: coords }));
    }
  };

  const handlePickupChange = async (pickup: string) => {
    setRideForm(prev => ({ ...prev, pickup }));
    
    if (pickup.length > 2) {
      // Fetch autocomplete suggestions
      try {
        const response = await fetch(`/api/geocode/forward?address=${encodeURIComponent(pickup)}`);
        const data = await response.json();
        
        if (data.suggestions) {
          setPickupSuggestions(data.suggestions);
          setShowPickupSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching pickup suggestions:', error);
      }
    } else {
      setShowPickupSuggestions(false);
      setPickupSuggestions([]);
    }
  };

  const selectPickupSuggestion = async (suggestion: string) => {
    setRideForm(prev => ({ ...prev, pickup: suggestion }));
    setShowPickupSuggestions(false);
    setPickupSuggestions([]);
    
    // Geocode the selected address
    const coords = await geocodeAddress(suggestion);
    setRideForm(prev => ({ ...prev, pickupCoords: coords }));
  };

  const bookRide = async () => {
    if (!user?.sub || !rideForm.destinationCoords) {
      alert('Please complete all fields');
      return;
    }

    // If pickup coordinates are not available, try to geocode the pickup address
    if (!rideForm.pickupCoords && rideForm.pickup) {
      const coords = await geocodeAddress(rideForm.pickup);
      if (coords) {
        setRideForm(prev => ({ ...prev, pickupCoords: coords }));
      } else {
        alert('Unable to find pickup location. Please try a different address.');
        return;
      }
    }

    if (!rideForm.pickupCoords) {
      alert('Please enter a pickup location');
      return;
    }

    setIsBooking(true);
    
    try {
      // Ensure user exists in database
      let dbUser = await RideshareDB.getUserByAuth0Id(user.sub);
      if (!dbUser) {
        dbUser = await RideshareDB.createUser({
          auth0_id: user.sub,
          email: user.email!,
          name: user.name!,
          user_type: 'passenger'
        });
      }

      // Calculate distance and fare
      const distance = RideshareDB.calculateDistance(
        rideForm.pickupCoords.lat,
        rideForm.pickupCoords.lng,
        rideForm.destinationCoords.lat,
        rideForm.destinationCoords.lng
      );

      const baseFare = 3.50;
      const perKm = 1.25;
      const fare = baseFare + (distance * perKm);

      // Create ride
      const ride = await RideshareDB.createRide({
        passenger_id: dbUser.id,
        pickup_address: rideForm.pickup,
        pickup_latitude: rideForm.pickupCoords.lat,
        pickup_longitude: rideForm.pickupCoords.lng,
        destination_address: rideForm.destination,
        destination_latitude: rideForm.destinationCoords.lat,
        destination_longitude: rideForm.destinationCoords.lng,
        estimated_distance: distance,
        estimated_duration: Math.round(distance * 2),
        estimated_fare: Math.round(fare * 100) / 100,
        status: 'searching',
        safety_score: 100
      });

      setCurrentRide(ride);

      // Start AI agent ride preparation
      await fetch('/api/agent/prepare-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rideId: ride.id,
          passengerId: dbUser.id,
          driverId: null
        })
      });

    } catch (error) {
      console.error('Error booking ride:', error);
      alert('Failed to book ride. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const cancelRide = async () => {
    if (!currentRide) return;
    
    try {
      await RideshareDB.updateRideStatus(currentRide.id, 'cancelled');
      setCurrentRide(null);
    } catch (error) {
      console.error('Error cancelling ride:', error);
    }
  };

  const endRide = async () => {
    if (!currentRide) return;
    
    const confirmed = window.confirm('Are you sure you want to end this ride?');
    if (!confirmed) return;
    
    try {
      console.log('🏁 Passenger ending ride:', currentRide.id);
      await RideshareDB.updateRideStatus(currentRide.id, 'completed');
      setCurrentRide(null);
      alert('🎉 Ride completed! Thank you for choosing RouteWise AI.');
    } catch (error) {
      console.error('Error ending ride:', error);
      alert('Failed to end ride. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="login-required">
          <div className="card">
            <h1>👥 Passenger Login</h1>
            <p>Sign in to book rides with AI assistance</p>
            <a href="/api/auth/login?returnTo=/passenger&role=passenger" className="btn btn-primary">
              👥 Sign In as Passenger
            </a>
            <div className="alternative-login">
              <p>Are you a driver?</p>
              <a href="/api/auth/login?returnTo=/driver&role=driver" className="btn btn-secondary">
                🚗 Sign In as Driver
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentRide) {
    return (
      <div className="container">
        <h1>🚖 Your Ride</h1>
        
        <div className="ride-status">
          <div className="card">
            <h2>
              {currentRide.status === 'searching' && '🔍 Finding Driver...'}
              {currentRide.status === 'accepted' && '🎉 Driver Found!'}
              {currentRide.status === 'pickup' && '🚶 Driver Arriving'}
              {currentRide.status === 'in_progress' && '🚗 En Route'}
              {currentRide.status === 'completed' && '🏁 Ride Completed!'}
            </h2>

            <div className="ride-details">
              <p><strong>From:</strong> {currentRide.pickup_address}</p>
              <p><strong>To:</strong> {currentRide.destination_address}</p>
              <p><strong>Fare:</strong> ${currentRide.estimated_fare}</p>
              <p><strong>Distance:</strong> {currentRide.estimated_distance?.toFixed(1)} km</p>
            </div>

            {currentRide.driver && (
              <div className="driver-info">
                <h3>Your Driver</h3>
                <p><strong>Name:</strong> {currentRide.driver.name}</p>
                <p><strong>Phone:</strong> {currentRide.driver.phone}</p>
                <p><strong>Rating:</strong> ⭐ 4.8/5.0</p>
              </div>
            )}

            {currentRide.ai_insights && (
              <div className="ai-enhancements">
                <h3>🤖 AI Enhancements</h3>
                <div className="ai-features">
                  {currentRide.music_playlist && (
                    <div className="ai-feature">🎵 Custom playlist ready</div>
                  )}
                  {currentRide.weather_info && (
                    <div className="ai-feature">🌤️ Weather-optimized route</div>
                  )}
                  <div className="ai-feature">🛡️ Safety monitoring active</div>
                </div>
              </div>
            )}

            <div className="ride-actions">
              {currentRide.status === 'searching' && (
                <button onClick={cancelRide} className="btn btn-danger">
                  Cancel Ride
                </button>
              )}
              {currentRide.driver && (
                <>
                  <button className="btn btn-primary">📞 Call Driver</button>
                  <button className="btn btn-secondary">💬 Message</button>
                  <button onClick={endRide} className="btn btn-success">
                    🏁 Complete Ride
                  </button>
                  <button onClick={cancelRide} className="btn btn-warning">
                    🚫 Cancel Ride
                  </button>
                </>
              )}
              {(currentRide.status === 'pickup' || currentRide.status === 'in_progress') && (
                <button onClick={endRide} className="btn btn-success">
                  🏁 End Ride
                </button>
              )}
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

        <style jsx>{`
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }

          .ride-status .card {
            text-align: center;
          }

          .ride-details {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
          }

          .driver-info {
            background: #ecfdf5;
            border: 2px solid #10b981;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
          }

          .ai-enhancements {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }

          .ai-features {
            text-align: left;
          }

          .ai-feature {
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
          }

          .ai-feature:last-child {
            border-bottom: none;
          }

          .ride-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
            flex-wrap: wrap;
          }

          .ride-actions .btn {
            flex: 1;
            min-width: 120px;
            font-size: 14px;
          }

          @media (max-width: 768px) {
            .ride-actions {
              flex-direction: column;
            }
            
            .ride-actions .btn {
              flex: none;
              width: 100%;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>👥 Book a Ride</h1>
        <div className="header-controls">
          <button 
            onClick={() => setShowPreferences(true)}
            className="btn btn-preferences"
          >
            🎛️ Preferences
          </button>
          <a href="/api/auth/logout" className="btn btn-logout">
            🚪 Logout
          </a>
        </div>
      </div>
      
      <div className="booking-form">
        <div className="card">
          <h2>Where would you like to go?</h2>
          
          <div className="form-group">
            <label>📍 Pickup Location</label>
            <div className="autocomplete-container">
              <input
                type="text"
                value={rideForm.pickup}
                onChange={(e) => handlePickupChange(e.target.value)}
                placeholder="Enter pickup location"
                className="form-control"
                onFocus={() => {
                  if (pickupSuggestions.length > 0) {
                    setShowPickupSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow clicking on suggestions
                  setTimeout(() => setShowPickupSuggestions(false), 200);
                }}
              />
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {pickupSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectPickupSuggestion(suggestion)}
                    >
                      📍 {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>🎯 Destination</label>
            <input
              type="text"
              value={rideForm.destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              placeholder="Where are you going?"
              className="form-control"
            />
          </div>

          {rideForm.pickupCoords && rideForm.destinationCoords && (
            <div className="fare-estimate">
              <h3>💰 Estimated Fare</h3>
              <p className="fare-amount">
                ${ Math.round((3.50 + (RideshareDB.calculateDistance(
                  rideForm.pickupCoords.lat,
                  rideForm.pickupCoords.lng,
                  rideForm.destinationCoords.lat,
                  rideForm.destinationCoords.lng
                ) * 1.25)) * 100) / 100 }
              </p>
            </div>
          )}

          <button
            onClick={bookRide}
            disabled={isBooking || !rideForm.destinationCoords}
            className="btn btn-primary btn-large"
          >
            {isBooking ? 'Booking...' : '🚖 Book Ride'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 700px;
          margin: 0 auto;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          min-height: 100vh;
        }

        .login-required {
          text-align: center;
          margin-top: 120px;
          padding: 0 20px;
        }

        .login-required .card {
          max-width: 450px;
          margin: 0 auto;
          padding: 45px;
        }

        .login-required h1 {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 15px;
          text-shadow: 0 2px 8px rgba(31, 41, 55, 0.15);
        }

        .login-required p {
          font-size: 16px;
          color: rgba(75, 85, 99, 0.8);
          margin-bottom: 35px;
          font-weight: 500;
          letter-spacing: 0.025em;
        }

        .alternative-login {
          margin-top: 35px;
          padding-top: 25px;
          border-top: 1px solid rgba(229, 231, 235, 0.3);
        }

        .alternative-login p {
          color: rgba(156, 163, 175, 0.8);
          margin-bottom: 18px;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.025em;
        }

        .booking-form .card {
          text-align: center;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .form-group {
          margin-bottom: 25px;
          text-align: left;
        }

        .form-group label {
          display: block;
          margin-bottom: 12px;
          font-weight: 700;
          font-size: 17px;
          color: #374151;
          letter-spacing: 0.025em;
        }

        .form-control {
          width: 100%;
          padding: 18px;
          border: 2px solid rgba(229, 231, 235, 0.5);
          border-radius: 16px;
          font-size: 16px;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
        }

        .form-control:focus {
          border-color: #6366f1;
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 8px 30px rgba(99, 102, 241, 0.15);
          transform: translateY(-2px);
        }

        .autocomplete-container {
          position: relative;
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(229, 231, 235, 0.3);
          border-top: none;
          border-radius: 0 0 16px 16px;
          max-height: 250px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }

        .suggestion-item {
          padding: 16px 20px;
          cursor: pointer;
          border-bottom: 1px solid rgba(243, 244, 246, 0.5);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          color: #374151;
          font-weight: 500;
        }

        .suggestion-item:hover {
          background: rgba(99, 102, 241, 0.1);
          transform: translateX(8px);
          border-left: 4px solid #6366f1;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .fare-estimate {
          background: linear-gradient(135deg, rgba(240, 249, 255, 0.9) 0%, rgba(224, 242, 254, 0.9) 100%);
          backdrop-filter: blur(15px);
          border: 2px solid rgba(14, 165, 233, 0.3);
          border-radius: 20px;
          padding: 28px;
          margin: 25px 0;
          box-shadow: 0 15px 35px rgba(14, 165, 233, 0.15);
        }

        .fare-estimate h3 {
          margin: 0 0 15px 0;
          color: #0369a1;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 0.025em;
        }

        .fare-amount {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0369a1;
          margin: 0;
          text-shadow: 0 2px 4px rgba(3, 105, 161, 0.2);
        }

        .btn {
          display: inline-block;
          padding: 16px 32px;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
        }

        .btn:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .btn:hover:before {
          left: 100%;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.5);
        }

        .btn-primary:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
        }

        .btn-secondary {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          box-shadow: 0 8px 25px rgba(240, 147, 251, 0.4);
        }

        .btn-secondary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(240, 147, 251, 0.5);
        }

        .btn-danger {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        }

        .btn-danger:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(255, 107, 107, 0.5);
        }

        .btn-success {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
        }

        .btn-success:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(79, 172, 254, 0.5);
        }

        .btn-large {
          width: 100%;
          padding: 22px;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 35px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .loading {
          text-align: center;
          padding: 120px;
          font-size: 1.8rem;
          color: rgba(107, 114, 128, 0.8);
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        h1 {
          text-align: center;
          color: #1f2937;
          margin-bottom: 35px;
          font-weight: 800;
          font-size: 2.5rem;
          text-shadow: 0 2px 8px rgba(31, 41, 55, 0.15);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 35px;
          padding: 0 5px;
        }

        .header-controls {
          display: flex;
          gap: 18px;
          align-items: center;
        }

        .btn-preferences {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-preferences:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(139, 92, 246, 0.5);
        }

        .btn-logout {
          background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 25px rgba(113, 128, 150, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-logout:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(113, 128, 150, 0.5);
        }

        h2 {
          color: #374151;
          margin-bottom: 30px;
          font-weight: 700;
          font-size: 2rem;
          text-shadow: 0 2px 4px rgba(55, 65, 81, 0.1);
        }
      `}</style>

      {/* Passenger Preferences Modal */}
      {showPreferences && user?.sub && (
        <PassengerPreferencesComponent
          passengerId={user.sub}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
}