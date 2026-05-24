// Spotify OAuth Authentication with PKCE flow + refresh token support

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-read-recently-played",
  "user-read-playback-state",
  "user-read-currently-playing",
].join(" ");

// ── Storage Keys ──────────────────────────────────────────────────────────────
const KEY_ACCESS_TOKEN = "spotify_access_token";
const KEY_REFRESH_TOKEN = "spotify_refresh_token";
const KEY_EXPIRES_AT = "spotify_token_expires_at";
const KEY_LOCAL_IP = "spotify_local_ip";
const NICKNAME_PREFIX = "spotify_nickname_";

// ── IP / Redirect URI ─────────────────────────────────────────────────────────
async function getLocalIP(): Promise<string> {
  const stored = localStorage.getItem(KEY_LOCAL_IP);
  if (stored) return stored;

  try {
    const pc = new (window as any).RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");
    pc.createOffer().then((offer: any) => pc.setLocalDescription(offer));

    return new Promise<string>((resolve) => {
      const timeout = setTimeout(() => {
        pc.close();
        resolve(window.location.hostname);
      }, 2000);
      pc.onicecandidate = (ice: any) => {
        if (!ice?.candidate) return;
        const ip = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(
          ice.candidate.candidate,
        )?.[1];
        if (ip && !ip.startsWith("127")) {
          clearTimeout(timeout);
          localStorage.setItem(KEY_LOCAL_IP, ip);
          resolve(ip);
          pc.close();
        }
      };
    });
  } catch {
    return window.location.hostname;
  }
}

async function getRedirectUri(): Promise<string> {
  let hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    hostname = await getLocalIP();
  }
  const port = window.location.port || "5173";
  return `http://${hostname}:${port}/callback`;
}

let REDIRECT_URI: string = `${window.location.origin}/callback`;

// ── PKCE helpers ──────────────────────────────────────────────────────────────
function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ── Auth Flow ─────────────────────────────────────────────────────────────────
export async function redirectToSpotifyAuth(): Promise<void> {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  REDIRECT_URI = await getRedirectUri();
  sessionStorage.setItem("spotify_code_verifier", codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
  if (!codeVerifier) throw new Error("Code verifier not found");

  const redirectUri = REDIRECT_URI || (await getRedirectUri());

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      `Token exchange failed: ${err.error_description || res.statusText}`,
    );
  }

  const data = await res.json();
  sessionStorage.removeItem("spotify_code_verifier");

  _storeTokens(data.access_token, data.refresh_token, data.expires_in);
  return data.access_token;
}

function _storeTokens(
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number,
) {
  localStorage.setItem(KEY_ACCESS_TOKEN, accessToken);
  localStorage.setItem(KEY_EXPIRES_AT, String(Date.now() + expiresIn * 1000));
  if (refreshToken) {
    localStorage.setItem(KEY_REFRESH_TOKEN, refreshToken);
  }
}

// ── Refresh Token ─────────────────────────────────────────────────────────────
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(KEY_REFRESH_TOKEN);
  if (!refreshToken) return null;

  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    });

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!res.ok) {
      console.warn("Refresh token failed, clearing auth");
      clearAuthToken();
      return null;
    }

    const data = await res.json();
    _storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return data.access_token;
  } catch (err) {
    console.error("Error refreshing token:", err);
    return null;
  }
}

// ── Token Getters ─────────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  return localStorage.getItem(KEY_ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEY_REFRESH_TOKEN);
}

export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem(KEY_EXPIRES_AT);
  if (!expiresAt) return true;
  // Consider expired 60s early to avoid edge cases
  return Date.now() > parseInt(expiresAt) - 60_000;
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  if (!isTokenExpired()) return true;
  // Token expired but refresh token available — caller should try refresh
  return !!localStorage.getItem(KEY_REFRESH_TOKEN);
}

export function hasValidToken(): boolean {
  const token = getAccessToken();
  return !!token && !isTokenExpired();
}

// ── Logout ────────────────────────────────────────────────────────────────────
export function clearAuthToken(): void {
  localStorage.removeItem(KEY_ACCESS_TOKEN);
  localStorage.removeItem(KEY_REFRESH_TOKEN);
  localStorage.removeItem(KEY_EXPIRES_AT);
}

// ── Nickname Store ────────────────────────────────────────────────────────────
export function getNickname(spotifyUserId: string): string | null {
  if (!spotifyUserId) return null;
  return localStorage.getItem(NICKNAME_PREFIX + spotifyUserId);
}

export function setNickname(spotifyUserId: string, nickname: string): void {
  if (!spotifyUserId) return;
  localStorage.setItem(NICKNAME_PREFIX + spotifyUserId, nickname);
}

export function clearNickname(spotifyUserId: string): void {
  localStorage.removeItem(NICKNAME_PREFIX + spotifyUserId);
}
