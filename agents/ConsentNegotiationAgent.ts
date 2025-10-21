import { BaseAgent, AgentResult } from './BaseAgent';
import { auth0Manager } from '../lib/auth0';
import { getDriver } from '../lib/db';

export interface ConsentRequest {
  driverId: string;
  passengerId: string;
  dataCategory: string;
  reason?: string;
}

export class ConsentNegotiationAgent extends BaseAgent {
  constructor() {
    super('Consent Negotiation Agent');
  }

  /**
   * Request additional consent from passenger
   */
  async execute(request: ConsentRequest): Promise<AgentResult> {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🤝 CONSENT NEGOTIATION AGENT ACTIVATED`);
      console.log(`Driver requesting: ${request.dataCategory}`);
      console.log(`${'='.repeat(60)}\n`);

      // Step 1: Initialize agent
      await this.initialize();

      // Step 2: Check if driver is eligible to request
      const eligible = await this.checkEligibility(request.driverId);
      if (!eligible.allowed) {
        console.log(`❌ Driver not eligible: ${eligible.reason}\n`);
        return {
          success: false,
          error: eligible.reason,
          dataAccessed: [],
        };
      }

      // Step 3: Generate personalized request message
      const message = await this.generateConsentRequest(request);

      // Step 4: Send request to passenger
      await this.sendConsentRequest(request.passengerId, message);

      // Step 5: Log the request
      await this.logAction({
        action: 'consent_request_sent',
        subjectId: request.passengerId,
        dataAccessed: [request.dataCategory],
        reason: request.reason || 'Driver requested additional access',
      });

      console.log(`✅ Consent request sent successfully\n`);

      return {
        success: true,
        data: {
          message,
          status: 'pending',
          expiresIn: '5 minutes',
        },
        dataAccessed: ['driver_profile'],
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Process passenger's response to consent request
   */
  async processResponse(
    passengerId: string,
    driverId: string,
    dataCategory: string,
    approved: boolean,
    duration?: number
  ): Promise<AgentResult> {
    try {
      console.log(`\n📨 Processing consent response: ${approved ? 'APPROVED' : 'DENIED'}\n`);

      if (approved) {
        // Update Auth0 user metadata with new consent
        const passenger = await auth0Manager.getUser(passengerId);
        const currentConsent = passenger.user_metadata?.consent_settings || {};

        const newConsent = {
          ...currentConsent,
          [dataCategory]: {
            share_with: 'verified_only',
            granted_to: [
              ...(currentConsent[dataCategory]?.granted_to || []),
              driverId,
            ],
            expires_after_ride: duration ? false : true,
            expires_at: duration ? Date.now() + duration : null,
          },
        };

        await auth0Manager.updateUserMetadata(passengerId, {
          consent_settings: newConsent,
        });

        console.log(`✓ Consent granted for ${dataCategory}`);

        // Log approval
        await this.logAction({
          action: 'consent_granted',
          subjectId: passengerId,
          dataAccessed: [dataCategory],
          reason: `Passenger approved driver access to ${dataCategory}`,
        });

        return {
          success: true,
          data: {
            status: 'approved',
            dataCategory,
            expiresAt: newConsent[dataCategory].expires_at,
          },
          dataAccessed: ['passenger_consent_settings'],
        };
      } else {
        // Log denial
        await this.logAction({
          action: 'consent_denied',
          subjectId: passengerId,
          dataAccessed: [dataCategory],
          reason: `Passenger denied driver access to ${dataCategory}`,
        });

        console.log(`✗ Consent denied for ${dataCategory}`);

        return {
          success: true,
          data: {
            status: 'denied',
            dataCategory,
          },
          dataAccessed: [],
        };
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Check if driver is eligible to request consent
   */
  private async checkEligibility(
    driverId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const driver = await getDriver(driverId);

    if (!driver) {
      return { allowed: false, reason: 'Driver not found' };
    }

    // Check rating threshold
    if (driver.rating < 4.5) {
      return {
        allowed: false,
        reason: 'Driver rating must be 4.5+ to request additional access',
      };
    }

    // Check verification level
    if (driver.verification_level === 'new' && driver.total_rides < 10) {
      return {
        allowed: false,
        reason: 'New drivers must complete 10 rides before requesting access',
      };
    }

    return { allowed: true };
  }

  /**
   * Generate personalized consent request using AI
   */
  private async generateConsentRequest(request: ConsentRequest): Promise<string> {
    const driver = await getDriver(request.driverId);

    const aiResponse = await this.callAI([
      {
        role: 'user',
        content: `Generate a polite, personalized consent request message.

Driver: ${driver?.name}
Rating: ${driver?.rating}★
Total Rides: ${driver?.total_rides}
Verification: ${driver?.verification_level}

Requesting access to: ${request.dataCategory}
Reason: ${request.reason || 'To provide better service'}

Write a short, friendly message (2-3 sentences) that:
1. Introduces the driver
2. Explains what they're requesting
3. Emphasizes it's optional and can be revoked anytime

Keep it conversational and respectful.`,
      },
    ]);

    return aiResponse;
  }

  /**
   * Send consent request to passenger
   */
  private async sendConsentRequest(passengerId: string, message: string): Promise<void> {
    console.log('📤 Sending consent request notification...');
    console.log(`Message: ${message}\n`);

    // In production:
    // - Send in-app notification
    // - Send SMS if urgent
    // - Send push notification
    // await notificationService.send({
    //   userId: passengerId,
    //   type: 'consent_request',
    //   message,
    //   actions: ['approve', 'deny'],
    // });
  }
}

export const consentNegotiationAgent = new ConsentNegotiationAgent();