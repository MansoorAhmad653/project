import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const prescriptionsResult = await query(
      `SELECT p.id, p.file, p.notes, p.status, p.admin_notes, p.uploaded_at, p.updated_at
       FROM prescriptions_prescription p
       WHERE p.user_id = $1
       ORDER BY p.uploaded_at DESC`,
      [user.id]
    );

    const prescriptions = prescriptionsResult.rows;

    // Fetch associated medicines for all prescriptions
    if (prescriptions.length > 0) {
      const prescriptionIds = prescriptions.map((p) => p.id);
      const medicinesResult = await query(
        `SELECT pm.prescription_id, m.id as medicine_id, m.name as medicine_name, m.image as medicine_image, m.price
         FROM prescriptions_prescription_medicines pm
         JOIN shop_medicine m ON pm.medicine_id = m.id
         WHERE pm.prescription_id = ANY($1)`,
        [prescriptionIds]
      );

      const medicinesByPrescription = {};
      for (const med of medicinesResult.rows) {
        if (!medicinesByPrescription[med.prescription_id]) {
          medicinesByPrescription[med.prescription_id] = [];
        }
        medicinesByPrescription[med.prescription_id].push(med);
      }

      for (const prescription of prescriptions) {
        prescription.medicines = medicinesByPrescription[prescription.id] || [];
      }
    }

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { file, notes, medicine_ids } = body;

    if (!file) {
      return NextResponse.json(
        { error: 'Prescription file is required' },
        { status: 400 }
      );
    }

    // Create the prescription
    const prescResult = await query(
      `INSERT INTO prescriptions_prescription (user_id, file, notes, status, admin_notes, uploaded_at, updated_at)
       VALUES ($1, $2, $3, 'pending', '', NOW(), NOW())
       RETURNING id, file, notes, status, uploaded_at`,
      [user.id, file, notes || '']
    );

    const prescription = prescResult.rows[0];

    // Associate medicines if provided
    if (medicine_ids && Array.isArray(medicine_ids) && medicine_ids.length > 0) {
      for (const medicineId of medicine_ids) {
        await query(
          'INSERT INTO prescriptions_prescription_medicines (prescription_id, medicine_id) VALUES ($1, $2)',
          [prescription.id, medicineId]
        );
      }
    }

    return NextResponse.json(
      {
        message: 'Prescription uploaded successfully',
        prescription,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create prescription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
