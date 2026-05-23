/**
 * Network utility functions for Spotify OAuth setup
 * Helps users set up the correct redirect URI for their local network
 */

export interface NetworkInfo {
  localIp: string | null;
  hostname: string;
  port: string;
  redirectUri: string;
  isLocalhost: boolean;
}

/**
 * Get current network information for the application
 */
export function getNetworkInfo(): NetworkInfo {
  const hostname = window.location.hostname;
  const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  const origin = window.location.origin;
  const redirectUri = `${origin}/callback`;
  
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  return {
    localIp: !isLocalhost ? hostname : null,
    hostname,
    port,
    redirectUri,
    isLocalhost,
  };
}

/**
 * Get all possible redirect URIs for Spotify Developer Dashboard registration
 * Returns multiple options for different development scenarios
 */
export function getRecommendedRedirectUris(): string[] {
  const networkInfo = getNetworkInfo();
  const uris = new Set<string>();

  // Add current redirect URI
  uris.add(networkInfo.redirectUri);

  // Add localhost alternatives for development
  uris.add(`http://localhost:5173/callback`);
  uris.add(`http://localhost:5174/callback`);
  uris.add(`http://localhost:3000/callback`);
  uris.add(`http://127.0.0.1:5173/callback`);
  uris.add(`http://127.0.0.1:5174/callback`);

  // If using a specific IP, add that too
  if (networkInfo.localIp && !networkInfo.isLocalhost) {
    const port = networkInfo.port;
    uris.add(`http://${networkInfo.localIp}:${port}/callback`);
    
    // Add common dev ports
    [5173, 5174, 3000, 8000, 8080, 8888].forEach(p => {
      uris.add(`http://${networkInfo.localIp}:${p}/callback`);
    });
  }

  return Array.from(uris);
}

/**
 * Get instructions for setting up Spotify OAuth with the current network configuration
 */
export function getSetupInstructions(): string {
  const networkInfo = getNetworkInfo();
  const currentUri = networkInfo.redirectUri;

  return `
SPOTIFY OAUTH SETUP INSTRUCTIONS
==================================

Current Environment:
- Access URL: ${currentUri.replace('/callback', '')}
- Redirect URI: ${currentUri}
- Hostname: ${networkInfo.hostname}
- Port: ${networkInfo.port}

Steps to Set Up:

1. Go to Spotify Developer Dashboard:
   https://developer.spotify.com/dashboard

2. Select your application (or create one if you haven't)
   - Client ID: (set in assets/config.js or VITE_SPOTIFY_CLIENT_ID)
   - Your application should be registered

3. Click "Edit Settings"

4. Scroll to "Redirect URIs"

5. Add these URIs based on how you're running the app:

   MINIMUM (Required):
   ${currentUri}

   RECOMMENDED (Add all for flexibility):
${getRecommendedRedirectUris().map(uri => `   ${uri}`).join('\n')}

6. Click "Save"

7. Now you can login with Spotify!

NOTES:
- If you change the port, you need to add the new URI to Spotify settings
- The redirect URI must match EXACTLY (including protocol and port)
- If testing on localhost: http://localhost:PORT/callback
- If testing on local network: http://YOUR.LOCAL.IP:PORT/callback
`;
}

/**
 * Copy setup instructions to clipboard
 */
export async function copySetupInstructions(): Promise<boolean> {
  try {
    const instructions = getSetupInstructions();
    await navigator.clipboard.writeText(instructions);
    return true;
  } catch (error) {
    console.error('Failed to copy instructions:', error);
    return false;
  }
}

/**
 * Display network info in console for debugging
 */
export function logNetworkInfo(): void {
  const info = getNetworkInfo();
  const uris = getRecommendedRedirectUris();

  console.log('%c🌐 SPOTIFY OAUTH SETUP', 'font-size: 16px; color: #1db954; font-weight: bold;');
  console.log('Current Access URL:', info.redirectUri.replace('/callback', ''));
  console.log('Redirect URI:', info.redirectUri);
  console.log('All Recommended URIs:');
  uris.forEach(uri => console.log(`  - ${uri}`));
}
