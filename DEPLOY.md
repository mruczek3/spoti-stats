# Deploy to a new GitHub repository (fresh start)

Follow these steps to delete the broken setup and publish a working site.

## 1. Delete old GitHub repos (browser)

1. [spotifystats](https://github.com/mruczek3/spotifystats) → **Settings** → scroll down → **Delete this repository**
2. Delete any other copy (`spotify-stats`, etc.) if you still have them.

## 2. Create a new Spotify app (recommended)

Old Client IDs in public repos should be retired.

1. Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. **Create app** → name it e.g. `Spotify Stats`
3. **Settings** → **Redirect URIs** — add **both** (use your real repo name in the URL):

   ```
   https://mruczek3.github.io/YOUR-REPO-NAME/callback.html
   http://127.0.0.1:5500/callback.html
   ```

   Examples if repo is `spotify-stats`:

   ```
   https://mruczek3.github.io/spotify-stats/callback.html
   ```

4. Copy the **Client ID** (you will need it in step 4).

## 3. Create a new GitHub repository

1. [github.com/new](https://github.com/new)
2. Name: e.g. `spotify-stats` (public)
3. Do **not** add README or .gitignore (empty repo)
4. Create repository

## 4. Add your Client ID as a secret

On the **new** repo:

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `SPOTIFY_CLIENT_ID`
4. Value: paste your Client ID from step 2
5. Save

## 5. Enable GitHub Pages (Actions)

1. **Settings** → **Pages**
2. **Build and deployment** → **Source**: **GitHub Actions** (not “Deploy from branch”)
3. Save

## 6. Push this project from your PC

In PowerShell (replace `YOUR-REPO-NAME`):

```powershell
cd "c:\Users\hirob\Documents\ahsah"

git remote remove origin 2>$null
git remote remove spotifystats 2>$null
git remote add origin https://github.com/mruczek3/YOUR-REPO-NAME.git

git add -A
git commit -m "Fresh deploy: GitHub Pages + Spotify config via secret"
git push -u origin main --force
```

## 7. Wait for deploy

1. Open **Actions** tab → wait for green **Deploy to GitHub Pages**
2. Open **Settings** → **Pages** → copy the live URL
3. Visit: `https://mruczek3.github.io/YOUR-REPO-NAME/`

## 8. Local testing

```powershell
copy assets\config.example.js assets\config.js
```

Edit `assets/config.js` and set your Client ID. Serve the folder (Live Server, etc.) and open `index.html`.

---

### Optional: simplest URL (no `/repo-name/` in path)

Create a repo named exactly **`mruczek3.github.io`**.  
Then the site is `https://mruczek3.github.io/` and the redirect URI is:

```
https://mruczek3.github.io/callback.html
```

---

### Troubleshooting

| Problem | Fix |
|--------|-----|
| 404 on site | Pages source must be **GitHub Actions**; check Actions for errors |
| Login says Client ID missing | Add `SPOTIFY_CLIENT_ID` secret; re-run Actions deploy |
| Spotify “redirect URI mismatch” | Redirect URI in dashboard must match `.../callback.html` exactly |
| CSS/JS broken | Hard refresh (Ctrl+F5); open site with trailing slash |
