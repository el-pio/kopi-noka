import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  let jobs = dbStore.getPrintJobs();

  if (type) {
    jobs = jobs.filter(j => j.printerType === type);
  }

  return NextResponse.json({ success: true, data: jobs });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID wajib diisi' }, { status: 400 });
    }

    await dbStore.markPrintJobCompleted(jobId);
    return NextResponse.json({ success: true, message: 'Status pekerjaan cetak berhasil diperbarui' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
