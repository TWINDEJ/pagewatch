import { auth } from '@/lib/auth';
import { getUserByEmail, deleteChangeHistoryByUrl } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  await deleteChangeHistoryByUrl(user.id as string, url);
  return NextResponse.json({ ok: true });
}
