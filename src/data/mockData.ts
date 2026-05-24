// Real artist names and track data for authentic feel
export interface Track {
  id: string;
  name: string;
  artist: string;
  artistId: string;
  album: string;
  albumArt: string;
  duration: number;
  playCount: number;
  hoursListened: number;
  moodScore: number; // 0-100
  releaseDate: string;
  popularity: number;
  audioFeatures: {
    energy: number;
    danceability: number;
    acousticness: number;
    valence: number;
    liveness: number;
    speechiness: number;
    bpm: number;
  };
  addedAt: Date;
  isUnderrated: boolean;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  genre: string[];
  totalPlaytime: number;
  trackCount: number;
  followerCount: number;
  popularity: number;
  loyaltyScore: number; // 0-100
  firstListenedAt: Date;
}

export interface UserProfile {
  id: string;
  statsId?: string; // STATS-XXXXXX app-level ID (never shows raw Spotify ID)
  displayName: string;
  avatar: string;
  topTracks: Track[];
  topArtists: Artist[];
  totalMinutesListened: number;
  artistsDiscovered: number;
  listeningStreak: number;
  personality: {
    energy: number;
    danceability: number;
    acousticness: number;
    valence: number;
    liveness: number;
    speechiness: number;
  };
  listenerArchetype: string;
  archetypeDescription: string;
  currentlyPlaying: Track | null;
  listeningHistory: {
    hour: number;
    count: number;
    topTrack?: string;
  }[];
  weeklyHeatmap: number[][];
  moodTimeline: { month: string; valence: number; topTrack?: string }[];
  genres: Map<string, { count: number; hours: number }>;
  discoveries: {
    month: string;
    newArtists: number;
  }[];
}

// Realistic Spotify-like data
const ARTISTS_POOL = [
  {
    name: "Kendrick Lamar",
    genres: ["Hip-Hop", "Rap"],
    popularity: 92,
    image: "https://i.scdn.co/image/ab6761610000f178a45b1b7e503fb0e71a78a8f0",
  },
  {
    name: "Tyler, The Creator",
    genres: ["Hip-Hop", "Rap", "Alternative"],
    popularity: 88,
    image: "https://i.scdn.co/image/ab6761610000f17864f15c2efdb31c05d2a16a7d",
  },
  {
    name: "Radiohead",
    genres: ["Rock", "Alternative", "Indie"],
    popularity: 85,
    image: "https://i.scdn.co/image/ab6761610000f17845bfc07dd0cf5d89a2c8fa0e",
  },
  {
    name: "The Weeknd",
    genres: ["R&B", "Pop", "Electronic"],
    popularity: 94,
    image: "https://i.scdn.co/image/ab6761610000f178e6de04cd583feb84e82e79ff",
  },
  {
    name: "Frank Ocean",
    genres: ["R&B", "Hip-Hop", "Soul"],
    popularity: 82,
    image: "https://i.scdn.co/image/ab6761610000f178c2c6e70d28485a2e87db1786",
  },
  {
    name: "Dua Lipa",
    genres: ["Pop", "Dance", "Electronic"],
    popularity: 89,
    image: "https://i.scdn.co/image/ab6761610000f17803b2ad4eaf0b18f92de7a47a",
  },
  {
    name: "Tame Impala",
    genres: ["Psychedelic Pop", "Alternative", "Electronic"],
    popularity: 84,
    image: "https://i.scdn.co/image/ab6761610000f178b65c54c05a91f39e0d6ecd2b",
  },
  {
    name: "Billie Eilish",
    genres: ["Alternative", "Pop", "Indie"],
    popularity: 90,
    image: "https://i.scdn.co/image/ab6761610000f1782c1b9b7eae7b7d1c87e8a0e7",
  },
  {
    name: "SZA",
    genres: ["R&B", "Soul", "Hip-Hop"],
    popularity: 88,
    image: "https://i.scdn.co/image/ab6761610000f178a94f8a2c43d0e6f9c8d8d8d8",
  },
  {
    name: "The 1975",
    genres: ["Indie Pop", "Alternative", "Synthwave"],
    popularity: 81,
    image: "https://i.scdn.co/image/ab6761610000f178b8c8c8c8c8c8c8c8c8c8c8c8",
  },
];

const TRACKS_POOL = [
  {
    name: "HUMBLE.",
    artist: "Kendrick Lamar",
    album: "DAMN.",
    bpm: 95,
    energy: 75,
  },
  {
    name: "EARFQUAKE",
    artist: "Tyler, The Creator",
    album: "IGOR",
    bpm: 140,
    energy: 85,
  },
  {
    name: "Creep",
    artist: "Radiohead",
    album: "Pablo Honey",
    bpm: 92,
    energy: 60,
  },
  {
    name: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    bpm: 170,
    energy: 88,
  },
  {
    name: "Thinkin Bout You",
    artist: "Frank Ocean",
    album: "Channel Orange",
    bpm: 98,
    energy: 70,
  },
  {
    name: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    bpm: 103,
    energy: 82,
  },
  {
    name: "The Less I Know The Better",
    artist: "Tame Impala",
    album: "Currents",
    bpm: 120,
    energy: 78,
  },
  {
    name: "Bad Guy",
    artist: "Billie Eilish",
    album: "When We All Fall Asleep",
    bpm: 135,
    energy: 65,
  },
  {
    name: "The Story",
    artist: "SZA",
    album: "Ctrl",
    bpm: 88,
    energy: 68,
  },
  {
    name: "I Like America & America Likes Me",
    artist: "The 1975",
    album: "I Like It When You Sleep...",
    bpm: 110,
    energy: 72,
  },
  {
    name: "King Kunta",
    artist: "Kendrick Lamar",
    album: "To Pimp a Butterfly",
    bpm: 110,
    energy: 80,
  },
  {
    name: "See You Again",
    artist: "Tyler, The Creator",
    album: "Flower Boy",
    bpm: 88,
    energy: 55,
  },
  {
    name: "No Surprises",
    artist: "Radiohead",
    album: "OK Computer",
    bpm: 120,
    energy: 62,
  },
  {
    name: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    bpm: 128,
    energy: 85,
  },
  {
    name: "Pink + White",
    artist: "Frank Ocean",
    album: "Blonde",
    bpm: 92,
    energy: 50,
  },
  {
    name: "Break My Heart",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    bpm: 124,
    energy: 80,
  },
  {
    name: "Elephant",
    artist: "Tame Impala",
    album: "Lonerism",
    bpm: 125,
    energy: 82,
  },
  {
    name: "When We All Fall Asleep Where Do We Go?",
    artist: "Billie Eilish",
    album: "When We All Fall Asleep",
    bpm: 80,
    energy: 45,
  },
  {
    name: "Good Days",
    artist: "SZA",
    album: "Ctrl",
    bpm: 92,
    energy: 60,
  },
  {
    name: "Me & You Together Song",
    artist: "The 1975",
    album: "Being Funny in a Foreign Language",
    bpm: 108,
    energy: 75,
  },
];

function generateRandomId() {
  return Math.random().toString(36).substring(2, 11);
}

function generateAudioFeatures() {
  return {
    energy: Math.random() * 100,
    danceability: Math.random() * 100,
    acousticness: Math.random() * 100,
    valence: Math.random() * 100,
    liveness: Math.random() * 100,
    speechiness: Math.random() * 100,
    bpm: Math.floor(Math.random() * 180) + 60,
  };
}

function generateTracks(): Track[] {
  return TRACKS_POOL.map((track, idx) => ({
    id: generateRandomId(),
    name: track.name,
    artist: track.artist,
    artistId: generateRandomId(),
    album: track.album,
    albumArt: `https://via.placeholder.com/300x300?text=${encodeURIComponent(track.name)}`,
    duration: Math.floor(Math.random() * 180) + 120,
    playCount: Math.floor(Math.random() * 500) + 50,
    hoursListened: Math.floor(Math.random() * 100) + 10,
    moodScore: Math.floor(Math.random() * 40) + 50,
    releaseDate: new Date(
      2020 + Math.floor(idx / 5),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1,
    ).toISOString(),
    popularity: Math.floor(Math.random() * 40) + 60,
    audioFeatures: generateAudioFeatures(),
    addedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    isUnderrated: Math.random() > 0.7,
  }));
}

function generateArtists(): Artist[] {
  return ARTISTS_POOL.map((artist) => ({
    id: generateRandomId(),
    name: artist.name,
    image: artist.image,
    genre: artist.genres,
    totalPlaytime: Math.floor(Math.random() * 1000) + 100,
    trackCount: Math.floor(Math.random() * 50) + 5,
    followerCount: Math.floor(Math.random() * 10000000) + 1000000,
    popularity: artist.popularity,
    loyaltyScore: Math.floor(Math.random() * 40) + 50,
    firstListenedAt: new Date(
      Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000,
    ),
  }));
}

function generateListeningHeatmap(): {
  hour: number;
  count: number;
  topTrack?: string;
}[] {
  const heatmap = [];
  for (let i = 0; i < 24; i++) {
    heatmap.push({
      hour: i,
      count: Math.floor(Math.random() * 100) + 10,
      topTrack:
        TRACKS_POOL[Math.floor(Math.random() * TRACKS_POOL.length)].name,
    });
  }
  return heatmap;
}

function generateWeeklyHeatmap(): number[][] {
  const heatmap: number[][] = [];
  for (let week = 0; week < 52; week++) {
    const weekData: number[] = [];
    for (let day = 0; day < 7; day++) {
      weekData.push(Math.floor(Math.random() * 100));
    }
    heatmap.push(weekData);
  }
  return heatmap;
}

function generateMoodTimeline(): {
  month: string;
  valence: number;
  topTrack?: string;
}[] {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.map((month, idx) => ({
    month,
    valence:
      Math.sin((idx / 12) * Math.PI * 2) * 30 + 50 + Math.random() * 20 - 10,
    topTrack: TRACKS_POOL[Math.floor(Math.random() * TRACKS_POOL.length)].name,
  }));
}

function generateGenres(): Map<string, { count: number; hours: number }> {
  const genres = new Map();
  const genreNames = [
    "Hip-Hop",
    "Rock",
    "Electronic",
    "Pop",
    "R&B",
    "Indie",
    "Jazz",
    "Soul",
    "Alternative",
    "Synthwave",
  ];

  genreNames.forEach((genre) => {
    genres.set(genre, {
      count: Math.floor(Math.random() * 500) + 50,
      hours: Math.floor(Math.random() * 200) + 20,
    });
  });

  return genres;
}

function generateDiscoveries(): { month: string; newArtists: number }[] {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.map((month) => ({
    month,
    newArtists: Math.floor(Math.random() * 15) + 3,
  }));
}

function generatePersonality() {
  return {
    energy: Math.random() * 100,
    danceability: Math.random() * 100,
    acousticness: Math.random() * 100,
    valence: Math.random() * 100,
    liveness: Math.random() * 100,
    speechiness: Math.random() * 100,
  };
}

function generateArchetype(personality: Record<string, number>): {
  name: string;
  description: string;
} {
  const { energy, danceability, valence, acousticness } = personality;

  let archetype = "The Midnight Wanderer";
  let description =
    "You're a nocturnal music explorer, drawn to introspective and atmospheric sounds.";

  if (energy > 70 && danceability > 70) {
    archetype = "The Hype Machine";
    description =
      "You live for the beat. High energy, always moving, you're the life of every party.";
  } else if (acousticness > 70) {
    archetype = "The Indie Purist";
    description =
      "Raw, authentic, and unpolished—you appreciate music in its most genuine form.";
  } else if (valence > 75 && energy > 60) {
    archetype = "The Euphoric Optimist";
    description =
      "You believe in the transformative power of uplifting melodies and positive vibes.";
  } else if (energy < 40) {
    archetype = "The Nocturnal Dreamweaver";
    description =
      "Late nights, headphones on, lost in the ethereal soundscapes of your mind.";
  } else if (danceability > 75) {
    archetype = "The Groove Seeker";
    description =
      "Rhythm is your religion. Every beat moves you, every groove speaks to your soul.";
  }

  return { name: archetype, description };
}

export function generateMockUserProfile(): UserProfile {
  const topTracks = generateTracks();
  const topArtists = generateArtists();
  const personality = generatePersonality();
  const { name, description } = generateArchetype(personality);

  return {
    id: generateRandomId(),
    displayName: "Jordan Artist",
    avatar: "https://i.scdn.co/image/ab6761610000f17809c7dd2e2c4d1f2f3f4f5f6f",
    topTracks: topTracks.sort((a, b) => b.playCount - a.playCount).slice(0, 20),
    topArtists: topArtists
      .sort((a, b) => b.totalPlaytime - a.totalPlaytime)
      .slice(0, 10),
    totalMinutesListened: Math.floor(Math.random() * 100000) + 50000,
    artistsDiscovered: Math.floor(Math.random() * 500) + 100,
    listeningStreak: Math.floor(Math.random() * 365) + 30,
    personality,
    listenerArchetype: name,
    archetypeDescription: description,
    currentlyPlaying: topTracks[0] || null,
    listeningHistory: generateListeningHeatmap(),
    weeklyHeatmap: generateWeeklyHeatmap(),
    moodTimeline: generateMoodTimeline(),
    genres: generateGenres(),
    discoveries: generateDiscoveries(),
  };
}

export function generateComparison() {
  return {
    user1: generateMockUserProfile(),
    user2: generateMockUserProfile(),
  };
}

// Calculate compatibility score
export function calculateCompatibility(
  user1Personality: Record<string, number>,
  user2Personality: Record<string, number>,
): number {
  let score = 0;
  let count = 0;

  Object.keys(user1Personality).forEach((key) => {
    const diff = Math.abs(user1Personality[key] - user2Personality[key]);
    score += Math.max(0, 100 - diff);
    count++;
  });

  return Math.round(score / count);
}
