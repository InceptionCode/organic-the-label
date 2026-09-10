import { cacheLife } from "next/cache";
import {
  getSpotifyArtist,
  getSpotifyArtistReleases,
  getSpotifyTrack,
  type SpotifyArtist,
  type SpotifyRelease,
} from "@/lib/spotify/artist";
import { PLACEMENTS, SPOTIFY_ARTIST_ID, type Placement } from "./content";
import { spotifyTrackIdFromUrl } from "./embeds";

const TAG = "[work-with-me/spotify-data]";

export type EnrichedPlacement = Placement & {
  /** Cover art resolved from the Spotify track href, or null for the icon fallback. */
  artworkUrl: string | null;
};

export type WorkWithMeSpotify = {
  artist: SpotifyArtist | null;
  releases: SpotifyRelease[];
  placements: EnrichedPlacement[];
};

async function enrichPlacements(): Promise<EnrichedPlacement[]> {
  if (PLACEMENTS.length === 0) return [];
  console.info(`${TAG} enriching placements`, { count: PLACEMENTS.length });

  return Promise.all(
    PLACEMENTS.map(async (placement) => {
      const trackId = spotifyTrackIdFromUrl(placement.href ?? "");
      if (!trackId) return { ...placement, artworkUrl: null };
      const track = await getSpotifyTrack(trackId);
      return { ...placement, artworkUrl: track?.albumImageUrl ?? null };
    }),
  );
}

/**
 * One call for everything the Work With Me page pulls from Spotify. Returns a
 * stable shape even when the artist id or credentials are missing, so the page
 * can render entirely from hand-entered content as a fallback.
 */
export async function getWorkWithMeSpotify(): Promise<WorkWithMeSpotify> {
  "use cache";
  cacheLife("hours");

  const [artist, releases, placements] = await Promise.all([
    SPOTIFY_ARTIST_ID ? getSpotifyArtist(SPOTIFY_ARTIST_ID) : Promise.resolve(null),
    SPOTIFY_ARTIST_ID ? getSpotifyArtistReleases(SPOTIFY_ARTIST_ID) : Promise.resolve([]),
    enrichPlacements(),
  ]);

  console.info(`${TAG} loaded`, {
    hasArtist: Boolean(artist),
    releaseCount: releases.length,
    placementCount: placements.length,
  });

  return { artist, releases, placements };
}
