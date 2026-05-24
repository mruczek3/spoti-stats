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
const NICKNAME_PREFIX = "spotify_nickname_";

// ── Redirect URI ──────────────────────────────────────────────────────────────
// Derives the redirect URI from the current page location so it works on:
//   • localhost dev server  (http://localhost:5173/callback.html)
//   • GitHub Pages sub-path (https://mruczek3.github.io/spoti-stats/callback.html)
//   • any other deployment  (https://example.com/callback.html)
function getRedirectUri(): string {
  const loc = window.location;

  // Trim the filename from the path so we always get the directory
  // e.g. "/spoti-stats/"  → "/spoti-stats"
  //      "/spoti-stats/index.html" → "/spoti-stats"
  //      "/"              → ""
  const pathDir = loc.pathname.replace(/\/[^/]*$/, "") || "";

  return `${loc.protocol}//${loc.host}${pathDir}/callback.html`;
}

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
  const redirectUri = getRedirectUri();

  sessionStorage.setItem("spotify_code_verifier", codeVerifier);
  // Also store the redirect URI so exchangeCodeForToken can use the exact same value
  sessionStorage.setItem("spotify_redirect_uri", redirectUri);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
  if (!codeVerifier) throw new Error("Code verifier not found");

  // Use the exact redirect URI that was sent to Spotify
  const redirectUri =
    sessionStorage.getItem("spotify_redirect_uri") || getRedirectUri();

  sessionStorage.removeItem("spotify_redirect_uri");

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
    const err = await res.json().catch(() => ({}));
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
  if (refreshToken) localStorage.setItem(KEY_REFRESH_TOKEN, refreshToken);
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
      clearAuthToken();
      return null;
    }

    const data = await res.json();
    _storeTokens(data.access_token, data.refresh_token, data.expires_in);
    return data.access_token;
  } catch {
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
  return Date.now() > parseInt(expiresAt) - 60_000;
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  if (!isTokenExpired()) return true;
  return !!localStorage.getItem(KEY_REFRESH_TOKEN);
}

export function hasValidToken(): boolean {
  return !!getAccessToken() && !isTokenExpired();
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
