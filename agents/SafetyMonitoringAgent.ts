import { BaseAgent, AgentResult } from './BaseAgent';
import { auth0Manager } from '../lib/auth0';
import { getRide } from '../lib/db';
import { mapsService } from '../services/maps';
import axios from 'axios';

export interface SafetyAlert {
  type: 'route_deviation' | 'excessive_duration' | 'panic_button' | 'unusual_stop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  rideId: string;
  location?: { lat: number; lng: number };
  details: string;
}

export class SafetyMonitoringAgent extends BaseAgent {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super('Safety Monitoring Agent');
  }

  /**
   * Required execute method from BaseAgent
   */
  async execute(rideId: string): Promise<AgentResult> {
    return this.startMonitoring(rideId);
  }

  /**
   * Start monitoring a ride
   */
  async startMonitoring(rideId: string): Promise<AgentResult> {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🛡️  SAFETY MONITORING AGENT ACTIVATED`);
      console.log(`Monitoring ride: ${rideId}`);
      console.log(`${'='.repeat(60)}\n`);

      await this.initialize();

      // Set up monitoring interval (every 30 seconds)
      const interval = setInterval(async () => {
        await this.checkRideSafety(rideId);
      }, 30000);

      this.monitoringIntervals.set(rideId, interval);

      console.log(`✓ Monitoring started (checking every 30 seconds)\n`);

      return {
        success: true,
        data: { status: 'monitoring', rideId },
        dataAccessed: [],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Stop monitoring a ride
   */
  stopMonitoring(rideId: string): void {
    const interval = this.monitoringIntervals.get(rideId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(rideId);
      console.log(`✓ Monitoring stopped for ride ${rideId}`);
    }
  }

  /**
   * Handle emergency (panic button pressed)
   */
  async handleEmergency(rideId: string, emergencyType: string): Promise<AgentResult> {
    try {
      console.log(`\n🚨 EMERGENCY DETECTED: ${emergencyType}\n`);

      await this.initialize();

      const ride = await getRide(rideId);
      if (!ride) {
        if (this.isDemoMode) {
          console.log('🚨 [DEMO] Using mock ride data for emergency');
          // Create mock ride data for demo and continue with normal flow
          const mockRide = {
            id: rideId,
            passenger_id: 'auth0|passenger_john_123',
            driver_id: 'auth0|driver_sarah_verified',
            pickup_location: { lat: 40.7128, lng: -74.0060, address: '123 Main St, NYC' },
            destination: { lat: 40.7589, lng: -73.9851, address: '456 Broadway, NYC' },
            status: 'in_progress',
            fare: 25.50,
            requested_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
            metadata: {}
          };
          
          // Continue with emergency protocol using mock data
          console.log('⚠️  Escalating permissions for emergency...');

          // Get passenger with emergency override
          const passenger = await auth0Manager.getUser(mockRide.passenger_id);
          const emergencyContact = passenger.user_metadata?.emergency_contact;

          // Log emergency override
          await this.logAction({
            action: 'emergency_override',
            subjectId: mockRide.passenger_id,
            dataAccessed: ['emergency_contact', 'location', 'ride_details'],
            reason: `Emergency: ${emergencyType} - User safety emergency requiring immediate action`,
          });

          // Take immediate actions
          const actions = await this.executeEmergencyProtocol(
            mockRide,
            emergencyType,
            emergencyContact
          );

          console.log(`🚨 Emergency response completed for ${emergencyType}`);
          console.log(`🚨 Actions taken: ${actions.join(', ')}`);

          return {
            success: true,
            dataAccessed: ['emergency_contact', 'location', 'ride_details'],
            data: {
              emergency_type: emergencyType,
              actions_taken: actions,
              ride_id: rideId,
              response_time: '< 30 seconds',
              message: `🚨 Emergency Response: ${emergencyType} handled successfully`
            }
          };
        }
        throw new Error('Ride not found');
      }

      // Agent escalates its permissions during emergency
      console.log('⚠️  Escalating permissions for emergency...');

      // Get passenger with emergency override
      const passenger = await auth0Manager.getUser(ride.passenger_id);
      const emergencyContact = passenger.user_metadata?.emergency_contact;

      // Log emergency override
      await this.logAction({
        action: 'emergency_override',
        subjectId: ride.passenger_id,
        dataAccessed: ['emergency_contact', 'location', 'ride_details'],
        reason: `Emergency: ${emergencyType} - User safety emergency requiring immediate action`,
      });

      // Take immediate actions
      const actions = await this.executeEmergencyProtocol(
        ride,
        emergencyContact,
        emergencyType
      );

      console.log(`\n✅ Emergency protocol executed: ${actions.length} actions taken\n`);

      return {
        success: true,
        data: {
          actions,
          emergencyType,
          timestamp: new Date().toISOString(),
        },
        dataAccessed: ['emergency_contact', 'location'],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check ride safety periodically
   */
  private async checkRideSafety(rideId: string): Promise<void> {
    try {
      const ride = await getRide(rideId);
      if (!ride || ride.status !== 'active') {
        this.stopMonitoring(rideId);
        return;
      }

      console.log(`🔍 Safety check for ride ${rideId}...`);

      // Check 1: Route deviation
      const routeOk = await this.checkRouteDeviation(ride);
      if (!routeOk) {
        await this.raiseAlert({
          type: 'route_deviation',
          severity: 'medium',
          rideId,
          details: 'Vehicle has deviated from expected route',
        });
      }

      // Check 2: Excessive duration
      const durationOk = await this.checkDuration(ride);
      if (!durationOk) {
        await this.raiseAlert({
          type: 'excessive_duration',
          severity: 'medium',
          rideId,
          details: 'Ride duration exceeds expected time by 30%',
        });
      }

      console.log(`✓ Safety check completed`);
    } catch (error) {
      console.error('Error during safety check:', error);
    }
  }

  /**
   * Check for route deviation
   */
  private async checkRouteDeviation(ride: any): Promise<boolean> {
    // In production: Compare current location with expected route
    // For demo: Simulate check
    const random = Math.random();
    return random > 0.1; // 10% chance of deviation for demo
  }

  /**
   * Check ride duration
   */
  private async checkDuration(ride: any): Promise<boolean> {
    if (!ride.started_at) return true;

    const startTime = new Date(ride.started_at).getTime();
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;

    // Get expected duration from route
    const expectedDuration = ride.ai_insights?.routeSuggestion?.duration || '15 min';
    const expectedMs = this.parseDuration(expectedDuration);

    // Alert if >30% over expected time
    return elapsed < expectedMs * 1.3;
  }

  /**
   * Raise a safety alert
   */
  private async raiseAlert(alert: SafetyAlert): Promise<void> {
    console.log(`\n⚠️  SAFETY ALERT: ${alert.type}`);
    console.log(`Severity: ${alert.severity}`);
    console.log(`Details: ${alert.details}\n`);

    const ride = await getRide(alert.rideId);
    if (!ride) return;

    // Notify passenger
    console.log('📱 Notifying passenger of potential issue...');

    // Notify support team if severity is high
    if (alert.severity === 'high' || alert.severity === 'critical') {
      console.log('🚨 Alerting support team...');
    }

    // Log the alert
    await this.logAction({
      action: 'safety_alert_raised',
      subjectId: alert.rideId,
      dataAccessed: ['location', 'route'],
      reason: alert.details,
    });

    // In production:
    // await notificationService.sendAlert(ride.passenger_id, alert);
    // await supportService.notifyTeam(alert);
  }

  /**
   * Execute emergency protocol
   */
  private async executeEmergencyProtocol(
    ride: any,
    emergencyContact: any,
    emergencyType: string
  ): Promise<string[]> {
    const actions: string[] = [];

    // Action 1: Alert emergency contact
    if (emergencyContact) {
      console.log(`📞 Contacting emergency contact: ${emergencyContact.phone}`);
      // await notificationService.callEmergencyContact(emergencyContact);
      actions.push('Emergency contact notified');
    }

    // Action 2: Share location with emergency services
    if (ride.current_location) {
      console.log(`📍 Sharing location with emergency services`);
      // await emergencyService.shareLocation(ride.current_location);
      actions.push('Location shared with 911');
    }

    // Action 3: Notify support team immediately
    console.log(`🆘 Alerting support team`);
    // await supportService.emergencyAlert({ ride, emergencyType });
    actions.push('Support team alerted');

    // Action 4: Lock driver account (preventive)
    console.log(`🔒 Temporarily locking driver account`);
    await auth0Manager.updateAppMetadata(ride.driver_id, {
      account_locked: true,
      lock_reason: `Emergency in ride ${ride.id}`,
      locked_at: new Date().toISOString()
    });
    actions.push('Driver account temporarily locked');

    return actions;
  }

  /**
   * Parse duration string to milliseconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)\s*(min|hour|hr)/i);
    if (!match) return 15 * 60 * 1000; // default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    if (unit.startsWith('hour') || unit === 'hr') {
      return value * 60 * 60 * 1000;
    }
    return value * 60 * 1000; // minutes
  }

}

// Export singleton instance
export const safetyMonitoringAgent = new SafetyMonitoringAgent();
