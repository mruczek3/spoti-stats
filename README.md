# Spotify Stats - Premium Listening Analytics

A stunning, feature-rich web application that analyzes and visualizes your Spotify listening statistics with an editorial, magazine-grade aesthetic. Built with React, TypeScript, and modern web technologies.

![Spotify Stats Preview](https://img.shields.io/badge/Status-Fully%20Functional-green) ![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-8-purple)

## 🎵 Features

### Core Analytics Dashboard
- **Hero Dashboard** - Personalized greeting with listening personality profile
  - Currently playing track with animated progress bar and audio features
  - Key stats: total minutes listened, artists discovered, listening streak
  - Visual listening streak tracker (GitHub contributions-style)

- **Top Tracks** - Deep dive into your favorite songs
  - Switchable time ranges (4 weeks, 6 months, all time)
  - Unique waveform visualizations per track
  - Drag-to-reorder personal ranking vs actual ranking
  - Play counts, hours listened, mood scores

- **Top Artists** - Magazine-style artist profiles
  - Large blurred background images from artist photos
  - Loyalty score showing how long you've been listening
  - Genre tags and compatibility scores
  - Artist popularity metrics

- **Listening Personality Profile** - Your Unique Taste
  - Interactive radar chart of 6 audio dimensions
    - Energy, Danceability, Acousticness, Valence, Liveness, Speechiness
  - Generated "Listener Archetype" (e.g., "The Midnight Wanderer", "The Hype Machine")
  - Dynamic personality descriptions based on your profile

- **Listening Patterns** - When & How You Listen
  - 24-hour radial clock showing listening intensity by hour
  - Weekly heatmap (GitHub-style) spanning 52 weeks
  - Peak hour identification with top track from that time
  - Month-by-month listening trends

- **Genre Universe** - Interactive bubble chart
  - Physics-based bubbles sized by listening hours
  - Click bubbles to explore genre details
  - Genre evolution over time
  - Visualize your complete taste landscape

- **Mood Timeline** - 12-month emotional journey
  - Area chart showing music valence (happiness) over the year
  - Major mood shifts identified and annotated
  - Happiest and most melancholic periods highlighted
  - Connect your listening to life events

- **Listening Report Card** - Shareable stats
  - 3 beautiful card templates: Minimal, Detailed, Artistic
  - Export as PNG with one click
  - Copy to clipboard for instant social sharing
  - Generate yearly summaries of your listening

- **Compare Mode** - Connect with other listeners
  - Side-by-side taste profile comparisons
  - Compatibility percentage with animated reveal
  - Shared favorite tracks and artists
  - Divergence map showing where taste differs

## 🎨 Design Features

### Aesthetic Direction
- **Dark, Editorial Aesthetic** - Deep near-black background (#0a0a0a) with Spotify green (#1DB954)
- **Glassmorphism Cards** - Frosted glass effect with subtle blur and border glow
- **Premium Typography** - Bebas Neue for bold headings, DM Sans for body text
- **Animated Grain Overlay** - Subtle noise texture across entire interface
- **Smooth Micro-interactions** - Every element responds to user input with polish
  - Card hover lifts and color shifts
  - Animated progress bars with shimmer effects
  - Waveform visualizations with rhythm animations
  - Staggered entrance animations on scroll

### Responsive Design
- Full mobile responsiveness with touch-friendly interactions
- Optimized layouts for all screen sizes
- Adaptive grid systems that collapse gracefully
- Touch-friendly buttons and interactive elements

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone or navigate to the project
cd ahsah

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173/
```

### Build for Production

```bash
npm run build

# Preview production build
npm run preview
```

## 📊 Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 8 (ultra-fast development server)
- **Styling**: Custom CSS with CSS Grid & Flexbox
- **Charts & Visualizations**: 
  - Recharts for interactive charts (radar, area, bar)
  - D3.js principles for physics-based animations
  - Canvas API for custom visualizations (genre bubble chart)
- **Export**: html2canvas for PNG generation
- **Icons**: React Icons
- **Type Safety**: TypeScript 5

### Key Dependencies
```json
{
  "recharts": "^2.10+",
  "d3": "^7.8+",
  "react-icons": "^4.11+",
  "html2canvas": "^1.4+",
  "framer-motion": "^10.16+"
}
```

## 📁 Project Structure

```
src/
├── components/
│   ├── App.tsx                  # Main application component
│   ├── Navbar.tsx               # Navigation bar
│   ├── HeroDashboard.tsx        # Hero section & key stats
│   ├── TopTracks.tsx            # Top tracks with rankings
│   ├── TopArtists.tsx           # Artist profiles
│   ├── PersonalityProfile.tsx   # Radar chart & personality
│   ├── ListeningClock.tsx       # 24h clock & heatmap
│   ├── GenreUniverse.tsx        # Bubble chart visualization
│   ├── MoodTimeline.tsx         # 12-month mood chart
│   ├── ReportCard.tsx           # Shareable report generator
│   ├── CompareMode.tsx          # User comparison
│   ├── Footer.tsx               # Footer
│   └── index.ts                 # Component exports
├── data/
│   └── mockData.ts              # Mock Spotify data generator
├── styles.css                   # Global styles & theming
├── App.tsx                      # Root export
├── main.tsx                     # React DOM entry point
└── index.css                    # Global CSS
```

## 🎯 Mock Data

All data is hardcoded with realistic Spotify artist and track information including:
- Real artist names and track titles
- Authentic album artwork placeholders
- Audio feature data (BPM, energy, danceability, etc.)
- Listening history patterns
- User personality profiles

### Data Generation

The mock data generator (`src/data/mockData.ts`) creates:
- Realistic listening statistics
- Time-based heatmaps (hourly and weekly)
- Mood timelines with natural fluctuations
- Genre distributions
- Discovery patterns

## 🔌 Spotify OAuth Integration (Ready)

The application is architected to seamlessly integrate real Spotify OAuth:

1. Add Spotify API configuration to environment variables
2. Replace `generateMockUserProfile()` with real API calls
3. Implement PKCE flow for secure authentication
4. Cache fetched data in localStorage for offline access

**Current Setup**: Uses mock data for development and demonstration

## 🎬 Usage

### Navigation
- Click navbar sections to navigate between views
- All sections load instantly with smooth transitions
- Responsive navbar collapses on mobile devices

### Interactions
- **Top Tracks**: Drag to reorder your personal ranking
- **Genre Universe**: Click bubbles to explore genres
- **Report Card**: Switch templates and export as PNG
- **Compare Mode**: View your compatibility with another user

### Sharing
1. Go to "Report" section
2. Select your preferred card template
3. Click "Download as PNG" or "Copy to Clipboard"
4. Share on social media or with friends

## 🎨 Customization

### Theming
Edit `src/styles.css` CSS variables:
```css
:root {
  --primary-dark: #0a0a0a;
  --primary-green: #1db954;
  --secondary-amber: #f59e0b;
  --secondary-cyan: #06b6d4;
  /* ... more variables */
}
```

### Colors
- Primary: Spotify Green (#1DB954)
- Dark Background: #0a0a0a
- Secondary Accents: Amber (#f59e0b), Cyan (#06b6d4)
- Text: White (#ffffff) and Gray (#b3b3b3)

### Typography
- Display: "Bebas Neue" or "Playfair Display"
- Body: "DM Sans" or "Syne"
- Imported from Google Fonts

## 🚀 Performance Optimizations

- Code-splitting for faster initial load
- Lazy loading of chart libraries
- CSS-only animations for better performance
- Optimized re-renders with React hooks
- Minimal dependencies for smaller bundle

## 📱 Responsive Breakpoints

- **Desktop**: 1400px max-width container
- **Tablet**: 768px and down
- **Mobile**: 480px and down

## 🔐 Privacy

- All data processing happens client-side
- No data is sent to external servers (in mock mode)
- No tracking or analytics
- Fully functional offline (mock data only)

## 🚧 Future Enhancements

- [ ] Real Spotify OAuth integration
- [ ] LocalStorage data caching
- [ ] Time machine slider (view stats from past months)
- [ ] AI-generated playlist suggestions
- [ ] Advanced export formats (PDF, SVG)
- [ ] Dark/Light theme toggle (currently dark only)
- [ ] Playlist analysis and recommendations
- [ ] Friend comparison and leaderboards

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes

## 🙏 Credits

- Inspired by Spotify Wrapped and stats.fm
- Built with ❤️ using React, TypeScript, and Vite
- Icons from React Icons
- Charts powered by Recharts

## 📞 Support

For issues or questions:
1. Check existing documentation
2. Review the code comments
3. Test with mock data to isolate issues
4. Inspect browser console for error messages

---

**Made with 🎵 and ✨ by developers who love music**

      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
