import { auth } from '@/lib/auth';
import { getUserByEmail, getComplianceHistory } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (user.plan === 'free' || !user.plan) {
    return NextResponse.json({ error: 'Upgrade to Pro to export compliance data' }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const history = await getComplianceHistory(user.id as string, {
    jurisdiction: params.get('jurisdiction') || undefined,
    documentType: params.get('documentType') || undefined,
    complianceAction: params.get('complianceAction') || undefined,
    limit: 10000,
  }) as any[];

  const csvHeader = 'timestamp,url,source,jurisdiction,document_type,compliance_action,importance,summary,changed_elements,reviewed_at,reviewed_by,review_note';
  const csvRows = history.map((row) => {
    const esc = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    return [
      row.checked_at || '',
      esc(row.url),
      esc(row.name),
      row.jurisdiction || '',
      row.document_type || '',
      row.compliance_action || '',
      row.importance ?? '',
      esc(row.summary),
      esc(row.changed_elements),
      row.reviewed_at || '',
      esc(row.reviewed_by),
      esc(row.review_note),
    ].join(',');
  });

  const csv = [csvHeader, ...csvRows].join('\n');
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=changebrief-compliance-audit-${date}.csv`,
    },
  });
}
