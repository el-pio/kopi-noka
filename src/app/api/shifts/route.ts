import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const shifts = dbStore.getShifts();
  const sessions = dbStore.getShiftSessions();
  const users = dbStore.getUsers();

  const enrichedSessions = sessions.map(s => {
    const shift = shifts.find(sh => sh.id === s.shiftId);
    const cashier = users.find(u => u.id === s.cashierId);
    return {
      ...s,
      shiftName: shift?.name || 'Shift',
      cashierName: cashier?.name || 'Kasir',
    };
  }).reverse();

  return NextResponse.json({
    success: true,
    data: shifts,
    sessions: enrichedSessions,
  });
}

export async function PUT(request: NextRequest) {
  // Only Admin can configure shift hours
  const auth = requireAuth(request, ['ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { id, name, startTime, endTime } = body;

    if (!id || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'ID shift, jam mulai, dan jam selesai wajib diisi' },
        { status: 400 }
      );
    }

    const updated = await dbStore.updateShift(id, { name, startTime, endTime });
    if (!updated) {
      return NextResponse.json({ error: 'Shift tidak ditemukan' }, { status: 404 });
    }

    await dbStore.logAudit({
      userId: auth.user.id,
      action: 'SHIFT_SCHEDULE_UPDATED',
      entityType: 'shifts',
      entityId: id,
      details: JSON.stringify({ name, startTime, endTime }),
    });

    return NextResponse.json({
      success: true,
      message: 'Jadwal shift berhasil diperbarui',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
