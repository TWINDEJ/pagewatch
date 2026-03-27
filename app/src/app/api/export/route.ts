import { auth } from '@/lib/auth';
import { getUserByEmail, getChangeHistory } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // CSV export is Pro+ only
  if (user.plan === 'free' || !user.plan) {
    return NextResponse.json({ error: 'Upgrade to Pro to export data' }, { status: 403 });
  }

  const history = await getChangeHistory(user.id as string, 10000) as any[];

  const csvHeader = 'date,url,name,importance,summary,change_percent';
  const csvRows = history.map((row) => {
    const date = row.checked_at || '';
    const url = `"${(row.url || '').replace(/"/g, '""')}"`;
    const name = `"${(row.name || '').replace(/"/g, '""')}"`;
    const importance = row.importance ?? '';
    const summary = `"${(row.summary || '').replace(/"/g, '""')}"`;
    const changePercent = row.change_percent != null ? Number(row.change_percent).toFixed(2) : '';
    return `${date},${url},${name},${importance},${summary},${changePercent}`;
  });

  const csv = [csvHeader, ...csvRows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=changebrief-export.csv',
    },
  });
}
