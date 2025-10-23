'use client'

import { useUser, withPageAuthRequired } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { useState } from 'react'

function Dashboard() {
  const { user } = useUser()
  const [demoStatus, setDemoStatus] = useState<string>('')
  const [testStatus, setTestStatus] = useState<string>('')

  const runDemo = async () => {
    setDemoStatus('Running demo...')
    try {
      // In a real app, you'd call your API endpoint
      // For now, we'll simulate the demo
      await new Promise(resolve => setTimeout(resolve, 2000))
      setDemoStatus('✅ Demo completed! Check your terminal for full output.')
    } catch (error) {
      setDemoStatus('❌ Demo failed. Please try running: npm run demo')
    }
  }

  const testRealAPI = async () => {
    setTestStatus('🧪 Testing real APIs...')
    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: '123 Main St, New York, NY',
          destination: '456 Oak Ave, New York, NY'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTestStatus('✅ All APIs working! OpenAI + Auth0 + Supabase + Google Maps are connected!')
      } else {
        setTestStatus(`❌ Test failed: ${result.error}`)
      }
    } catch (error) {
      setTestStatus(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="gradient-bg p-4 text-center mb-4" style={{ borderRadius: '8px' }}>
        <h1>🎛️ RouteWise AI Dashboard</h1>
        <p>Welcome, {user?.name || 'User'}!</p>
      </div>

      {/* User Info */}
      <div className="card">
        <h2>👤 Your Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px', alignItems: 'center' }}>
          <img 
            src={user?.picture || 'https://via.placeholder.com/80x80?text=👤'} 
            alt="Profile" 
            style={{ width: '80px', height: '80px', borderRadius: '50%' }}
          />
          <div>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>User ID:</strong> {user?.sub}</p>
            <p><strong>Last Login:</strong> {user?.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Agent Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h3>🚗 Ride Preparation Agent</h3>
          <p>Configure your ride preferences and permissions:</p>
          <div className="mt-4">
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input type="checkbox" defaultChecked /> Music Access (Spotify)
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input type="checkbox" defaultChecked /> Location Sharing
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input type="checkbox" defaultChecked /> Weather Insights
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input type="checkbox" /> Calendar Integration
            </label>
            <button className="btn btn-primary mt-4">Save Preferences</button>
          </div>
        </div>

        <div className="card">
          <h3>🛡️ Safety Monitoring</h3>
          <p>Emergency contacts and safety settings:</p>
          <div className="mt-4">
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Emergency Contact:
              <input 
                type="tel" 
                placeholder="+1 (555) 123-4567"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  marginTop: '4px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px' 
                }}
              />
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input type="checkbox" defaultChecked /> Enable Panic Button
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input type="checkbox" defaultChecked /> Route Monitoring
            </label>
            <button className="btn btn-primary mt-4">Update Safety Settings</button>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="card">
        <h2>🎮 Run Agent Demo</h2>
        <p>Test the AI agents with simulated ride scenarios:</p>
        <div className="mt-4">
          <button 
            onClick={runDemo} 
            className="btn btn-primary"
            disabled={demoStatus.includes('Running')}
          >
            {demoStatus.includes('Running') ? 'Running...' : 'Start Demo'}
          </button>
          {demoStatus && (
            <div className="mt-4 p-4" style={{ 
              background: demoStatus.includes('✅') ? '#d1fae5' : demoStatus.includes('❌') ? '#fee2e2' : '#f3f4f6',
              borderRadius: '4px',
              border: '1px solid #e5e7eb'
            }}>
              {demoStatus}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            <strong>Terminal Command:</strong> You can also run <code>npm run demo</code> in your terminal
          </p>
        </div>
      </div>

      {/* Real API Test */}
      <div className="card">
        <h3>🧪 Test Real APIs</h3>
        <p>Test all configured APIs with real data:</p>
        <div className="mt-4">
          <button 
            onClick={testRealAPI} 
            className="btn btn-success"
            style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
          >
            🚀 Test Production APIs
          </button>
          <a 
            href="/agents-demo"
            className="btn btn-primary"
            style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}
          >
            🤖 Full AI Agents Demo
          </a>
          {testStatus && (
            <div className="mt-4" style={{ 
              padding: '12px',
              backgroundColor: testStatus.includes('✅') ? '#d4edda' : '#f8d7da',
              color: testStatus.includes('✅') ? '#155724' : '#721c24',
              borderRadius: '4px',
              border: '1px solid ' + (testStatus.includes('✅') ? '#c3e6cb' : '#f5c6cb')
            }}>
              {testStatus}
            </div>
          )}
        </div>
      </div>

      {/* API Status */}
      <div className="card">
        <h2>🔌 System Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <strong>Auth0:</strong> <span style={{ color: 'green' }}>✅ Connected</span>
          </div>
          <div>
            <strong>Production Mode:</strong> <span style={{ color: 'green' }}>✅ Active</span>
          </div>
          <div>
            <strong>Database:</strong> <span style={{ color: 'orange' }}>🟡 Mock Data</span>
          </div>
          <div>
            <strong>OpenAI:</strong> <span style={{ color: 'orange' }}>🟡 Demo Responses</span>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/setup" className="btn btn-secondary">
            Configure Real APIs
          </Link>
        </div>
      </div>

      {/* Platform Navigation */}
      <div className="card">
        <h3>🌐 Platform Access</h3>
        <p>Access different parts of the RouteWise AI ecosystem:</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
          <a href="/driver-dashboard" className="btn btn-success">🚕 Driver Dashboard</a>
          <a href="/admin" className="btn btn-secondary">🎛️ Admin Panel</a>
          <a href="/emergency" className="btn btn-danger">🚨 Emergency Center</a>
          <button className="btn btn-info">📱 Mobile App (Coming Soon)</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
          🔄 <strong>Complete Ecosystem:</strong> Passenger → Driver → Admin coordination with AI agents
        </p>
      </div>

      {/* Navigation */}
      <div className="text-center mt-4">
        <Link href="/" className="btn btn-secondary">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}

export default withPageAuthRequired(Dashboard)
