'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <div className="hero">
        <h1>🚖 RouteWise AI</h1>
        <h2>Auth0 for AI Agents Contest Submission</h2>
        <p>Privacy-First Rideshare Platform with Secure AI Agents</p>
      </div>

      {/* Navigation Cards */}
      <div className="nav-cards">
        <Link href="/passenger" className="nav-card">
          <div className="card passenger-card">
            <div className="card-icon">👥</div>
            <h3>Passenger</h3>
            <p>Book rides with AI assistance</p>
          </div>
        </Link>

        <Link href="/driver" className="nav-card">
          <div className="card driver-card">
            <div className="card-icon">🚗</div>
            <h3>Driver</h3>
            <p>Accept rides and earn money</p>
          </div>
        </Link>
      </div>

      {/* Auth Status */}
      <div className="auth-status">
        {user ? (
          <div className="logged-in">
            <p>✅ Signed in as {user.name}</p>
            <a href="/api/auth/logout" className="btn btn-secondary">Sign Out</a>
          </div>
        ) : (
          <div className="logged-out">
            <p>🔐 Choose your login type to access features</p>
            <div className="login-options">
              <a href="/api/auth/login?returnTo=/passenger&role=passenger" className="btn btn-primary passenger-login">
                👥 Sign In as Passenger
              </a>
              <a href="/api/auth/login?returnTo=/driver&role=driver" className="btn btn-primary driver-login">
                🚗 Sign In as Driver
              </a>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }

        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%, #f093fb 100%);
          color: white;
          padding: 80px 40px;
          border-radius: 24px;
          margin-bottom: 50px;
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .hero h1 {
          font-size: 3.5rem;
          margin: 0 0 15px 0;
          font-weight: 800;
          background: linear-gradient(45deg, #ffffff, #f0f8ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .hero h2 {
          font-size: 1.6rem;
          margin: 0 0 25px 0;
          opacity: 0.95;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .hero p {
          font-size: 1.3rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 300;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .nav-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 40px;
          margin-bottom: 50px;
        }

        .nav-card {
          text-decoration: none;
          color: inherit;
          transform: translateY(0);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .nav-card:hover {
          transform: translateY(-12px);
        }

        .card {
          background: white;
          border-radius: 24px;
          padding: 50px 40px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.08);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .card:hover::before {
          opacity: 1;
        }

        .card:hover {
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
          transform: translateY(-5px);
        }

        .passenger-card {
          border-top: 4px solid #10b981;
          background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
        }

        .passenger-card:hover {
          border-color: #059669;
          box-shadow: 0 25px 50px rgba(16, 185, 129, 0.2);
        }

        .driver-card {
          border-top: 4px solid #f59e0b;
          background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
        }

        .driver-card:hover {
          border-color: #d97706;
          box-shadow: 0 25px 50px rgba(245, 158, 11, 0.2);
        }

        .card-icon {
          font-size: 4.5rem;
          margin-bottom: 25px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
          transition: all 0.3s ease;
        }

        .card:hover .card-icon {
          transform: scale(1.1);
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15));
        }

        .card h3 {
          font-size: 2.2rem;
          margin: 0 0 18px 0;
          color: #1f2937;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .card p {
          font-size: 1.3rem;
          color: #6b7280;
          margin: 0;
          font-weight: 400;
          line-height: 1.6;
        }

        .auth-status {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 40px;
          margin-top: 50px;
          backdrop-filter: blur(20px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.08);
        }

        .logged-in p {
          color: #059669;
          font-size: 1.3rem;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .logged-out p {
          color: #6b7280;
          font-size: 1.3rem;
          margin-bottom: 25px;
          font-weight: 500;
        }

        .login-options {
          display: flex;
          gap: 25px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .passenger-login {
          background: linear-gradient(135deg, #10b981, #059669) !important;
          border: none;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        .passenger-login:hover {
          background: linear-gradient(135deg, #059669, #047857) !important;
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(16, 185, 129, 0.4);
        }

        .driver-login {
          background: linear-gradient(135deg, #f59e0b, #d97706) !important;
          border: none;
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
        }

        .driver-login:hover {
          background: linear-gradient(135deg, #d97706, #b45309) !important;
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(245, 158, 11, 0.4);
        }

        .btn {
          display: inline-block;
          padding: 16px 36px;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          letter-spacing: 0.025em;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.9);
          color: #6b7280;
          border: 1px solid rgba(209, 213, 219, 0.5);
          backdrop-filter: blur(10px);
        }

        .btn-secondary:hover {
          background: rgba(249, 250, 251, 0.95);
          color: #374151;
          border-color: #9ca3af;
          transform: translateY(-2px);
        }

        .loading {
          text-align: center;
          padding: 100px;
          font-size: 1.6rem;
          color: #6b7280;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .hero {
            padding: 40px 20px;
          }

          .hero h1 {
            font-size: 2rem;
          }

          .hero h2 {
            font-size: 1.2rem;
          }

          .nav-cards {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .card {
            padding: 30px 20px;
          }

          .card-icon {
            font-size: 3rem;
          }

          .card h3 {
            font-size: 1.5rem;
          }

          .login-options {
            flex-direction: column;
            gap: 15px;
          }

          .passenger-login,
          .driver-login {
            width: 100%;
            max-width: 280px;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}