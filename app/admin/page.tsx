'use client'

import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0/client'
import { useState, useEffect } from 'react'

function AdminPanel() {
  const { user } = useUser()
  const [activeRides, setActiveRides] = useState([
    {
      id: 'ride-001',
      passenger: 'Sarah Johnson',
      driver: 'Mike Torres',
      status: 'in-progress',
      pickup: '123 Main St, NYC',
      destination: '456 Oak Ave, NYC',
      startTime: '2:15 PM',
      aiAlerts: ['Traffic delay detected', 'Route optimized']
    },
    {
      id: 'ride-002',
      passenger: 'David Kim',
      driver: 'Lisa Chen',
      status: 'completed',
      pickup: '789 Pine St, NYC',
      destination: 'Central Park',
      startTime: '1:45 PM',
      aiAlerts: ['Ride completed successfully']
    }
  ])

  const [safetyAlerts] = useState([
    {
      id: 'alert-001',
      rideId: 'ride-001',
      severity: 'medium',
      type: 'Route Deviation',
      message: 'Driver deviated from suggested route by 0.5 miles',
      timestamp: '2:25 PM',
      status: 'monitoring'
    },
    {
      id: 'alert-002',
      rideId: 'ride-003',
      severity: 'high',
      type: 'Emergency Button',
      message: 'Passenger activated emergency button',
      timestamp: '2:30 PM',
      status: 'responding'
    }
  ])

  const [platformStats] = useState({
    totalRides: 1247,
    activeRides: 23,
    totalDrivers: 156,
    onlineDrivers: 78,
    totalUsers: 2840,
    activeUsers: 145
  })

  const handleSafetyAlert = (alertId: string, action: string) => {
    console.log(`${action} alert ${alertId}`)
    // In production: API call to handle alert
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="gradient-bg p-4 text-center mb-4" style={{ borderRadius: '8px' }}>
        <h1>🎛️ RouteWise AI Admin Panel</h1>
        <p>Platform Operations & AI Monitoring</p>
        <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Logged in as: {user?.name || 'Administrator'}</p>
      </div>

      {/* Platform Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="card text-center">
          <h4>🚗 Total Rides</h4>
          <p style={{ fontSize: '1.5rem', color: '#007bff', margin: '5px 0' }}>{platformStats.totalRides}</p>
        </div>
        <div className="card text-center">
          <h4>⚡ Active Rides</h4>
          <p style={{ fontSize: '1.5rem', color: '#28a745', margin: '5px 0' }}>{platformStats.activeRides}</p>
        </div>
        <div className="card text-center">
          <h4>👥 Online Drivers</h4>
          <p style={{ fontSize: '1.5rem', color: '#6f42c1', margin: '5px 0' }}>{platformStats.onlineDrivers}/{platformStats.totalDrivers}</p>
        </div>
        <div className="card text-center">
          <h4>📱 Active Users</h4>
          <p style={{ fontSize: '1.5rem', color: '#fd7e14', margin: '5px 0' }}>{platformStats.activeUsers}</p>
        </div>
      </div>

      {/* Safety Alerts */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>🚨 AI Safety Alerts</h2>
        {safetyAlerts.length === 0 ? (
          <p style={{ color: '#28a745' }}>✅ No active safety alerts</p>
        ) : (
          safetyAlerts.map(alert => (
            <div key={alert.id} style={{ 
              border: `2px solid ${alert.severity === 'high' ? '#dc3545' : alert.severity === 'medium' ? '#ffc107' : '#6c757d'}`, 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '15px',
              backgroundColor: alert.severity === 'high' ? '#f8d7da' : alert.severity === 'medium' ? '#fff3cd' : '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4>
                    {alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '⚪'} 
                    {alert.type}
                  </h4>
                  <p><strong>Ride ID:</strong> {alert.rideId}</p>
                  <p><strong>Message:</strong> {alert.message}</p>
                  <p><strong>Time:</strong> {alert.timestamp}</p>
                  <p><strong>Status:</strong> 
                    <span style={{ 
                      backgroundColor: alert.status === 'responding' ? '#dc3545' : '#ffc107',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginLeft: '8px'
                    }}>
                      {alert.status}
                    </span>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => handleSafetyAlert(alert.id, 'investigate')}
                    className="btn btn-info"
                    style={{ fontSize: '0.8rem' }}
                  >
                    🔍 Investigate
                  </button>
                  <button 
                    onClick={() => handleSafetyAlert(alert.id, 'contact')}
                    className="btn btn-warning"
                    style={{ fontSize: '0.8rem' }}
                  >
                    📞 Contact
                  </button>
                  <button 
                    onClick={() => handleSafetyAlert(alert.id, 'escalate')}
                    className="btn btn-danger"
                    style={{ fontSize: '0.8rem' }}
                  >
                    🚨 Escalate
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Active Rides Monitor */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>🚗 Live Ride Monitoring</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Ride ID</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Passenger</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Driver</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Route</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>AI Insights</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeRides.map(ride => (
                <tr key={ride.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{ride.id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{ride.passenger}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{ride.driver}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <span style={{ 
                      backgroundColor: ride.status === 'in-progress' ? '#28a745' : '#6c757d',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      {ride.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '0.8rem' }}>
                    {ride.pickup} → {ride.destination}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '0.8rem' }}>
                    {ride.aiAlerts.join(', ')}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <button className="btn btn-sm btn-info" style={{ fontSize: '0.7rem', marginRight: '5px' }}>
                      👁️ View
                    </button>
                    <button className="btn btn-sm btn-warning" style={{ fontSize: '0.7rem' }}>
                      📞 Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Agent Status */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>🤖 AI Agent Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', border: '1px solid #28a745', borderRadius: '8px', backgroundColor: '#d4edda' }}>
            <h4>✅ Consent Negotiation Agent</h4>
            <p><strong>Status:</strong> Online</p>
            <p><strong>Requests Today:</strong> 156</p>
            <p><strong>Success Rate:</strong> 94%</p>
          </div>
          <div style={{ padding: '15px', border: '1px solid #28a745', borderRadius: '8px', backgroundColor: '#d4edda' }}>
            <h4>✅ Ride Preparation Agent</h4>
            <p><strong>Status:</strong> Online</p>
            <p><strong>Rides Analyzed:</strong> 89</p>
            <p><strong>Optimization Rate:</strong> 87%</p>
          </div>
          <div style={{ padding: '15px', border: '1px solid #ffc107', borderRadius: '8px', backgroundColor: '#fff3cd' }}>
            <h4>⚠️ Safety Monitoring Agent</h4>
            <p><strong>Status:</strong> Monitoring</p>
            <p><strong>Active Monitors:</strong> 23</p>
            <p><strong>Alerts Generated:</strong> 2</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">📊 View Analytics</button>
          <button className="btn btn-secondary">👥 Manage Users</button>
          <button className="btn btn-success">🚕 Manage Drivers</button>
          <button className="btn btn-info">🤖 AI Configuration</button>
          <button className="btn btn-warning">📞 Emergency Contacts</button>
          <a href="/dashboard" className="btn btn-outline-primary">👤 Passenger View</a>
          <a href="/driver-dashboard" className="btn btn-outline-success">🚕 Driver View</a>
        </div>
      </div>
    </div>
  )
}

export default withPageAuthRequired(AdminPanel)