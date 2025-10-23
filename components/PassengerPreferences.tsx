'use client';

import React, { useState, useEffect } from 'react';
import { PassengerPreferences, PassengerPreferencesDB } from '@/lib/passenger-preferences';

interface PassengerPreferencesComponentProps {
  passengerId: string;
  onClose: () => void;
}

export default function PassengerPreferencesComponent({
  passengerId,
  onClose
}: PassengerPreferencesComponentProps) {
  const [preferences, setPreferences] = useState<PassengerPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [passengerId]);

  const loadPreferences = async () => {
    try {
      const response = await fetch(`/api/passenger/preferences?passengerId=${passengerId}`);
      const result = await response.json();
      
      if (result.success) {
        setPreferences(result.data.preferences);
      } else {
        console.error('Failed to load preferences:', result.error);
        // Create default preferences
        const defaultPrefs = PassengerPreferencesDB.getDefaultPreferences(passengerId);
        setPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Fallback to default preferences
      const defaultPrefs = PassengerPreferencesDB.getDefaultPreferences(passengerId);
      setPreferences(defaultPrefs);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/passenger/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passengerId,
          preferences
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Preferences saved successfully!');
        onClose();
      } else {
        alert(`❌ Failed to save preferences: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('❌ Error saving preferences.');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof PassengerPreferences, value: any) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [key]: value,
      updated_at: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <div className="preferences-overlay">
        <div className="preferences-modal">
          <div className="loading">Loading preferences...</div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="preferences-overlay">
        <div className="preferences-modal">
          <div className="error">Failed to load preferences</div>
        </div>
      </div>
    );
  }

  const accessLevelDescription = PassengerPreferencesDB.getAccessLevelDescription(
    PassengerPreferencesDB.getDriverAccessLevel(4.5, preferences.min_driver_rating).accessLevel
  );

  return (
    <div className="preferences-overlay">
      <div className="preferences-modal">
        <div className="preferences-header">
          <h2>🎛️ Your Ride Preferences</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="preferences-content">
          
          {/* Music Preferences */}
          <div className="preference-section">
            <h3>🎵 Music Preferences</h3>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.music_enabled}
                  onChange={(e) => updatePreference('music_enabled', e.target.checked)}
                />
                Enable music during ride
              </label>
            </div>
            {preferences.music_enabled && (
              <>
                <div className="form-group">
                  <label>Preferred Genre:</label>
                  <select
                    value={preferences.music_genre}
                    onChange={(e) => updatePreference('music_genre', e.target.value)}
                  >
                    <option value="pop">Pop</option>
                    <option value="rock">Rock</option>
                    <option value="jazz">Jazz</option>
                    <option value="classical">Classical</option>
                    <option value="country">Country</option>
                    <option value="electronic">Electronic</option>
                    <option value="hip-hop">Hip-Hop</option>
                    <option value="alternative">Alternative</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Volume Level:</label>
                  <select
                    value={preferences.music_volume}
                    onChange={(e) => updatePreference('music_volume', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Communication Preferences */}
          <div className="preference-section">
            <h3>💬 Communication Preferences</h3>
            <div className="form-group">
              <label>Communication Style:</label>
              <select
                value={preferences.communication_style}
                onChange={(e) => updatePreference('communication_style', e.target.value)}
              >
                <option value="chatty">Chatty - I enjoy conversation</option>
                <option value="neutral">Neutral - I'm flexible</option>
                <option value="quiet">Quiet - I prefer silence</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.small_talk}
                  onChange={(e) => updatePreference('small_talk', e.target.checked)}
                />
                Open to small talk
              </label>
            </div>
            <div className="form-group">
              <label>Phone Usage During Ride:</label>
              <select
                value={preferences.phone_usage}
                onChange={(e) => updatePreference('phone_usage', e.target.value)}
              >
                <option value="allowed">Allowed - Calls/texts OK</option>
                <option value="silent">Silent - Emergency only</option>
                <option value="no_preference">No preference</option>
              </select>
            </div>
          </div>

          {/* Safety Preferences */}
          <div className="preference-section">
            <h3>🛡️ Safety Preferences</h3>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.share_trip_status}
                  onChange={(e) => updatePreference('share_trip_status', e.target.checked)}
                />
                Share trip status with emergency contacts
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.ride_recording}
                  onChange={(e) => updatePreference('ride_recording', e.target.checked)}
                />
                Enable ride recording for safety
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.photo_verification}
                  onChange={(e) => updatePreference('photo_verification', e.target.checked)}
                />
                Require driver photo verification
              </label>
            </div>
          </div>

          {/* Comfort Preferences */}
          <div className="preference-section">
            <h3>🌡️ Comfort Preferences</h3>
            <div className="form-group">
              <label>Preferred Temperature: {preferences.temperature_preference}°C</label>
              <input
                type="range"
                min="16"
                max="28"
                value={preferences.temperature_preference}
                onChange={(e) => updatePreference('temperature_preference', parseInt(e.target.value))}
              />
              <div className="temp-labels">
                <span>16°C (Cool)</span>
                <span>28°C (Warm)</span>
              </div>
            </div>
            <div className="form-group">
              <label>Window Preference:</label>
              <select
                value={preferences.window_preference}
                onChange={(e) => updatePreference('window_preference', e.target.value)}
              >
                <option value="open">Open - Fresh air</option>
                <option value="closed">Closed - AC/Heat</option>
                <option value="no_preference">No preference</option>
              </select>
            </div>
          </div>

          {/* Trip Preferences */}
          <div className="preference-section">
            <h3>🗺️ Trip Preferences</h3>
            <div className="form-group">
              <label>Route Preference:</label>
              <select
                value={preferences.route_preference}
                onChange={(e) => updatePreference('route_preference', e.target.value)}
              >
                <option value="fastest">Fastest route</option>
                <option value="scenic">Scenic route</option>
                <option value="safest">Safest route</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.stops_allowed}
                  onChange={(e) => updatePreference('stops_allowed', e.target.checked)}
                />
                Allow brief stops (gas, coffee, etc.)
              </label>
            </div>
          </div>

          {/* Privacy & Driver Access Control */}
          <div className="preference-section privacy-section">
            <h3>🔒 Privacy & Driver Access Control</h3>
            <div className="rag-info">
              <p><strong>Rating-based Access Governance (RAG)</strong></p>
              <p>Higher-rated drivers see more of your preferences to provide better service.</p>
            </div>
            
            <div className="form-group">
              <label>Minimum Driver Rating for Full Access:</label>
              <select
                value={preferences.min_driver_rating}
                onChange={(e) => updatePreference('min_driver_rating', parseFloat(e.target.value))}
              >
                <option value={4.8}>4.8+ ⭐⭐⭐⭐⭐ (Excellent drivers only)</option>
                <option value={4.5}>4.5+ ⭐⭐⭐⭐ (Good drivers and above)</option>
                <option value={4.0}>4.0+ ⭐⭐⭐ (Average drivers and above)</option>
                <option value={3.5}>3.5+ ⭐⭐ (Most drivers)</option>
              </select>
            </div>

            <div className="access-preview">
              <h4>Access Level Preview:</h4>
              <div className="access-level">
                {accessLevelDescription}
              </div>
            </div>

            <div className="form-group">
              <label>Privacy Level:</label>
              <select
                value={preferences.privacy_level}
                onChange={(e) => updatePreference('privacy_level', e.target.value)}
              >
                <option value="open">Open - Share most preferences</option>
                <option value="selective">Selective - Rating-based access</option>
                <option value="minimal">Minimal - Basic info only</option>
              </select>
            </div>
          </div>

        </div>

        <div className="preferences-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={savePreferences} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .preferences-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .preferences-modal {
          background: white;
          border-radius: 15px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .preferences-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .preferences-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preferences-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .preference-section {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .preference-section:last-child {
          border-bottom: none;
        }

        .preference-section h3 {
          margin: 0 0 15px 0;
          color: #374151;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input[type="checkbox"] {
          margin-right: 8px;
        }

        .form-group select,
        .form-group input[type="range"] {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .temp-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #6b7280;
          margin-top: 5px;
        }

        .privacy-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }

        .rag-info {
          background: #eff6ff;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #3b82f6;
        }

        .rag-info p {
          margin: 0 0 5px 0;
          font-size: 14px;
          color: #1e40af;
        }

        .access-preview {
          background: white;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border: 1px solid #d1d5db;
        }

        .access-preview h4 {
          margin: 0 0 10px 0;
          color: #374151;
          font-size: 14px;
        }

        .access-level {
          font-size: 14px;
          padding: 8px 12px;
          background: #f3f4f6;
          border-radius: 6px;
          color: #374151;
        }

        .preferences-footer {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .loading, .error {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          font-size: 16px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}