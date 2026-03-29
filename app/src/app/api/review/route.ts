import { auth } from '@/lib/auth';
import { getUserByEmail, markChangeReviewed, markAllChangesReviewed, updateReviewNote } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const reviewedBy = body.reviewedBy || session.user.email;

  if (body.all) {
    await markAllChangesReviewed(user.id as string, reviewedBy);
    return NextResponse.json({ ok: true });
  }

  const changeId = body.changeId;
  if (!changeId) return NextResponse.json({ error: 'changeId required' }, { status: 400 });

  await markChangeReviewed(user.id as string, changeId, reviewedBy, body.reviewNote);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  if (!body.changeId || typeof body.reviewNote !== 'string') {
    return NextResponse.json({ error: 'changeId and reviewNote required' }, { status: 400 });
  }

  await updateReviewNote(user.id as string, body.changeId, body.reviewNote);
  return NextResponse.json({ ok: true });
}
