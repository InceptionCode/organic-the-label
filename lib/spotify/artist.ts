const TAG = "[spotify/artist]";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

export type SpotifyArtist = {
  id: string;
  name: string;
  imageUrl: string | null;
  followers: number;
  genres: string[];
  popularity: number;
  spotifyUrl: string;
};

export type SpotifyTrackMeta = {
  id: string;
  name: string;
  artistName: string;
  albumImageUrl: string | null;
  spotifyUrl: string;
};

export type SpotifyRelease = {
  id: string;
  name: string;
  imageUrl: string | null;
  releaseDate: string;
  releaseYear: string;
  albumType: "album" | "single" | "compilation";
  totalTracks: number;
  spotifyUrl: string;
};

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

function credentials(): { id: string; secret: string } | null {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;
  return { id, secret };
}

async function getAccessToken(): Promise<string | null> {
  const creds = credentials();
  if (!creds) {
    console.warn(`${TAG} missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET`);
    return null;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  console.info(`${TAG} requesting access token`);
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${creds.id}:${creds.secret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      console.error(`${TAG} token request failed`, res.status);
      return null;
    }

    const json = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      value: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    console.info(`${TAG} token acquired`, { expiresInSec: json.expires_in });
    return cachedToken.value;
  } catch (err) {
    console.error(`${TAG} token request threw`, err);
    return null;
  }
}

async function spotifyGet<T>(path: string): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`${TAG} GET ${path} failed`, res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`${TAG} GET ${path} threw`, err);
    return null;
  }
}

export async function getSpotifyArtist(artistId: string): Promise<SpotifyArtist | null> {
  if (!artistId) return null;
  console.info(`${TAG} fetching artist`, { artistId });

  const data = await spotifyGet<{
    id: string;
    name: string;
    images: { url: string; width: number }[];
    followers: { total: number };
    genres: string[];
    popularity: number;
    external_urls: { spotify: string };
  }>(`/artists/${artistId}`);

  if (!data) return null;

  const image =
    [...data.images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null;

  console.info(`${TAG} artist resolved`, { name: data.name, hasImage: Boolean(image) });

  return {
    id: data.id,
    name: data.name,
    imageUrl: image,
    followers: data.followers?.total ?? 0,
    genres: data.genres ?? [],
    popularity: data.popularity ?? 0,
    spotifyUrl: data.external_urls?.spotify ?? `https://open.spotify.com/artist/${data.id}`,
  };
}

export async function getSpotifyTrack(trackId: string): Promise<SpotifyTrackMeta | null> {
  if (!trackId) return null;
  console.info(`${TAG} fetching track`, { trackId });

  const data = await spotifyGet<{
    id: string;
    name: string;
    artists: { name: string }[];
    external_urls: { spotify: string };
    album: { images: { url: string; width: number }[] };
  }>(`/tracks/${trackId}`);

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    artistName: data.artists?.[0]?.name ?? "",
    albumImageUrl:
      [...(data.album?.images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null,
    spotifyUrl: data.external_urls?.spotify ?? `https://open.spotify.com/track/${data.id}`,
  };
}

export async function getSpotifyArtistReleases(
  artistId: string,
  market = "US",
  limit = 8,
): Promise<SpotifyRelease[]> {
  if (!artistId) return [];
  console.info(`${TAG} fetching releases`, { artistId, market, limit });

  const data = await spotifyGet<{
    items: {
      id: string;
      name: string;
      album_type: "album" | "single" | "compilation";
      release_date: string;
      total_tracks: number;
      images: { url: string; width: number }[];
      external_urls: { spotify: string };
    }[];
  }>(`/artists/${artistId}/albums?include_groups=single,album&market=${market}&limit=${limit}`);

  if (!data?.items) return [];

  // Spotify returns near-duplicate entries (deluxe / re-release); keep the first per name.
  const seen = new Set<string>();
  const releases = data.items
    .filter((item) => {
      const key = item.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl:
        [...(item.images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null,
      releaseDate: item.release_date,
      releaseYear: (item.release_date ?? "").slice(0, 4),
      albumType: item.album_type,
      totalTracks: item.total_tracks ?? 0,
      spotifyUrl: item.external_urls?.spotify ?? "",
    }))
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  console.info(`${TAG} releases resolved`, { count: releases.length });
  return releases;
}
