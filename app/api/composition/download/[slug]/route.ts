import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { zipSync } from 'fflate';
import { createSupabaseAdminClient } from '@/utils/supabase/base';
import { ANON_COOKIE_NAME } from '@/lib/constants';

export const runtime = 'nodejs';

const TAG = '[/api/composition/download]';
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

function safeFileName(name: string, fallback: string): string {
  const base = name.split(/[\\/]/).pop()?.trim() ?? '';
  const cleaned = base.replace(/[^\w.\- ]+/g, '_');
  return cleaned.length ? cleaned : fallback;
}

function extFromUrl(url: string, fallback: string): string {
  try {
    const match = new URL(url).pathname.match(/\.([a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : fallback;
  } catch {
    return fallback;
  }
}

async function fetchBytes(url: string, label: string): Promise<Uint8Array> {
  console.info(`${TAG} fetching ${label}`, { url });
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`${label} upstream responded ${res.status}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  console.info(`${TAG} fetched ${label}`, { bytes: bytes.byteLength });
  return bytes;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  console.info(`${TAG} start`, { slug });

  const supabase = createSupabaseAdminClient();

  console.info(`${TAG} looking up composition`, { slug });
  const { data: composition, error } = await supabase
    .from('compositions')
    .select('id, slug, title, audio_file_url, terms_file_url, audio_file_name')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error || !composition) {
    console.error(`${TAG} composition not found`, { slug, error: error?.message });
    return NextResponse.json({ ok: false, error: 'Loop not found.' }, { status: 404 });
  }
  console.info(`${TAG} composition found`, { id: composition.id, title: composition.title });

  let audioBytes: Uint8Array;
  let termsBytes: Uint8Array;
  try {
    [audioBytes, termsBytes] = await Promise.all([
      fetchBytes(composition.audio_file_url, 'audio'),
      fetchBytes(composition.terms_file_url, 'terms'),
    ]);
  } catch (err) {
    console.error(`${TAG} upstream fetch failed`, err);
    return NextResponse.json(
      { ok: false, error: 'Could not assemble the download right now.' },
      { status: 502 },
    );
  }

  const totalBytes = audioBytes.byteLength + termsBytes.byteLength;
  if (totalBytes > MAX_TOTAL_BYTES) {
    console.error(`${TAG} payload too large`, { totalBytes, max: MAX_TOTAL_BYTES });
    return NextResponse.json(
      { ok: false, error: 'This download is too large to serve.' },
      { status: 413 },
    );
  }

  const audioExt = extFromUrl(composition.audio_file_url, 'wav');
  const termsExt = extFromUrl(composition.terms_file_url, 'txt');
  const audioName = composition.audio_file_name
    ? safeFileName(composition.audio_file_name, `${slug}.${audioExt}`)
    : `${slug}.${audioExt}`;
  const folder = slug.replace(/[^\w-]/g, '') || 'loop';

  console.info(`${TAG} zipping`, { folder, audioName, termsExt, totalBytes });
  const zipped = zipSync(
    {
      [`${folder}/${audioName}`]: audioBytes,
      [`${folder}/Terms of Use.${termsExt}`]: termsBytes,
    },
    { level: 6 },
  );
  console.info(`${TAG} zip ready`, { zipBytes: zipped.byteLength });

  try {
    const jar = await cookies();
    const anonToken = jar.get(ANON_COOKIE_NAME)?.value ?? null;
    await supabase.from('composition_downloads').insert({
      composition_id: composition.id,
      anon_token: anonToken,
      referrer: req.headers.get('referer'),
    });
    console.info(`${TAG} logged download`, {
      compositionId: composition.id,
      hasAnonToken: Boolean(anonToken),
    });
  } catch (err) {
    console.error(`${TAG} download-log insert failed (non-fatal)`, err);
  }

  console.info(`${TAG} responding with zip`, { filename: `${folder}.zip` });
  return new NextResponse(zipped, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${folder}.zip"`,
      'Content-Length': String(zipped.byteLength),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
