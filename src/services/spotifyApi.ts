// Spotify Web API client
import { getAccessToken } from './auth';

const API_BASE = 'https://api.spotify.com/v1';

async function spotifyFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (response.status === 401) {
    throw new Error('Unauthorized - token may have expired');
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.statusText}`);
  }

  return response.json();
}

// Get current user profile
export async function getCurrentUser() {
  return spotifyFetch('/me');
}

// Get top tracks
export async function getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 50) {
  return spotifyFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
}

// Get top artists
export async function getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit = 50) {
  return spotifyFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
}

// Get currently playing track
export async function getCurrentlyPlaying() {
  return spotifyFetch('/me/player/currently-playing');
}

// Get recently played tracks
export async function getRecentlyPlayed(limit = 50) {
  return spotifyFetch(`/me/player/recently-played?limit=${limit}`);
}

// Get audio features for multiple tracks
export async function getAudioFeatures(trackIds: string[]) {
  const ids = trackIds.slice(0, 100).join(','); // Spotify limits to 100 per request
  return spotifyFetch(`/audio-features?ids=${ids}`);
}

// Get detailed track info
export async function getTrack(trackId: string) {
  return spotifyFetch(`/tracks/${trackId}`);
}

// Get detailed artist info
export async function getArtist(artistId: string) {
  return spotifyFetch(`/artists/${artistId}`);
}

// Get multiple artists
export async function getArtists(artistIds: string[]) {
  const ids = artistIds.slice(0, 50).join(','); // Spotify limits to 50 per request
  return spotifyFetch(`/artists?ids=${ids}`);
}
