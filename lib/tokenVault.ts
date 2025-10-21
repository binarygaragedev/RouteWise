import axios from 'axios';
import { auth0Manager } from './auth0';

/**
 * Token Vault - Securely manages OAuth tokens for external APIs
 * In production, this would use Auth0's Token Vault feature
 * For this demo, we'll simulate it with encrypted storage
 */

interface StoredToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scopes: string[];
}

class TokenVault {
  private tokens: Map<string, StoredToken> = new Map();

  /**
   * Store a user's OAuth token securely
   */
  async storeToken(
    userId: string,
    provider: 'spotify' | 'google' | 'other',
    tokenData: {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scopes: string[];
    }
  ): Promise<void> {
    const key = `${userId}:${provider}`;
    
    this.tokens.set(key, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      scopes: tokenData.scopes,
    });

    // In production: Store encrypted in Auth0 user metadata
    await auth0Manager.updateUserMetadata(userId, {
      [`${provider}_connected`]: true,
      [`${provider}_scopes`]: tokenData.scopes,
    });

    console.log(`🔐 Token stored for ${userId} - ${provider}`);
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
