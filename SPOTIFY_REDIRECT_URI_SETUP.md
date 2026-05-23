# 🎵 SPOTIFY DEVELOPER DASHBOARD - REDIRECT URI SETUP

## 📍 Where Your Redirect URI Goes

**Your GitHub Pages redirect URI:**
```
https://YOUR_USERNAME.github.io/spotify-stats/callback.html
```

Replace `YOUR_USERNAME` with your actual GitHub username!

---

## 📌 Example

If your GitHub username is `hirob`:
```
https://hirob.github.io/spotify-stats/callback.html
```

---

## ✅ Setup Steps in Spotify Developer Dashboard

### Step 1: Go to Spotify Dashboard
https://developer.spotify.com/dashboard

### Step 2: Select Your App
- Click on your app (you should have created one)
- If not created, go to https://developer.spotify.com/dashboard/create and create it

### Step 3: Find Edit Settings
- Click the **Edit Settings** button in your app details

### Step 4: Locate Redirect URIs Section
Look for the section labeled:
```
Redirect URIs
```

### Step 5: Add Your GitHub Pages URI
In the text field, paste:
```
https://YOUR_USERNAME.github.io/spotify-stats/callback.html
```

Examples:
- If username is `sarah`: `https://sarah.github.io/spotify-stats/callback.html`
- If username is `john123`: `https://john123.github.io/spotify-stats/callback.html`

### Step 6: Click Add
- After pasting, click the **Add** button
- It should appear in the list below

### Step 7: Save Settings
- Scroll down and click **Save**
- You should see a success message: "Your settings have been saved!"

### Step 8: Verify
Look for your URI in the Redirect URIs list:
```
✓ https://YOUR_USERNAME.github.io/spotify-stats/callback.html
```

---

## 🔑 Key Points

✅ **Exact match required:** Must match EXACTLY (including `/callback.html`)  
✅ **HTTPS only:** GitHub Pages always uses HTTPS  
✅ **No http://:** Must use `https://`  
✅ **Case sensitive:** GitHub usernames are lowercase  
✅ **Port number:** No port in GitHub Pages URLs  

---

## ❌ Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `http://...` | `https://...` |
| `...spotify.github.io/...` | `...github.io/spotify-stats/...` |
| `...callback.html/` (trailing slash) | `...callback.html` (no slash) |
| `...CALLBACK.HTML` (uppercase) | `...callback.html` (lowercase) |
| `...callback` (without .html) | `...callback.html` |

---

## 🧪 Testing Your Setup

### Test 1: Visit Dashboard
1. Go to: `https://YOUR_USERNAME.github.io/spotify-stats/`
2. Should load the login page ✓

### Test 2: Click Demo
1. Click "👀 View Demo" button
2. All tabs should load with mock data ✓

### Test 3: Try Spotify Login
1. Click "🎧 Connect with Spotify"
2. You should be redirected to Spotify login
3. If you get "Redirect URI mismatch" error:
   - Double-check your URI in Spotify Dashboard
   - Make sure it matches EXACTLY
   - Wait 5 minutes and try again (caching)

### Test 4: Complete Auth Flow
1. Log in to Spotify (if prompted)
2. Grant permissions (check all checkboxes)
3. Should redirect back to dashboard with your real data ✓

---

## 📱 Scopes (Auto-Enabled)

Your app requests these scopes:
- ✅ `user-read-private` - See your profile info
- ✅ `user-read-email` - See your email
- ✅ `user-top-read` - See your top tracks/artists
- ✅ `user-read-recently-played` - See recently played
- ✅ `user-read-playback-state` - See what's playing
- ✅ `user-read-currently-playing` - See current track

These should be auto-enabled in your app. No additional setup needed!

---

## 🆘 Troubleshooting Redirect URI Issues

### "Invalid redirect_uri" Error
**Solution:** Make sure your URI:
1. Uses HTTPS (not HTTP)
2. Ends with `/callback.html`
3. Has no trailing slash
4. Matches exactly what's in Spotify Dashboard

### "Redirect URI mismatch" Error
**Solution:**
1. Copy your exact live URL from browser
2. Add `/callback.html` at the end
3. Register that exact value in Spotify Dashboard
4. Wait 5 minutes for caching to clear
5. Try login again

### "Page not found" After Spotify Redirect
**Solution:**
1. Make sure GitHub Pages is enabled
2. Wait 2-3 minutes for deployment
3. Hard refresh: Ctrl+Shift+R
4. Check that `callback.html` file exists in repo

---

## ✅ Verification Checklist

- [ ] Spotify Developer Dashboard app created
- [ ] Edit Settings button accessible
- [ ] Your GitHub Pages redirect URI is visible in Spotify Dashboard:
      `https://YOUR_USERNAME.github.io/spotify-stats/callback.html`
- [ ] Settings have been saved
- [ ] Demo works at your GitHub Pages URL
- [ ] Spotify login redirects correctly

---

## 🎯 Reference

- **Spotify Developer Dashboard:** https://developer.spotify.com/dashboard
- **Spotify OAuth Docs:** https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- **GitHub Pages URL Pattern:** `https://USERNAME.github.io/REPO_NAME/`

---

## 📝 Your Setup Summary

| Item | Value |
|------|-------|
| GitHub Username | __________ |
| GitHub Pages URL | `https://__________. github.io/spotify-stats/` |
| Redirect URI | `https://__________.github.io/spotify-stats/callback.html` |
| Spotify Client ID | `fa5e8ae611124119aee7fd0ba733228c` |

Fill in your GitHub username and copy the values to Spotify Dashboard!

---

## 🎊 Ready to Go!

Once the redirect URI is registered in Spotify Developer Dashboard, your OAuth flow will work perfectly!

**Users can:**
1. Click "🎧 Connect with Spotify"
2. Log in to their Spotify account
3. Grant permissions
4. See their real listening stats!

---

**Questions?** Check the browser console (F12) for error messages that will guide you to the solution.
