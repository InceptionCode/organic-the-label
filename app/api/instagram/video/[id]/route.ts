/**
 * Streams an Instagram post's video through our own origin.
 *
 * Why a proxy instead of pointing <video> straight at `media_url`:
 *  - Instagram's CDN (*.cdninstagram.com / *.fbcdn.net) rejects cross-origin
 *    media requests, so a browser <video> loading it directly gets a 403.
 *  - `media_url` is a signed URL that expires within hours; resolving it here at
 *    playback time means the page never serves a dead link.
 *
 * Range requests are forwarded so the player can seek.
 */

import { NextResponse } from "next/server";
import { getInstagramVideoUrl } from "@/lib/instagram/media";

const TAG = "[/api/instagram/video]";
const ID_PATTERN = /^\d+(_\d+)?$/;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!ID_PATTERN.test(id)) {
    return NextResponse.json({ ok: false, error: "Invalid media id." }, { status: 400 });
  }

  const videoUrl = await getInstagramVideoUrl(id);
  if (!videoUrl) {
    console.warn(`${TAG} no video url for media`, { id });
    return NextResponse.json({ ok: false, error: "No video for this post." }, { status: 404 });
  }

  const range = req.headers.get("range");

  let upstream: Response;
  try {
    upstream = await fetch(videoUrl, {
      headers: range ? { Range: range } : undefined,
      redirect: "follow",
    });
  } catch (err) {
    console.error(`${TAG} upstream fetch threw`, { id, err });
    return NextResponse.json({ ok: false, error: "Video source unavailable." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    console.error(`${TAG} upstream responded`, { id, status: upstream.status });
    return NextResponse.json({ ok: false, error: "Video source unavailable." }, { status: 502 });
  }

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "video/mp4",
    "Accept-Ranges": "bytes",
    // Proxy path is stable per post; a short private cache smooths repeat plays
    // without holding a URL long enough to matter when the upstream rotates.
    "Cache-Control": "private, max-age=3600",
  });
  for (const h of ["content-length", "content-range", "etag", "last-modified"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
