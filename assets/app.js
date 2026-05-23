// ===== SPOTIFY OAUTH PKCE FLOW =====
const CLIENT_ID = 'fa5e8ae611124119aee7fd0ba733228c';
const REDIRECT_URI = (() => {
    const path = window.location.pathname.includes('callback.html') ? 'callback.html' : 'callback.html';
    return `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '')}/${path}`;
})();
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-read-playback-state',
    'user-read-currently-playing'
].join(' ');

// Generate random string for PKCE
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Generate code challenge from verifier
async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    return base64;
}

// Initiate Spotify login
async function initiateSpotifyLogin() {
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

// Handle OAuth callback
async function handleSpotifyCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    
    const statusEl = document.getElementById('status');
    const errorEl = document.getElementById('error');
    
    if (error) {
        errorEl.textContent = `Auth error: ${error}`;
        errorEl.style.display = 'block';
        setTimeout(() => window.location.href = 'index.html', 3000);
        return;
    }
    
    if (!code) {
        errorEl.textContent = 'No authorization code received';
        errorEl.style.display = 'block';
        setTimeout(() => window.location.href = 'index.html', 3000);
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
        localStorage.removeItem('spotify_is_demo');
        
        statusEl.textContent = 'Success! Redirecting...';
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
    } catch (error) {
        console.error('Token exchange error:', error);
        errorEl.textContent = `Token exchange failed: ${error.message}`;
        errorEl.style.display = 'block';
        setTimeout(() => window.location.href = 'index.html', 3000);
    }
}

// ===== MOCK DATA GENERATION =====
function generateMockUser() {
    const archetypes = ['The Dreamer', 'The Party Animal', 'The Intellectual', 'The Romantic', 'The Explorer', 'The Nocturnal Listener'];
    return {
        id: 'user123',
        display_name: 'Your Name',
        email: 'user@spotify.com',
        external_urls: { spotify: 'https://open.spotify.com/user/user123' },
        followers: { total: 42 },
        images: [{ url: 'https://via.placeholder.com/300' }],
        archetype: archetypes[Math.floor(Math.random() * archetypes.length)]
    };
}

function generateMockTracks() {
    const artists = ['The Weeknd', 'Drake', 'Post Malone', 'Ariana Grande', 'Billie Eilish', 'Dua Lipa', 'Harry Styles', 'Olivia Rodrigo'];
    const tracks = [];
    for (let i = 1; i <= 10; i++) {
        tracks.push({
            id: `track${i}`,
            name: `Top Track #${i}`,
            artists: [{ name: artists[i % artists.length] }],
            album: { images: [{ url: 'https://via.placeholder.com/200' }] },
            popularity: 80 + Math.random() * 20,
            duration_ms: 200000 + Math.random() * 100000,
            explicit: Math.random() > 0.7,
            play_count: Math.floor(100 + Math.random() * 500),
            listening_hours: Math.floor(5 + Math.random() * 50),
            mood: Math.random() * 100
        });
    }
    return tracks;
}

function generateMockArtists() {
    const artists = [];
    const names = ['The Weeknd', 'Drake', 'Post Malone', 'Ariana Grande', 'Billie Eilish', 'Dua Lipa', 'Harry Styles', 'Olivia Rodrigo', 'Bad Bunny', 'Travis Scott', 'Kendrick Lamar', 'Tyler, the Creator'];
    const genres = [['pop', 'r&b'], ['hip-hop', 'rap'], ['pop', 'edm'], ['pop'], ['alternative', 'indie'], ['electronic', 'pop']];
    
    for (let i = 0; i < 12; i++) {
        artists.push({
            id: `artist${i}`,
            name: names[i],
            popularity: 70 + Math.random() * 30,
            genres: genres[i % genres.length],
            followers: { total: Math.floor(1000000 + Math.random() * 50000000) },
            images: [{ url: 'https://via.placeholder.com/200' }],
            loyalty_score: 40 + Math.random() * 60,
            listening_years: Math.floor(1 + Math.random() * 8),
            compatibility: 70 + Math.random() * 30
        });
    }
    return artists;
}

function generateMockAudioFeatures() {
    return {
        energy: 50 + Math.random() * 50,
        danceability: 40 + Math.random() * 60,
        acousticness: Math.random() * 50,
        valence: 30 + Math.random() * 70,
        liveness: Math.random() * 100,
        speechiness: Math.random() * 40
    };
}

function generateMockListeningHeatmap() {
    const heatmap = [];
    for (let hour = 0; hour < 24; hour++) {
        heatmap.push({
            hour: hour,
            count: Math.floor(Math.random() * 100)
        });
    }
    return heatmap;
}

function generateMockWeeklyHeatmap() {
    const heatmap = [];
    for (let week = 0; week < 52; week++) {
        for (let day = 0; day < 7; day++) {
            heatmap.push({
                week, day,
                value: Math.floor(Math.random() * 10)
            });
        }
    }
    return heatmap;
}

function generateMockMoodTimeline() {
    const timeline = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let valence = 50;
    for (let i = 0; i < 12; i++) {
        valence += (Math.random() - 0.5) * 30;
        valence = Math.max(20, Math.min(80, valence));
        timeline.push({
            month: months[i],
            valence: Math.round(valence)
        });
    }
    return timeline;
}

function generateMockGenres() {
    const genres = ['Pop', 'Hip-Hop', 'R&B', 'Electronic', 'Rock', 'Indie', 'Latin', 'K-Pop', 'Country', 'Soul'];
    return genres.map((name, i) => ({
        name,
        hours: Math.floor(10 + Math.random() * 100),
        tracks: Math.floor(10 + Math.random() * 50)
    })).sort((a, b) => b.hours - a.hours);
}

function loadDemoData() {
    localStorage.setItem('spotify_is_demo', 'true');
    localStorage.setItem('spotify_demo_user', JSON.stringify(generateMockUser()));
    localStorage.setItem('spotify_demo_tracks', JSON.stringify(generateMockTracks()));
    localStorage.setItem('spotify_demo_artists', JSON.stringify(generateMockArtists()));
    localStorage.setItem('spotify_demo_audio_features', JSON.stringify(generateMockAudioFeatures()));
    localStorage.setItem('spotify_demo_listening_heatmap', JSON.stringify(generateMockListeningHeatmap()));
    localStorage.setItem('spotify_demo_weekly_heatmap', JSON.stringify(generateMockWeeklyHeatmap()));
    localStorage.setItem('spotify_demo_mood_timeline', JSON.stringify(generateMockMoodTimeline()));
    localStorage.setItem('spotify_demo_genres', JSON.stringify(generateMockGenres()));
}

// ===== API CALLS =====
async function callSpotifyAPI(endpoint) {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) throw new Error('No access token');
    
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('spotify_access_token');
            window.location.href = 'index.html';
            throw new Error('Token expired');
        }
        throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
}

// ===== DASHBOARD INITIALIZATION =====
async function initDashboard() {
    // Check authentication
    const isDemo = localStorage.getItem('spotify_is_demo') === 'true';
    const hasToken = !!localStorage.getItem('spotify_access_token');
    
    if (!isDemo && !hasToken) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // Load data
        let user, tracks, artists, features, listeningHeatmap, weeklyHeatmap, moodTimeline, genres;
        
        if (isDemo) {
            user = JSON.parse(localStorage.getItem('spotify_demo_user') || JSON.stringify(generateMockUser()));
            tracks = JSON.parse(localStorage.getItem('spotify_demo_tracks') || JSON.stringify(generateMockTracks()));
            artists = JSON.parse(localStorage.getItem('spotify_demo_artists') || JSON.stringify(generateMockArtists()));
            features = JSON.parse(localStorage.getItem('spotify_demo_audio_features') || JSON.stringify(generateMockAudioFeatures()));
            listeningHeatmap = JSON.parse(localStorage.getItem('spotify_demo_listening_heatmap') || JSON.stringify(generateMockListeningHeatmap()));
            weeklyHeatmap = JSON.parse(localStorage.getItem('spotify_demo_weekly_heatmap') || JSON.stringify(generateMockWeeklyHeatmap()));
            moodTimeline = JSON.parse(localStorage.getItem('spotify_demo_mood_timeline') || JSON.stringify(generateMockMoodTimeline()));
            genres = JSON.parse(localStorage.getItem('spotify_demo_genres') || JSON.stringify(generateMockGenres()));
        } else {
            try {
                user = await callSpotifyAPI('/me');
            } catch {
                user = generateMockUser();
            }
            try {
                const tracksRes = await callSpotifyAPI('/me/top/tracks?limit=10&time_range=medium_term');
                tracks = tracksRes.items;
            } catch {
                tracks = generateMockTracks();
            }
            try {
                const artistsRes = await callSpotifyAPI('/me/top/artists?limit=12');
                artists = artistsRes.items;
            } catch {
                artists = generateMockArtists();
            }
            features = generateMockAudioFeatures();
            listeningHeatmap = generateMockListeningHeatmap();
            weeklyHeatmap = generateMockWeeklyHeatmap();
            moodTimeline = generateMockMoodTimeline();
            genres = generateMockGenres();
        }
        
        // Store data globally for access in other functions
        window.appData = { user, tracks, artists, features, listeningHeatmap, weeklyHeatmap, moodTimeline, genres };
        
        // Render UI
        renderUserInfo(user);
        renderHero(user, tracks, artists);
        renderTracks(tracks);
        renderArtists(artists);
        renderProfile(features);
        renderListening(listeningHeatmap, weeklyHeatmap);
        renderGenres(genres);
        renderMood(moodTimeline);
        renderReport(user, tracks, artists, features);
        
        // Setup event listeners
        setupTabNavigation();
        setupFilters();
        setupLogout();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        alert('Error loading dashboard. Please try again.');
        window.location.href = 'index.html';
    }
}

// ===== UI RENDERING =====
function renderUserInfo(user) {
    document.getElementById('userName').textContent = user.display_name || 'User';
}

function renderHero(user, tracks, artists) {
    const profileImg = document.getElementById('profileImage');
    if (user.images && user.images[0]) {
        profileImg.style.backgroundImage = `url(${user.images[0].url})`;
    }
    
    document.getElementById('profileName').textContent = user.display_name || 'Your Name';
    document.getElementById('profileEmail').textContent = user.email || 'user@spotify.com';
    document.getElementById('profileArchetype').textContent = user.archetype || 'The Explorer';
    
    const statsHtml = `
        <div class="stat-item">
            <span class="stat-label">Top Track:</span>
            <span class="stat-value">${tracks[0]?.name || 'N/A'}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Top Artist:</span>
            <span class="stat-value">${artists[0]?.name || 'N/A'}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Followers:</span>
            <span class="stat-value">${(user.followers?.total || 0).toLocaleString()}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Artists Followed:</span>
            <span class="stat-value">${artists.length}</span>
        </div>
    `;
    document.getElementById('topStats').innerHTML = statsHtml;
}

function renderTracks(tracks) {
    const grid = document.getElementById('tracksGrid');
    const html = tracks.map((track, i) => `
        <div class="track-card">
            <div class="track-rank">#${i + 1}</div>
            <div class="track-image" style="background-image: url(${track.album?.images[0]?.url || 'https://via.placeholder.com/200'})"></div>
            <div class="track-info">
                <div class="track-name">${track.name}</div>
                <div class="track-artist">${track.artists[0]?.name || 'Unknown'}</div>
                <div class="track-stats">
                    <span>🎵 ${track.play_count || Math.floor(Math.random() * 500)}</span>
                    <span>⏱️ ${Math.floor((track.duration_ms || 200000) / 60000)}m</span>
                </div>
            </div>
        </div>
    `).join('');
    grid.innerHTML = html;
}

function renderArtists(artists) {
    const grid = document.getElementById('artistsGrid');
    const html = artists.map((artist, i) => `
        <div class="artist-card">
            <div class="artist-rank">#${i + 1}</div>
            <div class="artist-image" style="background-image: url(${artist.images[0]?.url || 'https://via.placeholder.com/200'})"></div>
            <div class="artist-overlay">
                <div class="artist-name">${artist.name}</div>
                <div class="artist-genres">${(artist.genres || ['Pop']).slice(0, 2).join(', ')}</div>
                <div class="artist-stats">
                    <span>📊 ${(artist.compatibility || Math.floor(70 + Math.random() * 30))}% Match</span>
                    <span>⭐ ${(artist.popularity || Math.floor(70 + Math.random() * 30))}</span>
                </div>
            </div>
        </div>
    `).join('');
    grid.innerHTML = html;
}

function renderProfile(features) {
    // Render radar chart using Chart.js
    const ctx = document.createElement('canvas');
    document.getElementById('radarChart').appendChild(ctx);
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Energy', 'Danceability', 'Acousticness', 'Valence', 'Liveness', 'Speechiness'],
            datasets: [{
                label: 'Your Audio Profile',
                data: [
                    features.energy,
                    features.danceability,
                    features.acousticness,
                    features.valence,
                    features.liveness,
                    features.speechiness
                ],
                borderColor: '#1db954',
                backgroundColor: 'rgba(29, 185, 84, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    max: 100,
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
    
    document.getElementById('archetypeCard').innerHTML = `
        <div class="emoji-large">🎭</div>
        <p class="archetype-name">${window.appData.user.archetype || 'The Explorer'}</p>
        <p class="archetype-description">Your listening profile reveals a unique taste that blends multiple genres.</p>
    `;
    
    const traits = [
        { name: 'Energetic', value: Math.round(features.energy) },
        { name: 'Danceable', value: Math.round(features.danceability) },
        { name: 'Vocal-Forward', value: Math.round(features.speechiness) }
    ];
    document.getElementById('traitsCard').innerHTML = traits.map(t => `
        <div class="trait-bar">
            <span>${t.name}</span>
            <div class="bar"><div class="bar-fill" style="width: ${t.value}%; background: #1db954;"></div></div>
            <span>${t.value}%</span>
        </div>
    `).join('');
}

function renderListening(listeningHeatmap, weeklyHeatmap) {
    const maxHours = Math.max(...listeningHeatmap.map(h => h.count));
    
    // Render 24-hour clock
    let clockSvg = '<svg viewBox="0 0 400 400" style="width: 100%; height: 100%;">';
    listeningHeatmap.forEach((data, i) => {
        const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const intensity = data.count / maxHours;
        const radius = 150 + (intensity * 50);
        const x = 200 + Math.cos(angle) * radius;
        const y = 200 + Math.sin(angle) * radius;
        
        const color = `rgba(29, 185, 84, ${0.3 + intensity * 0.7})`;
        clockSvg += `<circle cx="${x}" cy="${y}" r="12" fill="${color}"/>`;
        clockSvg += `<text x="${x}" y="${y}" text-anchor="middle" fill="#fff" font-size="10">${i}</text>`;
    });
    clockSvg += '</svg>';
    document.getElementById('listeningClock').innerHTML = clockSvg;
    
    // Render heatmap
    const maxWeekly = Math.max(...weeklyHeatmap.map(h => h.value));
    const heatmapHtml = weeklyHeatmap.map(cell => {
        const intensity = cell.value / maxWeekly;
        const color = `rgba(29, 185, 84, ${intensity * 0.8})`;
        return `<div class="heatmap-cell" style="background: ${color};" title="Week ${cell.week + 1}, Day ${cell.day + 1}"></div>`;
    }).join('');
    document.getElementById('heatmapGrid').innerHTML = heatmapHtml;
}

function renderGenres(genres) {
    const maxHours = Math.max(...genres.map(g => g.hours));
    const html = genres.slice(0, 8).map(genre => {
        const size = (genre.hours / maxHours) * 150 + 80;
        return `
            <div class="genre-bubble" style="width: ${size}px; height: ${size}px;">
                <div class="bubble-content">
                    <div class="bubble-name">${genre.name}</div>
                    <div class="bubble-hours">${genre.hours}h</div>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('genreBubbles').innerHTML = `<div class="bubbles-container">${html}</div>`;
}

function renderMood(moodTimeline) {
    const canvas = document.createElement('canvas');
    document.getElementById('moodChart').appendChild(canvas);
    
    new Chart(canvas, {
        type: 'line',
        data: {
            labels: moodTimeline.map(m => m.month),
            datasets: [{
                label: 'Monthly Valence (Happiness)',
                data: moodTimeline.map(m => m.valence),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    max: 100,
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
}

function renderReport(user, tracks, artists, features) {
    const reportHtml = `
        <div class="report-card-content">
            <div class="report-header">
                <h3>Your Spotify 2024</h3>
            </div>
            <div class="report-body">
                <div class="report-stat">
                    <span class="report-label">Top Track:</span>
                    <span class="report-value">${tracks[0]?.name || 'N/A'}</span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Top Artist:</span>
                    <span class="report-value">${artists[0]?.name || 'N/A'}</span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Vibe:</span>
                    <span class="report-value">${Math.round(features.valence)}% Happy</span>
                </div>
                <div class="report-stat">
                    <span class="report-label">Energy:</span>
                    <span class="report-value">${Math.round(features.energy)}% Energetic</span>
                </div>
            </div>
        </div>
    `;
    document.getElementById('reportCard').innerHTML = reportHtml;
    
    // Setup report buttons
    document.getElementById('reportDownloadBtn').addEventListener('click', downloadReportPNG);
    document.getElementById('reportCopyBtn').addEventListener('click', copyReportText);
}

// ===== EVENT LISTENERS =====
function setupTabNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            const section = document.getElementById(tab.dataset.section);
            if (section) section.classList.add('active');
        });
    });
}

function setupFilters() {
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Could reload tracks here with different time range
        });
    });
}

function setupLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expires_at');
        localStorage.removeItem('spotify_is_demo');
        window.location.href = 'index.html';
    });
}

// ===== REPORT FUNCTIONS =====
function downloadReportPNG() {
    const reportCard = document.getElementById('reportCard');
    html2canvas(reportCard, { backgroundColor: '#0a0a0a' }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'spotify-stats.png';
        link.click();
    });
}

function copyReportText() {
    const text = document.getElementById('reportCard').innerText;
    navigator.clipboard.writeText(text).then(() => {
        alert('Report copied to clipboard!');
    });
}
