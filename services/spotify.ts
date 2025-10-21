import axios from 'axios';

export interface SpotifyPlaylist {
  id: string;
  name: string;
  url: string;
  trackCount: number;
  imageUrl?: string;
}

class SpotifyService {
  private baseUrl = 'https://api.spotify.com/v1';

  async getUserPlaylists(accessToken: string): Promise<SpotifyPlaylist[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/me/playlists`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 10 },
      });

      return response.data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.external_urls.spotify,
        trackCount: item.tracks.total,
        imageUrl: item.images[0]?.url,
      }));
    } catch (error) {
      console.error('Spotify API error:', error);
      return [];
    }
  }

  async getTopTracks(accessToken: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/me/top/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, time_range: 'short_term' },
      });
      return response.data.items;
    } catch (error) {
      console.error('Spotify API error:', error);
      return [];
    }
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
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
      return response.data;
    } catch (error) {
      console.error('Spotify token exchange error:', error);
      throw error;
    }
  }
}

export const spotifyService = new SpotifyService();
