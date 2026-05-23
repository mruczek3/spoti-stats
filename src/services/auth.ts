// Spotify OAuth Authentication with PKCE flow
// This is the recommended secure way for Single Page Applications

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'user-read-playback-state',
  'user-read-currently-playing'
].join(' ');

// Get local IP address using WebRTC (works in all modern browsers)
async function getLocalIP(): Promise<string> {
  const stored = localStorage.getItem('spotify_local_ip');
  if (stored) return stored;

  try {
    const pc = new (window as any).RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer().then((offer: any) => pc.setLocalDescription(offer));

    return new Promise<string>((resolve) => {
      const timeout = setTimeout(() => {
        pc.close();
        resolve(window.location.hostname);
      }, 2000);

      pc.onicecandidate = (ice: any) => {
        if (!ice || !ice.candidate) return;
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const ipAddress = ipRegex.exec(ice.candidate.candidate)?.[1];
        if (ipAddress && !ipAddress.startsWith('127')) {
          clearTimeout(timeout);
          localStorage.setItem('spotify_local_ip', ipAddress);
          resolve(ipAddress);
          pc.close();
        }
      };
    });
  } catch (error) {
    console.log('Could not detect local IP, using hostname');
    return window.location.hostname;
  }
}

// Build redirect URI with IP address (not localhost)
async function getRedirectUri(): Promise<string> {
  let hostname = window.location.hostname;
  
  // If on localhost, try to detect actual IP
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    hostname = await getLocalIP();
  }

  const port = window.location.port || '5173';
  return `http://${hostname}:${port}/callback`;
}

let REDIRECT_URI: string = `${window.location.origin}/callback`;

// Generate random string for PKCE challenge
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Generate SHA256 hash for PKCE
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function redirectToSpotifyAuth(): Promise<void> {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Get IP-based redirect URI
  REDIRECT_URI = await getRedirectUri();
  console.log('Using redirect URI:', REDIRECT_URI);

  // Store code verifier in sessionStorage for later use
  sessionStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const codeVerifier = sessionStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  // Use the same redirect URI that was sent to Spotify
  const redirectUri = REDIRECT_URI || (await getRedirectUri());

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Token exchange error:', errorData);
    throw new Error(`Failed to exchange code for token: ${errorData.error_description || response.statusText}`);
  }

  const data = await response.json();
  sessionStorage.removeItem('spotify_code_verifier');
  
  // Store token and expiration
  localStorage.setItem('spotify_access_token', data.access_token);
  localStorage.setItem('spotify_token_expires_at', String(Date.now() + data.expires_in * 1000));
  
  return data.access_token;
}

export function getAccessToken(): string | null {
  return localStorage.getItem('spotify_access_token');
}

export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('spotify_token_expires_at');
  if (!expiresAt) return true;
  return Date.now() > parseInt(expiresAt);
}

export function clearAuthToken(): void {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_token_expires_at');
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  return !!token && !isTokenExpired();
}
