import { auth } from '@/lib/auth';
import { getUserByEmail, getWatchedUrls, addWatchedUrl, removeWatchedUrl, countWatchedUrls, getUrlLimit, muteUrl } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const urls = await getWatchedUrls(user.id as string);
  return NextResponse.json(urls);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const count = await countWatchedUrls(user.id as string);
  const limit = getUrlLimit(user.plan as string);
  if (count >= limit) {
    return NextResponse.json({ error: `Plan limit reached (${limit} URLs)` }, { status: 403 });
  }

  const body = await req.json();
  const { url, name, threshold, selector, mobile, minImportance, cookies, headers, webhookUrl } = body;

  if (!url || !name) {
    return NextResponse.json({ error: 'url and name required' }, { status: 400 });
  }

  try {
    await addWatchedUrl(user.id as string, url, name, { threshold, selector, mobile, minImportance, cookies, headers, webhookUrl });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'URL already watched' }, { status: 409 });
    }
    throw e;
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const { id, muted } = body;

  if (typeof id !== 'number' || typeof muted !== 'boolean') {
    return NextResponse.json({ error: 'id (number) and muted (boolean) required' }, { status: 400 });
  }

  await muteUrl(user.id as string, id, muted);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await removeWatchedUrl(user.id as string, parseInt(id));
  return NextResponse.json({ ok: true });
}
