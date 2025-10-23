'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'

export default function HomePage() {
  const { user, error, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center p-4">
          <h1>Loading...</h1>
          <p>Connecting to Auth0...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h1>🚨 Auth0 Configuration Error</h1>
          <p><strong>Error:</strong> {error.message}</p>
          <div className="mt-4">
            <h3>Required Auth0 Configuration:</h3>
            <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
              <p><strong>1. Go to Auth0 Dashboard:</strong> <a href="https://manage.auth0.com/dashboard" target="_blank" style={{ color: '#3b82f6' }}>Open Dashboard</a></p>
              <p><strong>2. Find your app:</strong> Client ID: QbYEzFQID9ABdcmuGzHwanUXOGeGhTvx</p>
              <p><strong>3. Add Callback URL:</strong> <code>http://localhost:3000/api/auth/callback</code></p>
              <p><strong>4. Add Logout URL:</strong> <code>http://localhost:3000</code></p>
              <p><strong>5. Add Web Origins:</strong> <code>http://localhost:3000</code></p>
              <p><strong>6. Save changes and refresh this page</strong></p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Contest Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '40px',
        borderRadius: '12px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🏆 RouteWise AI</h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Auth0 for AI Agents Contest Submission</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '24px' }}>
          Privacy-First Rideshare Platform with Secure AI Agents
        </p>
        
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>🎯 Contest Challenge Solved</h3>
          <p>"Build an agentic AI application using Auth0 for AI Agents"</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '15px' }}>
            <div>✅ Authenticate the user</div>
            <div>✅ Control the tools</div>
            <div>✅ Limit knowledge</div>
          </div>
        </div>
        
        {!user ? (
          <div>
            <p className="mb-4">🔐 Production Mode: Real Auth0 authentication required</p>
            <a href="/api/auth/login" className="btn btn-primary">
              Sign In with Auth0
            </a>
          </div>
        ) : (
          <div>
            <p className="mb-4">✅ Welcome back, {user.name}!</p>
            <Link href="/contest" className="btn btn-primary" style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
              border: 'none',
              marginRight: '10px',
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}>
              🏆 Contest Demo
            </Link>
            <Link href="/dashboard" className="btn btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Production Status */}
      <div className="card" style={{ background: user ? '#d1fae5' : '#fef3c7', border: user ? '2px solid #059669' : '2px solid #f59e0b' }}>
        <h2>{user ? '✅ Production Mode Active' : '🔐 Authentication Required'}</h2>
        <p>{user ? 'You are signed in and ready to use all features!' : 'Sign in with Auth0 to access the full application.'}</p>
        {user && (
          <div className="mt-4">
            <p><strong>Signed in as:</strong> {user.name} ({user.email})</p>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {user && (
          <>
            <Link href="/book-ride" className="card-link">
              <div className="card" style={{ background: '#ecfdf5', border: '2px solid #10b981' }}>
                <h3>🚖 Book a Ride</h3>
                <p><strong>Real Working App!</strong></p>
                <p>Book actual rides with live driver matching and AI agent assistance.</p>
                <ul style={{ marginLeft: '20px', marginTop: '12px' }}>
                  <li>Real-time ride booking</li>
                  <li>Live driver matching</li>
                  <li>AI route optimization</li>
                  <li>Safety monitoring</li>
                </ul>
              </div>
            </Link>

            <Link href="/driver-app" className="card-link">
              <div className="card" style={{ background: '#fef3c7', border: '2px solid #f59e0b' }}>
                <h3>🚗 Driver App</h3>
                <p><strong>Accept Real Rides!</strong></p>
                <p>Complete driver interface to accept rides and serve passengers.</p>
                <ul style={{ marginLeft: '20px', marginTop: '12px' }}>
                  <li>Live ride requests</li>
                  <li>Real-time GPS tracking</li>
                  <li>AI safety assistance</li>
                  <li>Earnings tracking</li>
                </ul>
              </div>
            </Link>
          </>
        )}

        <div className="card">
          <h3>🚗 Ride Preparation Agent</h3>
          <p>AI-powered ride optimization with music, weather, and route insights.</p>
          <ul style={{ marginLeft: '20px', marginTop: '12px' }}>
            <li>Spotify playlist curation</li>
            <li>Weather-aware suggestions</li>
            <li>Optimal route planning</li>
            <li>Privacy-respecting permissions</li>
          </ul>
          {!user && <p style={{ color: '#f59e0b', marginTop: '12px' }}>🔒 Requires authentication</p>}
        </div>

        <div className="card">
          <h3>🛡️ Safety Monitoring Agent</h3>
          <p>Real-time safety monitoring with emergency response capabilities.</p>
          <ul style={{ marginLeft: '20px', marginTop: '12px' }}>
            <li>24/7 ride monitoring</li>
            <li>Emergency detection</li>
            <li>Automatic alerts</li>
            <li>Emergency contact system</li>
          </ul>
          {!user && <p style={{ color: '#f59e0b', marginTop: '12px' }}>🔒 Requires authentication</p>}
        </div>

        <div className="card">
          <h3>🔐 Privacy & Security</h3>
          <p>Your data, your control. Auth0-powered permissions management.</p>
          <ul style={{ marginLeft: '20px', marginTop: '12px' }}>
            <li>Granular permissions</li>
            <li>Audit logging</li>
            <li>Token-based access</li>
            <li>Zero-trust architecture</li>
          </ul>
          {user && <p style={{ color: '#059669', marginTop: '12px' }}>✅ Active and protected</p>}
        </div>
      </div>

      {/* Setup Guide */}
      <div className="card">
        <h2>⚡ Next Steps</h2>
        {!user ? (
          <div>
            <p><strong>To get started:</strong></p>
            <ol style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>Configure Auth0 callback URLs (see error message above if needed)</li>
              <li>Click "Sign In with Auth0" to authenticate</li>
              <li>Access your personal dashboard</li>
              <li>Configure API keys for full functionality</li>
            </ol>
          </div>
        ) : (
          <div>
            <p><strong>You're authenticated! Next steps:</strong></p>
            <ol style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>✅ Auth0 authentication working</li>
              <li>🔄 Add real API keys for OpenAI, Supabase, etc.</li>
              <li>🚀 Start using AI agents</li>
              <li>📊 Monitor usage in dashboard</li>
            </ol>
          </div>
        )}
        <div className="mt-4">
          <Link href="/setup" className="btn btn-secondary">
            Complete Setup Guide
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4" style={{ padding: '20px', color: '#666' }}>
        <p>🚀 RouteWise AI - Built with Next.js, Auth0, and OpenAI</p>
        {user ? (
          <a href="/api/auth/logout" style={{ color: '#3b82f6', marginTop: '8px', display: 'inline-block' }}>
            Sign Out ({user.email})
          </a>
        ) : (
          <p style={{ marginTop: '8px', color: '#059669' }}>
            🟢 Production Mode: Real Auth0 authentication required
          </p>
        )}
      </div>
    </div>
  )
}