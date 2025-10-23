'use client'

import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0/client'
import { useState } from 'react'

function EmergencyCenter() {
  const { user } = useUser()
  const [activeEmergencies] = useState([
    {
      id: 'emergency-001',
      rideId: 'ride-123',
      passenger: 'Sarah Johnson',
      driver: 'Mike Torres',
      type: 'Panic Button',
      severity: 'HIGH',
      location: '42.3601° N, 71.0589° W (Boston, MA)',
      timestamp: '2:30:15 PM',
      status: 'ACTIVE',
      description: 'Passenger activated emergency button',
      aiAnalysis: 'Route deviation detected 3 minutes prior. Vehicle speed decreased significantly. No response to communication attempts.',
      responders: ['Unit 12', 'Police Dispatch'],
      lastUpdate: '2:31:22 PM'
    },
    {
      id: 'emergency-002', 
      rideId: 'ride-156',
      passenger: 'Alex Chen',
      driver: 'Lisa Rodriguez',
      type: 'Medical Emergency',
      severity: 'CRITICAL',
      location: '40.7128° N, 74.0060° W (NYC)',
      timestamp: '2:28:45 PM',
      status: 'RESPONDING',
      description: 'Driver reported passenger medical emergency',
      aiAnalysis: 'Vital signs monitoring shows irregular patterns. EMS dispatch recommended. Route to nearest hospital calculated.',
      responders: ['Ambulance 45', 'Mount Sinai ER'],
      lastUpdate: '2:30:10 PM'
    }
  ])

  const [recentIncidents] = useState([
    {
      id: 'incident-001',
      type: 'False Alarm',
      timestamp: '1:45 PM',
      resolved: true,
      description: 'Accidental panic button activation - verified safe'
    },
    {
      id: 'incident-002',
      type: 'Route Safety',
      timestamp: '12:30 PM', 
      resolved: true,
      description: 'AI detected unsafe area - passenger rerouted successfully'
    }
  ])

  const handleEmergencyAction = (emergencyId: string, action: string) => {
    console.log(`${action} for emergency ${emergencyId}`)
    // In production: Real emergency response API calls
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #dc3545, #c82333)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1>🚨 Emergency Operations Center</h1>
        <p>Real-time Emergency Response & AI Safety Monitoring</p>
        <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          Operator: {user?.name || 'Emergency Operator'} | Status: ON DUTY
        </p>
      </div>

      {/* Emergency Status Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ 
          backgroundColor: '#dc3545', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h4>🚨 Active Emergencies</h4>
          <p style={{ fontSize: '2rem', margin: '5px 0' }}>{activeEmergencies.length}</p>
        </div>
        <div style={{ 
          backgroundColor: '#28a745', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h4>✅ Resolved Today</h4>
          <p style={{ fontSize: '2rem', margin: '5px 0' }}>12</p>
        </div>
        <div style={{ 
          backgroundColor: '#ffc107', 
          color: 'black', 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h4>⚠️ Avg Response Time</h4>
          <p style={{ fontSize: '2rem', margin: '5px 0' }}>1.2min</p>
        </div>
        <div style={{ 
          backgroundColor: '#17a2b8', 
          color: 'white', 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <h4>🤖 AI Alerts</h4>
          <p style={{ fontSize: '2rem', margin: '5px 0' }}>7</p>
        </div>
      </div>

      {/* Active Emergencies */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>🚨 ACTIVE EMERGENCIES</h2>
        {activeEmergencies.length === 0 ? (
          <div style={{ 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            padding: '20px', 
            borderRadius: '8px', 
            textAlign: 'center' 
          }}>
            <h3>✅ No Active Emergencies</h3>
            <p>All systems monitoring normally</p>
          </div>
        ) : (
          activeEmergencies.map(emergency => (
            <div key={emergency.id} style={{ 
              border: `3px solid ${emergency.severity === 'CRITICAL' ? '#dc3545' : '#ffc107'}`, 
              borderRadius: '8px', 
              padding: '20px', 
              marginBottom: '20px',
              backgroundColor: emergency.severity === 'CRITICAL' ? '#f8d7da' : '#fff3cd'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px' }}>
                <div>
                  <h3>
                    {emergency.severity === 'CRITICAL' ? '🔴' : '🟡'} 
                    {emergency.type} - {emergency.severity}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <p><strong>🆔 Emergency ID:</strong> {emergency.id}</p>
                      <p><strong>🚗 Ride ID:</strong> {emergency.rideId}</p>
                      <p><strong>👤 Passenger:</strong> {emergency.passenger}</p>
                      <p><strong>🚕 Driver:</strong> {emergency.driver}</p>
                    </div>
                    <div>
                      <p><strong>📍 Location:</strong> {emergency.location}</p>
                      <p><strong>⏰ Time:</strong> {emergency.timestamp}</p>
                      <p><strong>🔄 Status:</strong> 
                        <span style={{ 
                          backgroundColor: emergency.status === 'ACTIVE' ? '#dc3545' : '#ffc107',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          marginLeft: '8px'
                        }}>
                          {emergency.status}
                        </span>
                      </p>
                      <p><strong>🚨 Responders:</strong> {emergency.responders.join(', ')}</p>
                    </div>
                  </div>

                  <div style={{ 
                    backgroundColor: 'white', 
                    padding: '15px', 
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}>
                    <h4>📝 Description</h4>
                    <p>{emergency.description}</p>
                    
                    <h4>🤖 AI Analysis</h4>
                    <p style={{ fontStyle: 'italic', color: '#0066cc' }}>{emergency.aiAnalysis}</p>
                    
                    <p><strong>📊 Last Update:</strong> {emergency.lastUpdate}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
                  <button 
                    onClick={() => handleEmergencyAction(emergency.id, 'contact-passenger')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem' }}
                  >
                    📞 Contact Passenger
                  </button>
                  <button 
                    onClick={() => handleEmergencyAction(emergency.id, 'contact-driver')}
                    className="btn btn-info"
                    style={{ fontSize: '0.8rem' }}
                  >
                    📱 Contact Driver
                  </button>
                  <button 
                    onClick={() => handleEmergencyAction(emergency.id, 'dispatch-police')}
                    className="btn btn-warning"
                    style={{ fontSize: '0.8rem' }}
                  >
                    🚔 Dispatch Police
                  </button>
                  <button 
                    onClick={() => handleEmergencyAction(emergency.id, 'dispatch-medical')}
                    className="btn btn-danger"
                    style={{ fontSize: '0.8rem' }}
                  >
                    🚑 Medical Emergency
                  </button>
                  <button 
                    onClick={() => handleEmergencyAction(emergency.id, 'track-location')}
                    className="btn btn-success"
                    style={{ fontSize: '0.8rem' }}
                  >
                    📍 Track Live
                  </button>
                  <button 
                    onClick={() => handleEmergencyAction(emergency.id, 'escalate')}
                    className="btn"
                    style={{ fontSize: '0.8rem', backgroundColor: '#6f42c1', color: 'white' }}
                  >
                    ⬆️ Escalate
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Incidents */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>📋 Recent Incidents (Resolved)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Time</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Description</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.map(incident => (
                <tr key={incident.id}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{incident.timestamp}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{incident.type}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{incident.description}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <span style={{ 
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      ✅ Resolved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Protocols */}
      <div className="card">
        <h3>📋 Emergency Protocols</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', border: '1px solid #dc3545', borderRadius: '8px' }}>
            <h4>🚨 Level 1: Critical</h4>
            <p>Medical emergency, safety threat</p>
            <p><strong>Response:</strong> Immediate dispatch</p>
            <p><strong>SLA:</strong> &lt; 30 seconds</p>
          </div>
          <div style={{ padding: '15px', border: '1px solid #ffc107', borderRadius: '8px' }}>
            <h4>⚠️ Level 2: High</h4>
            <p>Panic button, route deviation</p>
            <p><strong>Response:</strong> Contact + monitor</p>
            <p><strong>SLA:</strong> &lt; 2 minutes</p>
          </div>
          <div style={{ padding: '15px', border: '1px solid #17a2b8', borderRadius: '8px' }}>
            <h4>ℹ️ Level 3: Medium</h4>
            <p>AI safety alerts, concerns</p>
            <p><strong>Response:</strong> Investigate</p>
            <p><strong>SLA:</strong> &lt; 5 minutes</p>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/dashboard" className="btn btn-outline-primary">👤 Passenger View</a>
          <a href="/driver-dashboard" className="btn btn-outline-success">🚕 Driver View</a>
          <a href="/admin" className="btn btn-outline-secondary">🎛️ Admin Panel</a>
          <button className="btn btn-danger">🚨 TEST EMERGENCY ALERT</button>
        </div>
      </div>
    </div>
  )
}

export default withPageAuthRequired(EmergencyCenter)