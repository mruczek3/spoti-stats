# 🔧 Fix Spotify Login - Redirect URI Error

## ❌ Problem
Spotify error: **"redirect_uri: Not matching configuration"**

This means the redirect URI in the app doesn't match what's registered in your Spotify Developer Dashboard.

## ✅ Solution (4 Steps)

### Step 1: Open Spotify Developer Dashboard
Go to: https://developer.spotify.com/dashboard

### Step 2: Find Your App
- Log in if needed
- Click on your app

### Step 3: Edit Settings
- Click **Edit Settings** button
- Look for **Redirect URIs** section

### Step 4: Add This URI
Copy and paste this **EXACTLY**:
```
http://localhost:5173/callback
```

Then click **Add**

### Step 5: Save
- Scroll down and click **Save**
- You should see: "Your settings have been saved!"

---

## 🔄 Try Login Again

1. Go back to http://localhost:5173
2. Click "🎧 Login with Spotify"
3. It should work now! ✅

---

## 📍 What Each Part Means

| Part | Meaning |
|------|---------|
| `http://` | Not HTTPS (for local dev only) |
| `localhost:5173` | Your development server address |
| `/callback` | The page Spotify redirects you back to |

---

## ❓ Still Not Working?

### Double-check:
1. ✅ Did you add the URI with `/callback`?
2. ✅ Did you click Save?
3. ✅ Is the dev server running on port 5173? (Check terminal)
4. ✅ Are you accessing from `http://localhost:5173` (not `http://127.0.0.1:5173`)?

### Try These:

If using `127.0.0.1` or another port, also add:
- `http://127.0.0.1:5173/callback`
- `http://localhost:5174/callback` (if running on 5174)

Just click "Add" for each and hit Save.

---

## 🎯 Success Indicators

After adding the URI:
- ✅ Spotify page opens
- ✅ You see your app name asking for permissions
- ✅ You can grant access
- ✅ You're redirected back to the dashboard with real data!

---

**Let me know once you add it and it should work! 🎵**
