import axios from 'axios';
import { auth0Manager } from './auth0';

/**
 * Auth0 for AI Agents - Token Vault Implementation
 * 
 * This demonstrates Auth0's Token Vault capability:
 * - Securely manages OAuth tokens for external APIs
 * - Controls which APIs AI agents can access on user's behalf
 * - Provides fine-grained permission management
 * 
 * Contest Requirement: "Control the tools - Manage which APIs your agent can call"
 */

// Define provider types for both vault storage and refresh functionality
export type VaultProvider = 'openai' | 'spotify' | 'google' | 'weather' | 'maps';
export type RefreshableProvider = 'spotify' | 'google';
export type AgentType = 'RidePreparation' | 'SafetyMonitoring' | 'ConsentNegotiation' | 'any';

interface StoredToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scopes: string[];
  permissions: string[]; // Contest addition: AI agent permissions
}

interface AgentPermission {
  agentType: string;
  apiAccess: string[];
  dataScopes: string[];
  expiresAt: number;
}

class TokenVault {
  private tokens: Map<string, StoredToken> = new Map();
  private agentPermissions: Map<string, AgentPermission[]> = new Map();

  // Helper method to check if provider supports token refresh
  private isRefreshableProvider(provider: VaultProvider): provider is RefreshableProvider {
    return ['spotify', 'google'].includes(provider);
  }

  /**
   * Contest Feature: Store OAuth token with AI agent permission controls
   */
  async storeToken(
    userId: string,
    provider: 'spotify' | 'google' | 'maps' | 'weather',
    tokenData: {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scopes: string[];
    },
    agentPermissions: string[] = [] // Which AI agents can use this token
  ): Promise<void> {
    const key = `${userId}:${provider}`;
    
    this.tokens.set(key, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      scopes: tokenData.scopes,
      permissions: agentPermissions, // Contest: Control AI agent access
    });

    // Contest: Store in Auth0 user metadata with agent permissions
    await auth0Manager.updateUserMetadata(userId, {
      [`${provider}_connected`]: true,
      [`${provider}_scopes`]: tokenData.scopes,
      [`${provider}_agent_permissions`]: agentPermissions, // NEW: AI agent control
    });

    console.log(`🔐 [AUTH0 AI AGENTS] Token stored for ${userId} - ${provider}`);
    console.log(`🤖 Agent permissions: ${agentPermissions.join(', ')}`);
  }

  /**
   * Contest Feature: AI Agent Token Access Control
   * 
   * This is the key Auth0 for AI Agents feature:
   * AI agents must request permission to use user's API tokens
   */
  async getTokenForAgent(
    userId: string,
    agentType: 'ride-preparation' | 'consent-negotiation' | 'safety-monitoring',
    provider: 'spotify' | 'google' | 'maps' | 'weather',
    requiredScopes?: string[]
  ): Promise<string | null> {
    console.log(`🤖 [AUTH0 AI AGENTS] Agent ${agentType} requesting ${provider} access for user ${userId}`);
    
    const key = `${userId}:${provider}`;
    const stored = this.tokens.get(key);
    
    if (!stored) {
      console.log(`❌ No token found for ${userId} - ${provider}`);
      return null;
    }

    // Contest Requirement: Check if this AI agent has permission to use this token
    if (!stored.permissions.includes(agentType)) {
      console.log(`🚫 [SECURITY] Agent ${agentType} not authorized to access ${provider} for user ${userId}`);
      console.log(`📋 Authorized agents: ${stored.permissions.join(', ')}`);
      return null;
    }

    // Check if token expired
    if (Date.now() >= stored.expires_at) {
      console.log(`⏰ Token expired for ${userId} - ${provider}`);
      if (stored.refresh_token && this.isRefreshableProvider(provider)) {
        return await this.refreshToken(userId, provider as RefreshableProvider, stored.refresh_token);
      }
      return null;
    }

    // Check scopes
    if (requiredScopes) {
      const hasAllScopes = requiredScopes.every(scope => 
        stored.scopes.includes(scope)
      );
      if (!hasAllScopes) {
        console.log(`❌ Missing required scopes for ${provider}: ${requiredScopes.join(', ')}`);
        return null;
      }
    }

    console.log(`✅ [AUTH0 AI AGENTS] Token access granted to agent ${agentType} for ${provider}`);
    return stored.access_token;
  }

  /**
   * Retrieve a user's OAuth token (with permission check)
   */
  async getToken(
    userId: string,
    provider: 'spotify' | 'google' | 'other',
    requiredScopes?: string[]
  ): Promise<string | null> {
    const key = `${userId}:${provider}`;
    const stored = this.tokens.get(key);

    if (!stored) {
      console.log(`❌ No token found for ${userId} - ${provider}`);
      return null;
    }

    // Check if token expired
    if (Date.now() >= stored.expires_at) {
      console.log(`⏰ Token expired for ${userId} - ${provider}`);
      // In production: Attempt refresh
      if (stored.refresh_token) {
        return await this.refreshToken(userId, provider, stored.refresh_token);
      }
      return null;
    }

    // Check scopes
    if (requiredScopes) {
      const hasAllScopes = requiredScopes.every(scope => 
        stored.scopes.includes(scope)
      );
      if (!hasAllScopes) {
        console.log(`❌ Missing required scopes for ${userId} - ${provider}`);
        return null;
      }
    }

    console.log(`✓ Token retrieved for ${userId} - ${provider}`);
    return stored.access_token;
  }

  /**
   * Refresh an expired token
   */
  private async refreshToken(
    userId: string,
    provider: 'spotify' | 'google' | 'other',
    refreshToken: string
  ): Promise<string | null> {
    try {
      if (provider === 'spotify') {
        const response = await axios.post(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
              ).toString('base64')}`,
            },
          }
        );

        await this.storeToken(userId, provider, {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token || refreshToken,
          expires_in: response.data.expires_in,
          scopes: response.data.scope?.split(' ') || [],
        });

        return response.data.access_token;
      }

      return null;
    } catch (error) {
      console.error(`Failed to refresh token for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Remove a user's token
   */
  async revokeToken(userId: string, provider: 'spotify' | 'google' | 'other'): Promise<void> {
    const key = `${userId}:${provider}`;
    this.tokens.delete(key);

    await auth0Manager.updateUserMetadata(userId, {
      [`${provider}_connected`]: false,
    });

    console.log(`🗑️ Token revoked for ${userId} - ${provider}`);
  }
}

export const tokenVault = new TokenVault();

// Helper function for M2M token (agent authentication)
export async function getAgentToken(): Promise<string> {
  const response = await axios.post(
    `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
    {
      grant_type: 'client_credentials',
      client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
    }
  );

  return response.data.access_token;
}
