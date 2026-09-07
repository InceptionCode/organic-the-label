import { cacheLife } from "next/cache";
import {
  getSpotifyArtist,
  getSpotifyArtistReleases,
  type SpotifyArtist,
  type SpotifyRelease,
} from "@/lib/spotify/artist";
import { SPOTIFY_ARTIST_ID } from "./content";

const TAG = "[work-with-me/spotify-data]";

export type WorkWithMeSpotify = {
  artist: SpotifyArtist | null;
  releases: SpotifyRelease[];
};

/**
 * One call for everything the Work With Me page pulls from Spotify. Returns a
 * stable shape even when the artist id or credentials are missing, so the page
 * can render entirely from hand-entered content as a fallback.
 */
export async function getWorkWithMeSpotify(): Promise<WorkWithMeSpotify> {
  "use cache";
  cacheLife("hours");

  if (!SPOTIFY_ARTIST_ID) {
    console.info(`${TAG} SPOTIFY_ARTIST_ID not set — using content fallbacks`);
    return { artist: null, releases: [] };
  }

  console.info(`${TAG} loading`, { artistId: SPOTIFY_ARTIST_ID });
  const [artist, releases] = await Promise.all([
    getSpotifyArtist(SPOTIFY_ARTIST_ID),
    getSpotifyArtistReleases(SPOTIFY_ARTIST_ID),
  ]);

  console.info(`${TAG} loaded`, {
    hasArtist: Boolean(artist),
    releaseCount: releases.length,
  });

  return { artist, releases };
}
