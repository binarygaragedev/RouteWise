// AI Agent Integration Component for Ride Management
// This component demonstrates how to integrate all AI agents into the ride flow

'use client';

import React, { useState, useEffect } from 'react';

interface AIAgentIntegrationProps {
  rideId: string;
  passengerId: string;
  driverId?: string;
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  rideStatus: string;
}

interface AgentResults {
  routeOptimization?: any;
  driverAssistance?: any;
  passengerExperience?: any;
  loading: boolean;
  error?: string;
}

export default function AIAgentIntegration({
  rideId,
  passengerId,
  driverId,
  pickup,
  destination,
  rideStatus
}: AIAgentIntegrationProps) {
  const [agentResults, setAgentResults] = useState<AgentResults>({
    loading: false
  });
  const [liveUpdates, setLiveUpdates] = useState<string[]>([]);

  // Initialize AI agents when ride status changes
  useEffect(() => {
    if (rideStatus === 'accepted' || rideStatus === 'pickup' || rideStatus === 'ongoing') {
      initializeAIAgents();
    }
  }, [rideStatus, rideId]);

  // Set up live updates polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (rideStatus === 'ongoing') {
      interval = setInterval(() => {
        fetchLiveUpdates();
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rideStatus, rideId]);

  const initializeAIAgents = async () => {
    setAgentResults(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      // Step 1: Route Optimization
      console.log('🗺️  Initializing route optimization...');
      const routeResponse = await fetch('/api/agent/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId,
          pickup,
          destination
        })
      });
      const routeResult = await routeResponse.json();

      // Step 2: Driver Assistance (if driver assigned)
      let driverResult = null;
      if (driverId) {
        console.log('👨‍💼 Activating driver assistance...');
        const driverResponse = await fetch('/api/agent/driver-assistance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rideId,
            driverId,
            passengerId,
            location: pickup,
            rideStatus
          })
        });
        driverResult = await driverResponse.json();
      }

      // Step 3: Passenger Experience Enhancement
      console.log('🎭 Enhancing passenger experience...');
      const passengerResponse = await fetch('/api/agent/passenger-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId,
          passengerId,
          driverId,
          rideStatus,
          pickup,
          destination
        })
      });
      const passengerResult = await passengerResponse.json();

      setAgentResults({
        routeOptimization: routeResult,
        driverAssistance: driverResult,
        passengerExperience: passengerResult,
        loading: false
      });

      console.log('✅ All AI agents initialized successfully!');

    } catch (error) {
      console.error('❌ AI agent initialization failed:', error);
      setAgentResults(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  const fetchLiveUpdates = async () => {
    try {
      // Get live updates for passengers
      const passengerUpdatesResponse = await fetch(
        `/api/agent/passenger-experience?rideId=${rideId}`
      );
      const passengerUpdates = await passengerUpdatesResponse.json();

      if (passengerUpdates.success) {
        setLiveUpdates(prev => [
          ...prev.slice(-5), // Keep last 5 updates
          ...passengerUpdates.data.updates
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch live updates:', error);
    }
  };

  const renderRouteOptimization = () => {
    if (!agentResults.routeOptimization?.success) return null;
    
    const data = agentResults.routeOptimization.data;
    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
        <h3 className="font-semibold text-blue-800 mb-2">🗺️ Route Optimization</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Distance:</span>
            <span className="ml-2 font-medium">{data.distance}</span>
          </div>
          <div>
            <span className="text-gray-600">Duration:</span>
            <span className="ml-2 font-medium">{data.duration}</span>
          </div>
          <div>
            <span className="text-gray-600">Cost:</span>
            <span className="ml-2 font-medium">${data.estimatedCost}</span>
          </div>
          <div>
            <span className="text-gray-600">Route:</span>
            <span className="ml-2 font-medium">{data.routeType}</span>
          </div>
        </div>
        {data.alternativeRoutes?.length > 0 && (
          <div className="mt-3">
            <span className="text-sm text-gray-600">Alternative routes available</span>
          </div>
        )}
      </div>
    );
  };

  const renderDriverAssistance = () => {
    if (!agentResults.driverAssistance?.success) return null;
    
    const data = agentResults.driverAssistance.data;
    return (
      <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
        <h3 className="font-semibold text-green-800 mb-2">👨‍💼 Driver Assistance</h3>
        
        {/* RAG Access Level Info */}
        {data.ragInfo && (
          <div className="bg-white p-3 rounded-md mb-3 border border-green-300">
            <div className="text-xs text-green-700 mb-1">
              <strong>🔒 Rating-based Access (RAG)</strong>
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-gray-600">Driver Rating:</span>
                <span className="ml-2 font-medium">⭐ {data.ragInfo.driverRating}/5.0</span>
              </div>
              <div>
                <span className="text-gray-600">Access Level:</span>
                <span className="ml-2 font-medium capitalize">{data.ragInfo.accessGranted}</span>
              </div>
              {data.ragInfo.hiddenPreferences > 0 && (
                <div className="text-orange-600">
                  🔒 {data.ragInfo.hiddenPreferences} preferences hidden due to rating
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-600">Music Preference:</span>
            <span className="ml-2 font-medium">{data.passengerInsights.preferredMusic}</span>
            {!data.passengerInsights.ratingSufficient && (
              <span className="ml-2 text-xs text-orange-600">🔒 Limited</span>
            )}
          </div>
          <div>
            <span className="text-gray-600">Communication:</span>
            <span className="ml-2 font-medium capitalize">{data.passengerInsights.chattiness}</span>
          </div>
          <div>
            <span className="text-gray-600">Ride Earnings:</span>
            <span className="ml-2 font-medium">${data.earnings.currentRide}</span>
          </div>
          <div>
            <span className="text-gray-600">Weather:</span>
            <span className="ml-2 font-medium">{data.weatherAdvisory}</span>
          </div>
          
          {/* Special Requests */}
          {data.passengerInsights.specialRequests?.length > 0 && (
            <div className="mt-3">
              <span className="text-gray-600 text-xs">Special Requests:</span>
              <div className="mt-1">
                {data.passengerInsights.specialRequests.map((request: string, index: number) => (
                  <div key={index} className="text-xs bg-green-100 px-2 py-1 rounded mb-1">
                    {request}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPassengerExperience = () => {
    if (!agentResults.passengerExperience?.success) return null;
    
    const data = agentResults.passengerExperience.data;
    return (
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
        <h3 className="font-semibold text-purple-800 mb-2">🎭 Passenger Experience</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">{data.personalizedGreeting}</span>
          </div>
          <div>
            <span className="text-gray-600">Music Suggestions:</span>
            <div className="ml-2 text-xs">
              {data.entertainment.musicSuggestions.slice(0, 2).join(', ')}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Weather at Destination:</span>
            <div className="ml-2 font-medium">{data.convenience.weatherAtDestination}</div>
          </div>
          <div>
            <span className="text-gray-600">Safety:</span>
            <div className="ml-2 text-xs">{data.safetyFeatures.shareRideStatus}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderLiveUpdates = () => {
    if (liveUpdates.length === 0) return null;
    
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">📱 Live Updates</h3>
        <div className="space-y-1">
          {liveUpdates.slice(-3).map((update, index) => (
            <div key={index} className="text-sm text-gray-700">
              • {update}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (agentResults.loading) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Initializing AI agents...</span>
        </div>
      </div>
    );
  }

  if (agentResults.error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="font-semibold text-red-800 mb-2">❌ AI Agent Error</h3>
        <p className="text-sm text-red-600">{agentResults.error}</p>
        <button
          onClick={initializeAIAgents}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ display: 'none' }}>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h2 className="font-semibold text-gray-800 mb-4">🤖 AI Agents Active</h2>
        
        {renderRouteOptimization()}
        {renderDriverAssistance()}
        {renderPassengerExperience()}
        {renderLiveUpdates()}
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            AI agents operational
          </div>
          <div className="text-xs text-gray-500">
            Secure • Auth0 Protected • Real-time
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage example in ride components:
/*
<AIAgentIntegration
  rideId={ride.id}
  passengerId={user.id}
  driverId={ride.driverId}
  pickup={ride.pickup}
  destination={ride.destination}
  rideStatus={ride.status}
/>
*/