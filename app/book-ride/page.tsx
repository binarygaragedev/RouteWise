'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import { RideshareDB, Ride } from '@/lib/rideshare-db';

interface RideBookingForm {
  pickupAddress: string;
  destinationAddress: string;
  pickupCoords: { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
}

export default function RideBookingPage() {
  const { user, isLoading } = useUser();
  const [bookingForm, setBookingForm] = useState<RideBookingForm>({
    pickupAddress: '',
    destinationAddress: '',
    pickupCoords: null,
    destinationCoords: null
  });
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [step, setStep] = useState<'form' | 'searching' | 'matched' | 'in-ride'>('form');
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<number>(0);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Reverse geocode to get address
          reverseGeocode(latitude, longitude).then(address => {
            setBookingForm(prev => ({
              ...prev,
              pickupAddress: address,
              pickupCoords: { lat: latitude, lng: longitude }
            }));
          });
        },
        (error) => {
          console.log('Location access denied:', error);
          // Use default location (downtown)
          setBookingForm(prev => ({
            ...prev,
            pickupAddress: 'Current Location',
            pickupCoords: { lat: 40.7128, lng: -74.0060 } // NYC default
          }));
        }
      );
    }
  }, []);

  // Check for existing ride
  useEffect(() => {
    if (user?.sub) {
      checkExistingRide();
    }
  }, [user]);

  // Real-time ride updates
  useEffect(() => {
    if (currentRide) {
      const subscription = RideshareDB.subscribeToRideUpdates(currentRide.id, (payload) => {
        console.log('Ride update:', payload);
        setCurrentRide(payload.new);
        
        // Update step based on ride status
        switch (payload.new.status) {
          case 'searching':
            setStep('searching');
            break;
          case 'accepted':
            setStep('matched');
            break;
          case 'pickup':
          case 'in_progress':
            setStep('in-ride');
            break;
          case 'completed':
            setStep('form');
            setCurrentRide(null);
            break;
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentRide]);

  const checkExistingRide = async () => {
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
        switch (activeRide.status) {
          case 'searching':
            setStep('searching');
            break;
          case 'accepted':
            setStep('matched');
            break;
          case 'pickup':
          case 'in_progress':
            setStep('in-ride');
            break;
        }
      }
    } catch (error) {
      console.error('Error checking existing ride:', error);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      return data.address || 'Unknown Location';
    } catch (error) {
      return 'Unknown Location';
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

  const calculateFare = (distance: number): number => {
    const baseFare = 3.50;
    const perKm = 1.25;
    const total = baseFare + (distance * perKm);
    return Math.round(total * 100) / 100;
  };

  const handleAddressChange = async (field: 'pickup' | 'destination', address: string) => {
    if (field === 'pickup') {
      setBookingForm(prev => ({ ...prev, pickupAddress: address }));
      
      if (address.length > 5) {
        const coords = await geocodeAddress(address);
        setBookingForm(prev => ({ ...prev, pickupCoords: coords }));
      }
    } else {
      setBookingForm(prev => ({ ...prev, destinationAddress: address }));
      
      if (address.length > 5) {
        const coords = await geocodeAddress(address);
        setBookingForm(prev => ({ ...prev, destinationCoords: coords }));
        
        // Calculate estimated fare
        if (bookingForm.pickupCoords && coords) {
          const distance = RideshareDB.calculateDistance(
            bookingForm.pickupCoords.lat,
            bookingForm.pickupCoords.lng,
            coords.lat,
            coords.lng
          );
          setEstimatedFare(calculateFare(distance));
        }
      }
    }
  };

  const bookRide = async () => {
    if (!user?.sub || !bookingForm.pickupCoords || !bookingForm.destinationCoords) {
      alert('Please complete all fields');
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
        bookingForm.pickupCoords.lat,
        bookingForm.pickupCoords.lng,
        bookingForm.destinationCoords.lat,
        bookingForm.destinationCoords.lng
      );

      const fare = calculateFare(distance);

      // Create ride
      const ride = await RideshareDB.createRide({
        passenger_id: dbUser.id,
        pickup_address: bookingForm.pickupAddress,
        pickup_latitude: bookingForm.pickupCoords.lat,
        pickup_longitude: bookingForm.pickupCoords.lng,
        destination_address: bookingForm.destinationAddress,
        destination_latitude: bookingForm.destinationCoords.lat,
        destination_longitude: bookingForm.destinationCoords.lng,
        estimated_distance: distance,
        estimated_duration: Math.round(distance * 2), // Rough estimate: 2 min per km
        estimated_fare: fare,
        status: 'searching',
        safety_score: 100
      });

      setCurrentRide(ride);
      setStep('searching');

      // Start AI agent ride preparation
      await fetch('/api/agent/prepare-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rideId: ride.id,
          passengerId: dbUser.id,
          driverId: null // Will be set when driver accepts
        })
      });

      // Check for nearby drivers
      const drivers = await RideshareDB.getNearbyDrivers(
        bookingForm.pickupCoords.lat,
        bookingForm.pickupCoords.lng,
        15 // 15km radius
      );
      setNearbyDrivers(drivers.length);

      // Simulate driver matching after a few seconds
      setTimeout(async () => {
        if (drivers.length > 0) {
          // Simulate a driver accepting
          const selectedDriver = drivers[0];
          await RideshareDB.acceptRide(ride.id, selectedDriver.user_id);
        }
      }, 5000);

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
      setStep('form');
    } catch (error) {
      console.error('Error cancelling ride:', error);
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
          <p>Please sign in to book a ride</p>
          <a href="/api/auth/login" className="btn btn-primary">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>🚖 Book a Ride</h1>
      
      {step === 'form' && (
        <div className="ride-booking-form">
          <div className="card">
            <h2>Where to?</h2>
            
            <div className="form-group">
              <label>📍 Pickup Location</label>
              <input
                type="text"
                value={bookingForm.pickupAddress}
                onChange={(e) => handleAddressChange('pickup', e.target.value)}
                placeholder="Enter pickup address"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>🎯 Destination</label>
              <input
                type="text"
                value={bookingForm.destinationAddress}
                onChange={(e) => handleAddressChange('destination', e.target.value)}
                placeholder="Where are you going?"
                className="form-control"
              />
            </div>

            {estimatedFare && (
              <div className="fare-estimate">
                <h3>💰 Estimated Fare: ${estimatedFare}</h3>
              </div>
            )}

            <button
              onClick={bookRide}
              disabled={isBooking || !bookingForm.pickupCoords || !bookingForm.destinationCoords}
              className="btn btn-primary btn-large"
            >
              {isBooking ? 'Booking...' : '🚖 Book Ride'}
            </button>
          </div>
        </div>
      )}

      {step === 'searching' && (
        <div className="ride-status">
          <div className="card">
            <h2>🔍 Finding Your Driver...</h2>
            <div className="loading-animation">
              <div className="spinner"></div>
            </div>
            <p>Looking for nearby drivers...</p>
            <p>📍 Pickup: {bookingForm.pickupAddress}</p>
            <p>🎯 Destination: {bookingForm.destinationAddress}</p>
            <p>💰 Estimated Fare: ${estimatedFare}</p>
            <p>🚗 {nearbyDrivers} drivers nearby</p>
            
            <div className="ai-status">
              <h3>🤖 AI Agents Working...</h3>
              <div className="agent-activity">
                <div className="agent-item">
                  ✅ Ride Preparation Agent: Optimizing route and gathering preferences
                </div>
                <div className="agent-item">
                  🛡️ Safety Agent: Monitoring for secure driver matching
                </div>
              </div>
            </div>

            <button onClick={cancelRide} className="btn btn-secondary">
              Cancel Ride
            </button>
          </div>
        </div>
      )}

      {step === 'matched' && currentRide?.driver && (
        <div className="ride-matched">
          <div className="card">
            <h2>🎉 Driver Found!</h2>
            <div className="driver-info">
              <h3>Your Driver: {currentRide.driver.name}</h3>
              <p>📱 Phone: {currentRide.driver.phone}</p>
              <p>⭐ Rating: 4.8/5.0</p>
              <p>🚗 Vehicle: Blue Honda Civic</p>
              <p>📍 Driver is 3 minutes away</p>
            </div>

            <div className="ride-details">
              <p>📍 Pickup: {currentRide.pickup_address}</p>
              <p>🎯 Destination: {currentRide.destination_address}</p>
              <p>💰 Fare: ${currentRide.estimated_fare}</p>
            </div>

            <div className="ai-enhancements">
              <h3>🤖 AI Enhancements Ready</h3>
              <div className="ai-features">
                <div className="ai-item">🎵 Spotify playlist curated based on your preferences</div>
                <div className="ai-item">🌤️ Weather-optimized route selected</div>
                <div className="ai-item">🛡️ Real-time safety monitoring activated</div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn btn-success">📞 Call Driver</button>
              <button className="btn btn-primary">💬 Message Driver</button>
              <button onClick={cancelRide} className="btn btn-danger">❌ Cancel</button>
            </div>
          </div>
        </div>
      )}

      {step === 'in-ride' && currentRide && (
        <div className="in-ride">
          <div className="card">
            <h2>🚗 Ride in Progress</h2>
            
            <div className="ride-status-indicator">
              <div className={`status-badge ${currentRide.status}`}>
                {currentRide.status === 'pickup' ? '🚶 Driver arriving for pickup' : '🚗 En route to destination'}
              </div>
            </div>

            <div className="live-tracking">
              <h3>📍 Live Tracking</h3>
              <div className="map-placeholder">
                <p>🗺️ Real-time map would show here</p>
                <p>Driver location, route, ETA</p>
              </div>
            </div>

            <div className="ai-monitoring">
              <h3>🤖 AI Agents Active</h3>
              <div className="agent-status">
                <div className="agent-active">
                  🛡️ Safety Monitor: All systems normal (Score: {currentRide.safety_score}/100)
                </div>
                <div className="agent-active">
                  🎵 Music Agent: Playing your curated playlist
                </div>
                <div className="agent-active">
                  🗺️ Route Agent: Monitoring traffic and optimizing route
                </div>
              </div>
            </div>

            <div className="ride-controls">
              <button className="btn btn-primary">📞 Call Driver</button>
              <button className="btn btn-secondary">🚨 Emergency</button>
              <button className="btn btn-info">🎵 Change Music</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .ride-booking-form {
          max-width: 500px;
          margin: 0 auto;
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

        .form-control:focus {
          border-color: #3b82f6;
          outline: none;
        }

        .fare-estimate {
          background: #f0f9ff;
          border: 2px solid #0ea5e9;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
        }

        .fare-estimate h3 {
          color: #0369a1;
          margin: 0;
        }

        .btn-large {
          width: 100%;
          padding: 15px;
          font-size: 18px;
          font-weight: bold;
        }

        .loading-animation {
          text-align: center;
          margin: 20px 0;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .ai-status, .ai-enhancements, .ai-monitoring {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }

        .agent-activity, .ai-features, .agent-status {
          margin-top: 10px;
        }

        .agent-item, .ai-item, .agent-active {
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .agent-item:last-child, .ai-item:last-child, .agent-active:last-child {
          border-bottom: none;
        }

        .driver-info {
          background: #ecfdf5;
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }

        .ride-details {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-top: 20px;
        }

        .status-badge {
          display: inline-block;
          padding: 10px 20px;
          border-radius: 20px;
          font-weight: bold;
          text-align: center;
        }

        .status-badge.pickup {
          background: #fef3c7;
          color: #92400e;
          border: 2px solid #f59e0b;
        }

        .status-badge.in_progress {
          background: #d1fae5;
          color: #065f46;
          border: 2px solid #10b981;
        }

        .map-placeholder {
          background: #f1f5f9;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          color: #64748b;
        }

        .ride-controls {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .action-buttons, .ride-controls {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}