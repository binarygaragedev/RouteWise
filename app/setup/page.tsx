import Link from 'next/link'

export default function SetupPage() {
  return (
    <div className="container">
      {/* Header */}
      <div className="gradient-bg p-4 text-center mb-4" style={{ borderRadius: '8px' }}>
        <h1>⚙️ Setup Guide</h1>
        <p>Configure RouteWise AI for production use</p>
      </div>

      {/* Quick Start */}
      <div className="card">
        <h2>🚀 Quick Start</h2>
        <p>Get RouteWise AI running in 3 modes:</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <div style={{ padding: '16px', border: '2px solid #e5e7eb', borderRadius: '8px' }}>
            <h3 style={{ color: '#059669' }}>✅ Demo Mode</h3>
            <p>No setup required</p>
            <code style={{ background: '#f4f4f4', padding: '4px 8px', borderRadius: '4px', display: 'block', margin: '8px 0' }}>
              npm run demo
            </code>
          </div>
          
          <div style={{ padding: '16px', border: '2px solid #f59e0b', borderRadius: '8px' }}>
            <h3 style={{ color: '#d97706' }}>🟡 Development</h3>
            <p>Basic web app</p>
            <code style={{ background: '#f4f4f4', padding: '4px 8px', borderRadius: '4px', display: 'block', margin: '8px 0' }}>
              npm run dev
            </code>
          </div>
          
          <div style={{ padding: '16px', border: '2px solid #dc2626', borderRadius: '8px' }}>
            <h3 style={{ color: '#dc2626' }}>🔴 Production</h3>
            <p>Full API setup required</p>
            <code style={{ background: '#f4f4f4', padding: '4px 8px', borderRadius: '4px', display: 'block', margin: '8px 0' }}>
              See guide below
            </code>
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="card">
        <h2>🛠️ Required Services</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            <h3>🔐 Auth0 (Required)</h3>
            <p><strong>Purpose:</strong> User authentication & permissions</p>
            <p><strong>Cost:</strong> Free tier available</p>
            <p><strong>Setup time:</strong> ~15 minutes</p>
            <ul style={{ marginLeft: '20px', marginTop: '8px', fontSize: '0.9rem' }}>
              <li>Create Auth0 application</li>
              <li>Configure M2M for Management API</li>
              <li>Set up user permissions flow</li>
            </ul>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            <h3>🗄️ Supabase (Required)</h3>
            <p><strong>Purpose:</strong> Database for users & rides</p>
            <p><strong>Cost:</strong> Free tier (500MB)</p>
            <p><strong>Setup time:</strong> ~10 minutes</p>
            <ul style={{ marginLeft: '20px', marginTop: '8px', fontSize: '0.9rem' }}>
              <li>Create Supabase project</li>
              <li>Run database schema</li>
              <li>Configure environment variables</li>
            </ul>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            <h3>🤖 OpenAI (Required)</h3>
            <p><strong>Purpose:</strong> AI agent responses</p>
            <p><strong>Cost:</strong> ~$0.002 per request</p>
            <p><strong>Setup time:</strong> ~5 minutes</p>
            <ul style={{ marginLeft: '20px', marginTop: '8px', fontSize: '0.9rem' }}>
              <li>Create OpenAI account</li>
              <li>Add billing method</li>
              <li>Generate API key</li>
            </ul>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            <h3>🗺️ Google Maps (Optional)</h3>
            <p><strong>Purpose:</strong> Route optimization</p>
            <p><strong>Cost:</strong> $200/month free credit</p>
            <p><strong>Setup time:</strong> ~10 minutes</p>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            <h3>🎵 Spotify (Optional)</h3>
            <p><strong>Purpose:</strong> Music preferences</p>
            <p><strong>Cost:</strong> Free</p>
            <p><strong>Setup time:</strong> ~5 minutes</p>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            <h3>🌤️ Weather API (Optional)</h3>
            <p><strong>Purpose:</strong> Weather insights</p>
            <p><strong>Cost:</strong> Free (1000 calls/day)</p>
            <p><strong>Setup time:</strong> ~3 minutes</p>
          </div>
        </div>
      </div>

      {/* Environment Setup */}
      <div className="card">
        <h2>📝 Environment Configuration</h2>
        <p>Copy the environment template and add your credentials:</p>
        
        <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
          <code style={{ display: 'block', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
{`# 1. Copy the template
cp .env.example .env.local

# 2. Edit with your credentials
# .env.local
DEMO_MODE=false
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
OPENAI_API_KEY=sk-your_openai_key
# ... add other credentials`}
          </code>
        </div>
      </div>

      {/* Step by Step */}
      <div className="card">
        <h2>📋 Detailed Setup Instructions</h2>
        <p>For complete step-by-step instructions with screenshots, see our comprehensive guides:</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <a 
            href="https://github.com/binarygaragedev/RouteWise/blob/master/COMPLETE_SETUP_GUIDE.md" 
            target="_blank" 
            className="btn btn-primary"
            style={{ textAlign: 'center' }}
          >
            📖 Complete Setup Guide
          </a>
          <a 
            href="https://github.com/binarygaragedev/RouteWise/blob/master/QUICK_SETUP_REFERENCE.md" 
            target="_blank" 
            className="btn btn-secondary"
            style={{ textAlign: 'center' }}
          >
            ⚡ Quick Reference
          </a>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="card">
        <h2>🔧 Common Issues</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <strong>🚫 404 Error:</strong> Make sure you've created the required pages (fixed!)
          </div>
          <div>
            <strong>🔐 Auth0 Login Issues:</strong> Check callback URLs match exactly
          </div>
          <div>
            <strong>🤖 OpenAI Errors:</strong> Verify API key and billing setup
          </div>
          <div>
            <strong>🗄️ Database Issues:</strong> Ensure Supabase schema is created
          </div>
        </div>
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