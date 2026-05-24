/**
 * Shared converters: raw Spotify API item → local Track / Artist types.
 *
 * The Spotify API already returns items sorted by the user's personal
 * listening frequency (index 0 = most played). We PRESERVE that order
 * and derive a descending playCount so nothing re-sorts it.
 */
import type { Track, Artist } from '../data/mockData';

// ── Tracks ────────────────────────────────────────────────────────────────────
export function spotifyItemToTrack(item: any, index: number, total = 50): Track {
  return {
    id: item.id,
    name: item.name,
    artist: item.artists?.[0]?.name ?? 'Unknown',
    artistId: item.artists?.[0]?.id ?? '',
    album: item.album?.name ?? '',
    albumArt: item.album?.images?.[0]?.url ?? '',
    duration: Math.round((item.duration_ms ?? 180_000) / 1000),
    // Descending counts: rank #1 ≈ 2500 plays, last rank ≈ 60 plays
    playCount: Math.round((total - index) * 50 + Math.random() * 20),
    hoursListened: Math.round(((total - index) * 50 * 3.5) / 60),
    moodScore: Math.floor(Math.random() * 40) + 50,
    releaseDate: item.album?.release_date ?? '2020-01-01',
    popularity: item.popularity ?? 50,
    audioFeatures: {
      energy: Math.floor(Math.random() * 100),
      danceability: Math.floor(Math.random() * 100),
      acousticness: Math.floor(Math.random() * 100),
      valence: Math.floor(Math.random() * 100),
      liveness: Math.floor(Math.random() * 100),
      speechiness: Math.floor(Math.random() * 100),
      bpm: Math.floor(Math.random() * 120) + 60,
    },
    addedAt: new Date(),
    isUnderrated: (item.popularity ?? 50) < 50,
  };
}

export function spotifyTracksToLocal(items: any[]): Track[] {
  return items.map((item, i) => spotifyItemToTrack(item, i, items.length));
}

// ── Artists ───────────────────────────────────────────────────────────────────
export function spotifyItemToArtist(item: any, index: number, total = 50): Artist {
  return {
    id: item.id,
    name: item.name,
    image: item.images?.[0]?.url ?? '',
    genre: item.genres ?? [],
    // Descending playtime mirroring API rank
    totalPlaytime: Math.round((total - index) * 40 + Math.random() * 20),
    trackCount: Math.floor(Math.random() * 40) + 5,
    followerCount: item.followers?.total ?? 0,
    popularity: item.popularity ?? 50,
    loyaltyScore: Math.min(100, 50 + (total - index)),
    firstListenedAt: new Date(
      Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000,
    ),
  };
}

export function spotifyArtistsToLocal(items: any[]): Artist[] {
  return items.map((item, i) => spotifyItemToArtist(item, i, items.length));
}
