import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const prescriptionId = parseInt(id, 10);
    if (isNaN(prescriptionId)) {
      return NextResponse.json({ error: 'Invalid prescription ID' }, { status: 400 });
    }

    // Check prescription exists, belongs to user, and is pending
    const prescResult = await query(
      'SELECT id, status FROM prescriptions_prescription WHERE id = $1 AND user_id = $2',
      [prescriptionId, user.id]
    );

    if (prescResult.rowCount === 0) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    const prescription = prescResult.rows[0];

    if (prescription.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot delete a prescription with status "${prescription.status}". Only pending prescriptions can be deleted.` },
        { status: 400 }
      );
    }

    // Delete associated medicines first (foreign key constraint)
    await query(
      'DELETE FROM prescriptions_prescription_medicines WHERE prescription_id = $1',
      [prescriptionId]
    );

    // Delete the prescription
    await query(
      'DELETE FROM prescriptions_prescription WHERE id = $1',
      [prescriptionId]
    );

    return NextResponse.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Delete prescription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
