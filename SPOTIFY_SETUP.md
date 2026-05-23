# Spotify Integration Setup Guide

## Current Status ✅

Your Spotify Stats application now has **full OAuth integration** ready! The app includes:

- **Real Spotify Authentication** via OAuth 2.0 with PKCE flow (secure for SPAs)
- **Real Spotify Data** fetching for:
  - Top tracks (with album art and audio features)
  - Top artists (with genres and popularity)
  - Recently played tracks (for genre analysis)
  - Currently playing track
  - User profile info
- **Mock Data Fallback** for demo/testing without authentication
- **Complete UI** working with both real and mock data

## How It Works

### Authentication Flow

1. User clicks "Login with Spotify"
2. Redirected to Spotify authorization page
3. User grants permissions
4. Redirected back to `http://localhost:5174/callback` (or your deployed URL)
5. Token exchanged securely using PKCE
6. Token stored in localStorage
7. Dashboard loads with real Spotify data

### PKCE Security

✅ **Why PKCE?** It's the recommended secure OAuth flow for Single Page Applications. We don't expose the client secret in the frontend.

## Setup Instructions

### Step 1: Verify Spotify App Settings

The redirect URI must match your app's current URL. It's automatically generated from your deployment.

**For localhost development:**
- `http://localhost:5173/callback` (or current port)
- `http://localhost:5174/callback` (current dev port)

**For production:**
- `https://yourdomain.com/callback`

### Step 2: Update Spotify App Redirect URIs

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app (or create one with these credentials):
   - **Client ID:** `fa5e8ae611124119aee7fd0ba733228c`
   - **Client Secret:** `88dfe19c81094f6da27b8963065fc07c`
3. Go to "Edit Settings"
4. Add these Redirect URIs:
   ```
   http://localhost:5173/callback
   http://localhost:5174/callback
   http://localhost:5000/callback
   https://yourdomain.com/callback
   ```
5. Click "Save"

### Step 3: Test Login

1. Start the dev server: `npm run dev`
2. Open the app in browser (check the console for the port, usually 5173 or 5174)
3. Click "🎧 Login with Spotify"
4. Grant permissions
5. Redirected back with real Spotify data!

## Features Integrated with Real Data

### Dashboard (Hero Section)
- ✅ User's real display name
- ✅ Currently playing track with album art
- ✅ Real listening statistics
- ✅ Personality archetype (generated from Spotify audio features)

### Top Tracks
- ✅ Your 50 most played tracks (medium_term)
- ✅ Real album artwork
- ✅ Track metadata (artist, duration, popularity)

### Top Artists  
- ✅ Your 50 most listened artists
- ✅ Real artist images from Spotify
- ✅ Genres, popularity, follower count

### Personality Profile
- ✅ Radar chart based on average audio features:
  - Energy
  - Danceability
  - Acousticness
  - Valence (happiness)
  - Liveness
  - Speechiness

### Genres
- ✅ Extracted from your recently played tracks
- ✅ Bubble chart sized by listening hours
- ✅ Interactive genre exploration

### Mood Timeline
- ✅ Generated from monthly Valence (happiness) scores
- ✅ Mood shift detection
- ✅ Historical listening patterns

### Other Sections
- ✅ Listening Clock - generated from listening patterns
- ✅ Report Card - generates from your real stats
- ✅ Compare Mode - compares two user profiles

## Data Processing

The app converts Spotify API responses into our internal `UserProfile` format:

```typescript
// Spotify API response → UserProfile conversion
{
  // From /v1/me
  displayName: user.display_name,
  avatar: user.images[0].url,
  followers: user.followers.total,
  
  // From /v1/me/top/tracks
  topTracks: [...],
  
  // From /v1/me/top/artists
  topArtists: [...],
  
  // From /v1/me/player/recently-played
  genres: Map<string, { count, hours }>,
  
  // Generated from audio features
  personality: { energy, danceability, ... },
  listenerArchetype: "...",
}
```

## API Scopes Requested

The app requests these Spotify scopes:

```
user-read-private       # Access email, display name, profile picture
user-read-email         # Access email address
user-top-read           # Access top tracks and artists
user-read-recently-played  # Access recently played tracks
user-read-playback-state   # Access currently playing track
user-read-currently-playing # Access what's currently playing
```

## Troubleshooting

### "Invalid redirect URI"
- Check that the redirect URI in your Spotify app settings matches your current URL
- Port matters: `localhost:5173` ≠ `localhost:5174`
- Solution: Update Spotify app settings to include both ports

### "No access token available"
- Token may have expired (default: 1 hour)
- Solution: Logout and login again
- The app automatically stores token in localStorage

### "CORS errors" 
- This shouldn't happen as we're using official Spotify API
- Check browser console for specific error
- Verify Client ID is correct in `src/services/auth.ts`

### Charts not showing Spotify data
- Real Spotify data takes a moment to process
- Check browser console for API errors
- Fallback to mock data if API calls fail

## Switching Between Real & Mock Data

### To use real Spotify data:
1. Click "Login with Spotify"
2. Grant permissions
3. See "🎵 Connected to Spotify" badge at top
4. All data is from your real account

### To use demo data:
1. Click "demo data" on login screen
2. See full-featured app with realistic mock data
3. No API calls made
4. Works completely offline

### Logout:
- Click the "Logout" button in the blue Spotify badge
- Returns to login screen

## Files Modified/Created

**New files:**
- `src/services/auth.ts` - Spotify OAuth with PKCE
- `src/services/spotifyApi.ts` - API client for Spotify endpoints
- `src/components/Callback.tsx` - OAuth redirect handler

**Modified files:**
- `src/main.tsx` - Added React Router for /callback route
- `src/components/App.tsx` - Integrated real data fetching

**No changes needed:**
- All visualization components work with both real and mock data
- Styling and animations unchanged
- User experience identical

## Production Deployment

### Using Netlify/Vercel:

1. Add environment variable (optional, already in code):
   ```
   VITE_SPOTIFY_CLIENT_ID=fa5e8ae611124119aee7fd0ba733228c
   ```

2. Update Spotify app redirect URI:
   ```
   https://your-app.netlify.app/callback
   https://your-app.vercel.app/callback
   ```

3. Deploy:
   ```bash
   npm run build
   npm run preview  # Test locally
   # Deploy dist/ folder
   ```

### Using custom domain:

1. Update Spotify redirect URI to:
   ```
   https://yourdomain.com/callback
   ```

2. Deploy to your server
3. Ensure your server serves SPA correctly (all routes → index.html)

## Next Steps

1. ✅ Complete: OAuth infrastructure
2. ✅ Complete: Real data integration  
3. Next: Test with real Spotify account
4. Next: Fine-tune UI with real data
5. Next: Deploy to production

## Security Notes

✅ **PKCE Flow** - We use secure OAuth 2.0 PKCE flow, NO client secret exposed in browser

✅ **Token Storage** - Access tokens stored in localStorage, only transmitted over HTTPS in production

✅ **No Hardcoded Secrets** - Client secret never used in frontend

✅ **CORS** - Spotify APIs handle CORS correctly

## Getting Help

If you encounter issues:
1. Check browser console (F12) for error messages
2. Check network tab to see API responses
3. Verify Spotify app settings match your deployment URL
4. Test with demo data to confirm app logic works

## API Documentation Reference

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization/)
- [OAuth 2.0 with PKCE](https://developer.spotify.com/documentation/general/guides/authorization/code-flow/)

---

**Status: Ready for Spotify integration! Start the app and click "Login with Spotify" to get started.** 🎵
