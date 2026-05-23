// ===== SPOTIFY OAUTH PKCE FLOW =====
function getClientId() {
    const id = window.SPOTIFY_CLIENT_ID || '';
    if (!id || id === 'YOUR_SPOTIFY_CLIENT_ID_HERE') return null;
    return id;
}

function getAppBasePath() {
    const { hostname, pathname } = window.location;
    if (hostname.endsWith('.github.io')) {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length && !parts[0].includes('.')) return '/' + parts[0];
        return '';
    }
    return pathname.replace(/\/[^/]*$/, '') || '';
}

const REDIRECT_URI = `${window.location.origin}${getAppBasePath()}/callback.html`;
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-read-playback-state',
    'user-read-currently-playing'
].join(' ');

let moodChartInstance = null;
let radarChartInstance = null;
let currentTimeRange = 'medium_term';

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function initiateSpotifyLogin() {
    const CLIENT_ID = getClientId();
    if (!CLIENT_ID) {
        alert('Spotify Client ID is not configured. Add assets/config.js locally, or set the SPOTIFY_CLIENT_ID secret in GitHub for Pages deploy.');
        return;
    }
    try {
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        localStorage.setItem('spotify_code_verifier', codeVerifier);
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            response_type: 'code',
            redirect_uri: REDIRECT_URI,
            scope: SCOPES,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge
        });
        window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    } catch (error) {
        console.error('Error initiating login:', error);
        alert('Error initiating login. Please try again.');
    }
}

async function handleSpotifyCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const statusEl = document.getElementById('status');
    const errorEl = document.getElementById('error');

    if (error) {
        errorEl.textContent = `Auth error: ${error}`;
        errorEl.style.display = 'block';
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        return;
    }
    if (!code) {
        errorEl.textContent = 'No authorization code received';
        errorEl.style.display = 'block';
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        return;
    }

    const CLIENT_ID = getClientId();
    if (!CLIENT_ID) {
        errorEl.textContent = 'Spotify Client ID is not configured.';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        if (!codeVerifier) throw new Error('Code verifier not found');
        statusEl.textContent = 'Exchanging code for token...';
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                code_verifier: codeVerifier
            }).toString()
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error_description || 'Token exchange failed');
        }
        const data = await response.json();
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_expires_at', String(Date.now() + data.expires_in * 1000));
        localStorage.removeItem('spotify_code_verifier');
        statusEl.textContent = 'Success! Redirecting...';
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } catch (err) {
        console.error('Token exchange error:', err);
        errorEl.textContent = `Token exchange failed: ${err.message}`;
        errorEl.style.display = 'block';
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
    }
}

// ===== API =====
async function callSpotifyAPI(endpoint) {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) throw new Error('No access token');
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('spotify_access_token');
            window.location.href = 'index.html';
            throw new Error('Token expired');
        }
        if (response.status === 204) return null;
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
}

async function fetchAudioFeatures(trackIds) {
    if (!trackIds.length) return [];
    const ids = trackIds.slice(0, 50).join(',');
    const res = await callSpotifyAPI(`/audio-features?ids=${ids}`);
    return res.audio_features.filter(Boolean);
}

function deriveFeaturesFromAudio(audioFeatures) {
    if (!audioFeatures.length) {
        return { energy: 50, danceability: 50, acousticness: 30, valence: 50, liveness: 20, speechiness: 10 };
    }
    const avg = (key) => {
        const sum = audioFeatures.reduce((s, f) => s + (f[key] || 0), 0);
        return Math.round((sum / audioFeatures.length) * 100);
    };
    return {
        energy: avg('energy'),
        danceability: avg('danceability'),
        acousticness: avg('acousticness'),
        valence: avg('valence'),
        liveness: avg('liveness'),
        speechiness: avg('speechiness')
    };
}

function deriveListeningHeatmap(recentItems) {
    const heatmap = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    (recentItems || []).forEach((item) => {
        if (!item.played_at) return;
        const hour = new Date(item.played_at).getHours();
        heatmap[hour].count += 1;
    });
    return heatmap;
}

function deriveWeeklyHeatmap(recentItems) {
    const cells = [];
    const now = new Date();
    for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 7; day++) {
            cells.push({ week, day, value: 0 });
        }
    }
    (recentItems || []).forEach((item) => {
        if (!item.played_at) return;
        const played = new Date(item.played_at);
        const daysAgo = Math.floor((now - played) / (1000 * 60 * 60 * 24));
        if (daysAgo < 0 || daysAgo >= 84) return;
        const week = Math.floor(daysAgo / 7);
        const day = played.getDay();
        const idx = week * 7 + day;
        if (idx < cells.length) cells[idx].value += 1;
    });
    return cells;
}

function deriveMoodTimeline(recentItems, audioFeatures, tracks) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const byMonth = {};
    const featureMap = {};
    (audioFeatures || []).forEach((f) => { if (f) featureMap[f.id] = f; });

    (recentItems || []).forEach((item) => {
        if (!item.played_at || !item.track) return;
        const d = new Date(item.played_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const label = monthNames[d.getMonth()];
        if (!byMonth[key]) byMonth[key] = { month: label, valences: [] };
        const feat = featureMap[item.track.id];
        if (feat) byMonth[key].valences.push(feat.valence * 100);
    });

    let entries = Object.values(byMonth)
        .map((m) => ({
            month: m.month,
            valence: m.valences.length
                ? Math.round(m.valences.reduce((a, b) => a + b, 0) / m.valences.length)
                : 50
        }))
        .slice(-12);

    if (entries.length < 3 && tracks.length) {
        entries = tracks.slice(0, 12).map((t, i) => ({
            month: `#${i + 1}`,
            valence: t.popularity || 50
        }));
    }
    return entries.length ? entries : monthNames.slice(0, 6).map((month) => ({ month, valence: 50 }));
}

function deriveGenresFromArtists(artists) {
    const genreScores = {};
    artists.forEach((artist, i) => {
        const weight = artists.length - i;
        (artist.genres || []).forEach((genre) => {
            const name = genre.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            if (!genreScores[name]) genreScores[name] = { name, hours: 0, tracks: 0 };
            genreScores[name].hours += weight * 2;
            genreScores[name].tracks += weight;
        });
    });
    return Object.values(genreScores).sort((a, b) => b.hours - a.hours);
}

function deriveArchetype(features) {
    const { energy, valence, danceability, acousticness } = features;
    if (energy > 70 && danceability > 65) return { name: 'The Party Animal', emoji: '🎉', desc: 'High-energy tracks dominate your rotation.' };
    if (valence > 65 && acousticness < 40) return { name: 'The Optimist', emoji: '☀️', desc: 'Upbeat, feel-good music is your go-to.' };
    if (acousticness > 55) return { name: 'The Dreamer', emoji: '🌙', desc: 'You lean toward softer, acoustic sounds.' };
    if (energy < 45 && valence < 45) return { name: 'The Nocturnal Listener', emoji: '🦉', desc: 'Mellow and introspective vibes define your taste.' };
    if (danceability > 60) return { name: 'The Groove Seeker', emoji: '💃', desc: 'Rhythm and danceability drive your picks.' };
    return { name: 'The Explorer', emoji: '🧭', desc: 'Eclectic taste across moods and genres.' };
}

function formatDuration(ms) {
    const min = Math.floor((ms || 0) / 60000);
    const sec = Math.floor(((ms || 0) % 60000) / 1000);
    return `${min}:${String(sec).padStart(2, '0')}`;
}

const TOP_LIST_LIMIT = 10;

function estimatedTrackPlays(rank) {
    const r = Math.min(Math.max(rank, 1), 10);
    if (r <= 1) return 80;
    if (r >= 10) return 20;
    return Math.round(80 - ((r - 1) * (80 - 20)) / 9);
}

function estimatedTrackMinutes(track, rank) {
    const durationMin = (track.duration_ms || 0) / 60000;
    return Math.round(durationMin * estimatedTrackPlays(rank));
}

function estimatedArtistHours(rank) {
    const r = Math.min(Math.max(rank, 1), 10);
    const hours = 40 * Math.pow(8 / 40, (r - 1) / 9);
    return Math.round(hours * 10) / 10;
}

function formatFollowers(count) {
    const n = count || 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M followers`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K followers`;
    return `${n.toLocaleString()} followers`;
}

function formatListenHours(h) {
    const rounded = Math.round(h * 10) / 10;
    const label = rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(1);
    return `~${label}h listened`;
}

function timeRangeLabel(range) {
    const labels = { short_term: 'last 4 weeks', medium_term: 'last 6 months', long_term: 'all time' };
    return labels[range] || range;
}

function todayLabel() {
    return new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function animateListeningBars(container) {
    if (!container) return;
    container.querySelectorAll('.listening-bar').forEach((bar, i) => {
        bar.style.width = '0';
        setTimeout(() => { bar.style.width = bar.dataset.width; }, 150 + i * 60);
    });
}

function revealListItems(container) {
    if (!container) return;
    container.querySelectorAll('.stagger-item').forEach((el, i) => {
        el.style.animationDelay = `${i * 60}ms`;
        el.classList.remove('stagger-hidden');
        el.classList.add('stagger-visible');
    });
    animateListeningBars(container);
}

function getPositionChange(trackId, newRank, timeRange) {
    const key = `spotify_track_ranks_${timeRange}`;
    const prev = JSON.parse(localStorage.getItem(key) || '{}');
    const prevRank = prev[trackId];
    if (prevRank === undefined) return { type: 'new', label: 'NEW', className: 'change-new' };
    const diff = prevRank - newRank;
    if (diff > 0) return { type: 'up', label: `↑${diff}`, className: 'change-up' };
    if (diff < 0) return { type: 'down', label: `↓${Math.abs(diff)}`, className: 'change-down' };
    return { type: 'same', label: '—', className: 'change-same' };
}

function saveTrackRanks(tracks, timeRange) {
    const ranks = {};
    tracks.forEach((t, i) => { ranks[t.id] = i + 1; });
    localStorage.setItem(`spotify_track_ranks_${timeRange}`, JSON.stringify(ranks));
}

// ===== ANIMATIONS =====
function animateCounter(element, target, duration = 1200) {
    const num = typeof target === 'number' ? target : parseInt(String(target).replace(/[^\d]/g, ''), 10) || 0;
    const suffix = String(target).replace(/[\d,]/g, '');
    const start = performance.now();
    function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(num * eased);
        element.textContent = value.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function staggerSection(sectionEl) {
    if (!sectionEl) return;
    if (sectionEl.id === 'tracks') {
        revealListItems(document.getElementById('tracksGrid'));
        return;
    }
    if (sectionEl.id === 'artists') {
        revealListItems(document.getElementById('artistsGrid'));
        return;
    }
    const items = sectionEl.querySelectorAll('.stagger-item');
    items.forEach((el, i) => {
        el.style.animationDelay = `${i * 60}ms`;
        el.classList.remove('stagger-visible');
        void el.offsetWidth;
        el.classList.add('stagger-visible');
    });
}

function showTracksSkeleton() {
    document.getElementById('tracksGrid').innerHTML = Array(TOP_LIST_LIMIT).fill(0).map(() => `
        <div class="media-row skeleton-row">
            <div class="skeleton skeleton-rank"></div>
            <div class="skeleton skeleton-art"></div>
            <div class="skeleton skeleton-info"></div>
        </div>
    `).join('');
}

function showArtistsSkeleton() {
    document.getElementById('artistsGrid').innerHTML = Array(TOP_LIST_LIMIT).fill(0).map(() => `
        <div class="media-row skeleton-row">
            <div class="skeleton skeleton-rank"></div>
            <div class="skeleton skeleton-avatar"></div>
            <div class="skeleton skeleton-info"></div>
        </div>
    `).join('');
}

function renderTracksSummary(tracks) {
    const el = document.getElementById('tracksSummary');
    if (!el) return;
    const count = Math.min(tracks.length, TOP_LIST_LIMIT);
    el.textContent = count
        ? `Your top ${count} tracks · Updated ${todayLabel()} · Based on your listening history (${timeRangeLabel(currentTimeRange)})`
        : '';
}

function renderArtistsSummary(artists) {
    const el = document.getElementById('artistsSummary');
    if (!el) return;
    const top = artists.slice(0, TOP_LIST_LIMIT);
    if (!top.length) {
        el.textContent = '';
        return;
    }
    const totalHours = top.reduce((sum, _, i) => sum + estimatedArtistHours(i + 1), 0);
    const genreSet = new Set();
    top.forEach((a) => (a.genres || []).slice(0, 3).forEach((g) => genreSet.add(g)));
    const hoursLabel = Math.round(totalHours);
    el.textContent = `Your top ${top.length} artists · ~${hoursLabel} total hours · ${genreSet.size} genres explored (${timeRangeLabel(currentTimeRange)})`;
}

function emptyStateHtml(icon, title, message) {
    return `
        <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <p class="empty-title">${escapeHtml(title)}</p>
            <p class="empty-message">${escapeHtml(message)}</p>
        </div>
    `;
}

// ===== SKELETONS =====
function showSkeletons() {
    document.getElementById('userName').textContent = 'Loading...';
    document.getElementById('topStats').innerHTML = Array(4).fill(0).map(() => `
        <div class="stat-item">
            <div class="skeleton skeleton-label"></div>
            <div class="skeleton skeleton-value"></div>
        </div>
    `).join('');
    showTracksSkeleton();
    showArtistsSkeleton();
    ['radarChart', 'listeningClock', 'heatmapGrid', 'genreBubbles', 'moodChart', 'reportCard'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="skeleton skeleton-block"></div>';
    });
}

// ===== DASHBOARD INIT =====
async function initDashboard() {
    if (!localStorage.getItem('spotify_access_token')) {
        window.location.href = 'index.html';
        return;
    }

    showSkeletons();
    setupTabNavigation();
    setupFilters();
    setupLogout();

    try {
        const [user, tracksRes, artistsRes, recentRes, playingRes] = await Promise.all([
            callSpotifyAPI('/me'),
            callSpotifyAPI(`/me/top/tracks?limit=50&time_range=${currentTimeRange}`),
            callSpotifyAPI(`/me/top/artists?limit=50&time_range=${currentTimeRange}`),
            callSpotifyAPI('/me/player/recently-played?limit=50').catch(() => ({ items: [] })),
            callSpotifyAPI('/me/player/currently-playing').catch(() => null)
        ]);

        const tracks = tracksRes.items || [];
        const artists = artistsRes.items || [];
        const recentItems = recentRes?.items || [];
        const trackIds = tracks.map((t) => t.id);
        const audioFeatures = await fetchAudioFeatures(trackIds).catch(() => []);

        const features = deriveFeaturesFromAudio(audioFeatures);
        const listeningHeatmap = deriveListeningHeatmap(recentItems);
        const weeklyHeatmap = deriveWeeklyHeatmap(recentItems);
        const moodTimeline = deriveMoodTimeline(recentItems, audioFeatures, tracks);
        const genres = deriveGenresFromArtists(artists);
        const archetype = deriveArchetype(features);

        window.appData = {
            user, tracks, artists, features, listeningHeatmap, weeklyHeatmap,
            moodTimeline, genres, archetype, audioFeatures, recentItems, playingRes
        };

        renderUserInfo(user);
        renderHero(user, tracks, artists, playingRes);
        renderTracks(tracks, currentTimeRange);
        renderArtists(artists, currentTimeRange);
        syncFilterButtons();
        renderProfile(features, archetype);
        renderListening(listeningHeatmap, weeklyHeatmap);
        renderGenres(genres);
        renderMood(moodTimeline);
        renderReport(user, tracks, artists, features, archetype);

        revealListItems(document.getElementById('tracksGrid'));
        revealListItems(document.getElementById('artistsGrid'));
        const activeSection = document.querySelector('.section.active');
        staggerSection(activeSection);
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        alert('Error loading dashboard: ' + error.message);
        window.location.href = 'index.html';
    }
}

// ===== RENDERING =====
function renderUserInfo(user) {
    document.getElementById('userName').textContent = user.display_name || 'User';
}

function renderHero(user, tracks, artists, playingRes) {
    const profileImg = document.getElementById('profileImage');
    if (user.images?.[0]) profileImg.style.backgroundImage = `url(${user.images[0].url})`;

    document.getElementById('profileName').textContent = user.display_name || 'Your Name';
    document.getElementById('profileEmail').textContent = user.email || 'Connected via Spotify';
    const archetype = window.appData?.archetype || deriveArchetype(window.appData?.features || {});
    document.getElementById('profileArchetype').textContent = archetype.name;

    const stats = [
        { label: 'Top Track', value: tracks[0]?.name || 'N/A', animate: false },
        { label: 'Top Artist', value: artists[0]?.name || 'N/A', animate: false },
        { label: 'Followers', value: user.followers?.total || 0, animate: true },
        { label: 'Top Artists', value: artists.length, animate: true }
    ];

    document.getElementById('topStats').innerHTML = stats.map((s) => `
        <div class="stat-item stagger-item">
            <span class="stat-label">${s.label}</span>
            <span class="stat-value" data-animate="${s.animate}" data-target="${s.animate ? s.value : ''}">${s.animate ? '0' : s.value}</span>
        </div>
    `).join('');

    document.querySelectorAll('#topStats .stat-value[data-animate="true"]').forEach((el) => {
        animateCounter(el, parseInt(el.dataset.target, 10) || 0);
    });

    const playingEl = document.getElementById('currentlyPlaying');
    if (playingRes?.item) {
        const t = playingRes.item;
        playingEl.innerHTML = `
            <div class="now-playing stagger-item">
                <div class="now-playing-art" style="background-image:url(${t.album?.images?.[0]?.url || ''})"></div>
                <div>
                    <div class="now-playing-title">${t.name}</div>
                    <div class="now-playing-artist">${t.artists?.[0]?.name || ''}</div>
                </div>
            </div>
        `;
    } else {
        playingEl.innerHTML = `<p class="muted-text">Nothing playing right now — press play on Spotify!</p>`;
    }
}

function renderTracks(tracks, timeRange = currentTimeRange) {
    const grid = document.getElementById('tracksGrid');
    const ordered = (tracks || []).slice(0, TOP_LIST_LIMIT);
    renderTracksSummary(tracks || []);

    if (!ordered.length) {
        grid.innerHTML = emptyStateHtml('🎵', 'No tracks yet', 'Listen to more music on Spotify, then check back after a few days.');
        return;
    }

    const minutesList = ordered.map((t, i) => estimatedTrackMinutes(t, i + 1));
    const maxMinutes = Math.max(...minutesList, 1);

    grid.classList.add('list-updating');
    grid.innerHTML = ordered.map((track, i) => {
        const rank = i + 1;
        const rankLabel = String(rank).padStart(2, '0');
        const minutes = minutesList[i];
        const barPct = (minutes / maxMinutes) * 100;
        const change = getPositionChange(track.id, rank, timeRange);
        const img = track.album?.images?.[0]?.url || '';

        return `
            <div class="media-row track-row stagger-item">
                <div class="track-rank-large">${rankLabel}</div>
                <div class="track-art" style="background-image:url('${img}')"></div>
                <div class="track-details">
                    <div class="track-title-row">
                        <span class="track-name">${escapeHtml(track.name)}</span>
                        <span class="listen-stat">~${minutes} min listened</span>
                    </div>
                    <div class="track-artist">${escapeHtml(track.artists?.[0]?.name || 'Unknown')}</div>
                    <div class="track-bar-wrap track-bar-desktop">
                        <div class="listening-bar" data-width="${barPct}%" style="width:0"></div>
                    </div>
                    <div class="track-footer">
                        <span class="track-duration">${formatDuration(track.duration_ms)}</span>
                        <span class="listen-stat listen-stat-mobile">~${minutes} min listened</span>
                        <span class="position-change ${change.className}">${change.label}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    saveTrackRanks(ordered, timeRange);
    requestAnimationFrame(() => {
        grid.classList.remove('list-updating');
        revealListItems(grid);
    });
}

function renderArtists(artists, timeRange = currentTimeRange) {
    const grid = document.getElementById('artistsGrid');
    const ordered = (artists || []).slice(0, TOP_LIST_LIMIT);
    renderArtistsSummary(artists || []);

    if (!ordered.length) {
        grid.innerHTML = emptyStateHtml('🎤', 'No artists yet', 'Your top artists will appear here once Spotify has enough listening data for this period.');
        return;
    }

    const hoursList = ordered.map((_, i) => estimatedArtistHours(i + 1));
    const maxHours = Math.max(...hoursList, 1);

    grid.classList.add('list-updating');
    grid.innerHTML = ordered.map((artist, i) => {
        const rank = i + 1;
        const rankLabel = String(rank).padStart(2, '0');
        const hours = hoursList[i];
        const barPct = (hours / maxHours) * 100;
        const img = artist.images?.[0]?.url || '';
        const pills = (artist.genres || []).slice(0, 3).map((g) =>
            `<span class="genre-pill">${escapeHtml(g)}</span>`
        ).join('') || '<span class="genre-pill">Various</span>';

        return `
            <div class="media-row artist-row stagger-item">
                <div class="track-rank-large">${rankLabel}</div>
                <div class="artist-avatar" style="background-image:url('${img}')"></div>
                <div class="track-details">
                    <div class="track-title-row">
                        <span class="track-name">${escapeHtml(artist.name)}</span>
                        <span class="listen-stat">${formatListenHours(hours)}</span>
                    </div>
                    <div class="genre-pills">${pills}</div>
                    <div class="artist-meta">${formatFollowers(artist.followers?.total)}</div>
                    <div class="track-bar-wrap track-bar-desktop">
                        <div class="listening-bar" data-width="${barPct}%" style="width:0"></div>
                    </div>
                    <div class="track-footer artist-footer-mobile">
                        <span class="listen-stat listen-stat-mobile">${formatListenHours(hours)}</span>
                        <span class="artist-meta-mobile">${formatFollowers(artist.followers?.total)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    requestAnimationFrame(() => {
        grid.classList.remove('list-updating');
        revealListItems(grid);
    });
}

function syncFilterButtons() {
    document.querySelectorAll('.btn-filter').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.range === currentTimeRange);
    });
}

function renderProfile(features, archetype) {
    const radarEl = document.getElementById('radarChart');
    radarEl.innerHTML = '';
    const ctx = document.createElement('canvas');
    radarEl.appendChild(ctx);

    if (radarChartInstance) radarChartInstance.destroy();
    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Energy', 'Danceability', 'Acousticness', 'Valence', 'Liveness', 'Speechiness'],
            datasets: [{
                label: 'Your Audio Profile',
                data: [features.energy, features.danceability, features.acousticness, features.valence, features.liveness, features.speechiness],
                borderColor: '#1db954',
                backgroundColor: 'rgba(29, 185, 84, 0.25)',
                pointBackgroundColor: '#1db954',
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    min: 0, max: 100,
                    ticks: { color: '#a3a3a3', backdropColor: 'transparent' },
                    grid: { color: 'rgba(255,255,255,0.12)' },
                    pointLabels: { color: '#e0e0e0', font: { size: 12 } }
                }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });

    document.getElementById('archetypeCard').innerHTML = `
        <div class="emoji-large">${archetype.emoji}</div>
        <p class="archetype-name">${archetype.name}</p>
        <p class="archetype-description">${archetype.desc}</p>
    `;

    const traits = [
        { name: 'Energetic', value: features.energy },
        { name: 'Danceable', value: features.danceability },
        { name: 'Happy', value: features.valence },
        { name: 'Acoustic', value: features.acousticness }
    ];
    document.getElementById('traitsCard').innerHTML = traits.map((t) => `
        <div class="trait-bar stagger-item">
            <span class="trait-name">${t.name}</span>
            <div class="bar"><div class="bar-fill" style="width:${t.value}%"></div></div>
            <span class="trait-pct">${t.value}%</span>
        </div>
    `).join('');
}

function renderListening(listeningHeatmap, weeklyHeatmap) {
    const maxHours = Math.max(...listeningHeatmap.map((h) => h.count), 1);
    let clockSvg = '<svg viewBox="0 0 400 400" class="clock-svg">';
    clockSvg += '<circle cx="200" cy="200" r="140" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>';
    listeningHeatmap.forEach((data, i) => {
        const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const intensity = data.count / maxHours;
        const radius = 100 + intensity * 60;
        const x = 200 + Math.cos(angle) * radius;
        const y = 200 + Math.sin(angle) * radius;
        const r = 6 + intensity * 14;
        const color = `rgba(29, 185, 84, ${0.35 + intensity * 0.65})`;
        clockSvg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
        const lx = 200 + Math.cos(angle) * 165;
        const ly = 200 + Math.sin(angle) * 165;
        clockSvg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#c4c4c4" font-size="11">${i}</text>`;
    });
    clockSvg += '</svg>';
    document.getElementById('listeningClock').innerHTML = clockSvg;

    const maxWeekly = Math.max(...weeklyHeatmap.map((h) => h.value), 1);
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    let heatHtml = '<div class="heatmap-labels">' + dayLabels.map((d) => `<span>${d}</span>`).join('') + '</div>';
    heatHtml += '<div class="heatmap-cells">';
    weeklyHeatmap.forEach((cell) => {
        const intensity = cell.value / maxWeekly;
        heatHtml += `<div class="heatmap-cell" style="background:rgba(29,185,84,${0.15 + intensity * 0.85})" title="${cell.value} plays"></div>`;
    });
    heatHtml += '</div>';
    document.getElementById('heatmapGrid').innerHTML = heatHtml;
}

function renderGenres(genres) {
    if (!genres.length) {
        document.getElementById('genreBubbles').innerHTML = '<p class="muted-text">No genre data from your top artists yet.</p>';
        return;
    }
    const maxHours = Math.max(...genres.map((g) => g.hours), 1);
    const html = genres.slice(0, 10).map((genre, i) => {
        const size = (genre.hours / maxHours) * 120 + 90;
        return `
            <div class="genre-bubble stagger-item" style="width:${size}px;height:${size}px">
                <div class="bubble-content">
                    <div class="bubble-name">${escapeHtml(genre.name)}</div>
                    <div class="bubble-hours">${genre.tracks} weighted</div>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('genreBubbles').innerHTML = `<div class="bubbles-container">${html}</div>`;
}

function renderMood(moodTimeline) {
    const container = document.getElementById('moodChart');
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    if (moodChartInstance) moodChartInstance.destroy();
    moodChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: moodTimeline.map((m) => m.month),
            datasets: [{
                label: 'Valence (Positivity)',
                data: moodTimeline.map((m) => m.valence),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#f59e0b'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { min: 0, max: 100, ticks: { color: '#a3a3a3' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { ticks: { color: '#a3a3a3' }, grid: { color: 'rgba(255,255,255,0.08)' } }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

function renderReport(user, tracks, artists, features, archetype) {
    const year = new Date().getFullYear();
    document.getElementById('reportCard').innerHTML = `
        <div class="report-card-content" id="reportCardInner">
            <div class="report-header">
                <h3>${escapeHtml(user.display_name || 'Your')} Spotify ${year}</h3>
                <p class="report-sub">${archetype.emoji} ${archetype.name}</p>
            </div>
            <div class="report-body">
                <div class="report-stat"><span class="report-label">Top Track</span><span class="report-value">${escapeHtml(tracks[0]?.name || 'N/A')}</span></div>
                <div class="report-stat"><span class="report-label">Top Artist</span><span class="report-value">${escapeHtml(artists[0]?.name || 'N/A')}</span></div>
                <div class="report-stat"><span class="report-label">Happiness</span><span class="report-value">${features.valence}%</span></div>
                <div class="report-stat"><span class="report-label">Energy</span><span class="report-value">${features.energy}%</span></div>
                <div class="report-stat"><span class="report-label">Danceability</span><span class="report-value">${features.danceability}%</span></div>
            </div>
        </div>
    `;

    const dlBtn = document.getElementById('reportDownloadBtn');
    const cpBtn = document.getElementById('reportCopyBtn');
    dlBtn.replaceWith(dlBtn.cloneNode(true));
    cpBtn.replaceWith(cpBtn.cloneNode(true));
    document.getElementById('reportDownloadBtn').addEventListener('click', downloadReportPNG);
    document.getElementById('reportCopyBtn').addEventListener('click', copyReportText);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== EVENTS =====
function setupTabNavigation() {
    document.querySelectorAll('.nav-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('active')) return;
            const current = document.querySelector('.section.active');
            const target = document.getElementById(tab.dataset.section);
            if (!target) return;

            document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');

            const showTarget = () => {
                document.querySelectorAll('.section').forEach((s) => {
                    s.classList.remove('active', 'section-leaving', 'section-entering');
                });
                target.classList.add('active', 'section-entering');
                setTimeout(() => {
                    target.classList.remove('section-entering');
                    staggerSection(target);
                }, 200);
            };

            if (current && current !== target) {
                current.classList.add('section-leaving');
                setTimeout(showTarget, 150);
            } else {
                showTarget();
            }
        });
    });
}

function setupFilters() {
    document.querySelectorAll('.btn-filter').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const range = btn.dataset.range;
            if (!range || range === currentTimeRange) return;

            currentTimeRange = range;
            syncFilterButtons();
            showTracksSkeleton();
            showArtistsSkeleton();

            try {
                const [tracksRes, artistsRes] = await Promise.all([
                    callSpotifyAPI(`/me/top/tracks?limit=50&time_range=${range}`),
                    callSpotifyAPI(`/me/top/artists?limit=50&time_range=${range}`)
                ]);
                window.appData.tracks = tracksRes.items || [];
                window.appData.artists = artistsRes.items || [];
                window.appData.genres = deriveGenresFromArtists(window.appData.artists);

                renderTracks(window.appData.tracks, range);
                renderArtists(window.appData.artists, range);

                const active = document.querySelector('.section.active');
                if (active && (active.id === 'tracks' || active.id === 'artists')) {
                    staggerSection(active);
                }
            } catch (e) {
                console.error(e);
                const msg = emptyStateHtml('⚠️', 'Could not load data', 'Try again in a moment or pick a different time range.');
                document.getElementById('tracksGrid').innerHTML = msg;
                document.getElementById('artistsGrid').innerHTML = msg;
            }
        });
    });
}

function setupLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        ['spotify_access_token', 'spotify_token_expires_at', 'spotify_code_verifier'].forEach((k) => localStorage.removeItem(k));
        window.location.href = 'index.html';
    });
}

function downloadReportPNG() {
    const card = document.getElementById('reportCardInner') || document.getElementById('reportCard');
    if (typeof html2canvas === 'undefined') {
        alert('Download unavailable — reload the page.');
        return;
    }
    html2canvas(card, { backgroundColor: '#0a0a0a', scale: 2 }).then((canvas) => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'spotify-stats-report.png';
        link.click();
    });
}

function copyReportText() {
    const text = document.getElementById('reportCard').innerText;
    navigator.clipboard.writeText(text).then(() => alert('Report copied to clipboard!'));
}
