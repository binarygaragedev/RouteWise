'use client'

import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0/client'
import { useState, useEffect } from 'react'

function DriverDashboard() {
  const { user } = useUser()
  const [activeRides, setActiveRides] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(false)
  const [earnings, setEarnings] = useState({ today: 0, week: 0 })

  // Mock ride requests for demo
  const [rideRequests] = useState([
    {
      id: 'ride-001',
      passenger: 'Sarah Johnson',
      pickup: '123 Main St, NYC',
      destination: '456 Oak Ave, NYC',
      distance: '2.3 miles',
      estimatedTime: '12 min',
      fare: '$15.50',
      aiInsights: {
        traffic: 'Light traffic expected',
        weather: 'Clear conditions',
        passenger_notes: 'Prefers quiet ride, no music'
      }
    },
    {
      id: 'ride-002', 
      passenger: 'Mike Chen',
      pickup: '789 Pine St, NYC',
      destination: 'JFK Airport',
      distance: '18.7 miles',
      estimatedTime: '35 min',
      fare: '$45.20',
      aiInsights: {
        traffic: 'Heavy traffic on highways - alternate route recommended',
        weather: 'Light rain starting in 20 minutes',
        passenger_notes: 'Flight at 6 PM, time-sensitive'
      }
    }
  ])

  const acceptRide = async (rideId: string) => {
    try {
      // In production, this would call /api/rides/accept
      console.log(`Accepting ride: ${rideId}`)
      setActiveRides(prev => [...prev, rideRequests.find(r => r.id === rideId)!])
      // Remove from requests after accepting
    } catch (error) {
      console.error('Failed to accept ride:', error)
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="gradient-bg p-4 text-center mb-4" style={{ borderRadius: '8px' }}>
        <h1>🚕 Driver Dashboard</h1>
        <p>Welcome, Driver {user?.name || 'User'}!</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`btn ${isOnline ? 'btn-success' : 'btn-secondary'}`}
            style={{ backgroundColor: isOnline ? '#28a745' : '#6c757d' }}
          >
            {isOnline ? '🟢 Online' : '🔴 Go Online'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <strong>Status:</strong> {isOnline ? 'Available for rides' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Driver Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card text-center">
          <h3>💰 Today's Earnings</h3>
          <p style={{ fontSize: '2rem', color: '#28a745', margin: '10px 0' }}>${earnings.today}</p>
        </div>
        <div className="card text-center">
          <h3>📅 This Week</h3>
          <p style={{ fontSize: '2rem', color: '#007bff', margin: '10px 0' }}>${earnings.week}</p>
        </div>
        <div className="card text-center">
          <h3>🚗 Rides Today</h3>
          <p style={{ fontSize: '2rem', color: '#6f42c1', margin: '10px 0' }}>0</p>
        </div>
        <div className="card text-center">
          <h3>⭐ Rating</h3>
          <p style={{ fontSize: '2rem', color: '#fd7e14', margin: '10px 0' }}>4.9</p>
        </div>
      </div>

      {/* Ride Requests */}
      {isOnline && rideRequests.length > 0 && (
        <div className="card">
          <h2>🔔 Incoming Ride Requests</h2>
          {rideRequests.map(ride => (
            <div key={ride.id} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '15px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
                <div>
                  <h4>👤 {ride.passenger}</h4>
                  <p><strong>📍 Pickup:</strong> {ride.pickup}</p>
                  <p><strong>🎯 Destination:</strong> {ride.destination}</p>
                  <p><strong>📏 Distance:</strong> {ride.distance} • <strong>⏱️ Time:</strong> {ride.estimatedTime}</p>
                  <p><strong>💵 Fare:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>{ride.fare}</span></p>
                  
                  {/* AI Insights */}
                  <div style={{ 
                    backgroundColor: '#e3f2fd', 
                    padding: '10px', 
                    borderRadius: '6px',
                    marginTop: '10px',
                    border: '1px solid #90caf9'
                  }}>
                    <h5>🤖 AI Route Insights</h5>
                    <p><strong>🚦 Traffic:</strong> {ride.aiInsights.traffic}</p>
                    <p><strong>🌤️ Weather:</strong> {ride.aiInsights.weather}</p>
                    <p><strong>📝 Passenger Notes:</strong> {ride.aiInsights.passenger_notes}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    onClick={() => acceptRide(ride.id)}
                    className="btn btn-success"
                    style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                  >
                    ✅ Accept Ride
                  </button>
                  <button className="btn btn-secondary">
                    ❌ Decline
                  </button>
                  <button className="btn btn-info">
                    📍 View Route
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Rides */}
      {activeRides.length > 0 && (
        <div className="card">
          <h2>🚗 Active Rides</h2>
          {activeRides.map(ride => (
            <div key={ride.id} style={{ 
              border: '2px solid #28a745', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '15px',
              backgroundColor: '#d4edda'
            }}>
              <h4>🚕 En Route to {ride.passenger}</h4>
              <p><strong>Current Status:</strong> Heading to pickup</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn btn-primary">📞 Call Passenger</button>
                <button className="btn btn-info">🗺️ Navigation</button>
                <button className="btn btn-warning">🚨 Emergency</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline Message */}
      {!isOnline && (
        <div className="card text-center">
          <h3>📱 You're Currently Offline</h3>
          <p>Click "Go Online" to start receiving ride requests</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            When online, you'll receive real-time ride requests with AI-powered insights
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="card">
        <h3>🔗 Quick Links</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/dashboard" className="btn btn-outline-primary">👤 Passenger View</a>
          <a href="/admin" className="btn btn-outline-secondary">🎛️ Admin Panel</a>
          <a href="/api/auth/logout" className="btn btn-outline-danger">🚪 Logout</a>
        </div>
      </div>
    </div>
  )
}

export default withPageAuthRequired(DriverDashboard)