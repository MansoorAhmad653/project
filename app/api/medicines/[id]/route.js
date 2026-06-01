import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const medicineId = parseInt(id, 10);

    if (isNaN(medicineId)) {
      return NextResponse.json(
        { error: 'Invalid medicine ID' },
        { status: 400 }
      );
    }

    // Fetch medicine with category
    const medicineResult = await query(
      `SELECT m.id, m.name, m.price, m.stock_quantity, m.description, m.image,
              m.requires_prescription, m.manufacturer, m.dosage, m.created_at, m.updated_at, m.is_active,
              c.id as category_id, c.name as category_name, c.slug as category_slug
       FROM shop_medicine m
       LEFT JOIN shop_category c ON m.category_id = c.id
       WHERE m.id = $1`,
      [medicineId]
    );

    if (medicineResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Medicine not found' },
        { status: 404 }
      );
    }

    const medicine = medicineResult.rows[0];

    // Fetch reviews
    const reviewsResult = await query(
      `SELECT f.id, f.rating, f.comment, f.created_at,
              u.id as user_id, u.name as user_name, u.email as user_email
       FROM feedback_feedback f
       JOIN users_customuser u ON f.user_id = u.id
       WHERE f.medicine_id = $1
       ORDER BY f.created_at DESC`,
      [medicineId]
    );

    const reviews = reviewsResult.rows;

    // Calculate average rating
    let avgRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = parseFloat((sum / reviews.length).toFixed(1));
    }

    // Check prescription status for logged-in user
    let canBuy = true;
    let prescriptionStatus = null;

    if (medicine.requires_prescription) {
      const user = await getCurrentUser(request);

      if (!user) {
        canBuy = false;
        prescriptionStatus = 'login_required';
      } else {
        // Check if user has an approved prescription for this medicine
        const prescResult = await query(
          `SELECT p.id, p.status
           FROM prescriptions_prescription p
           JOIN prescriptions_prescription_medicines pm ON p.id = pm.prescription_id
           WHERE p.user_id = $1 AND pm.medicine_id = $2
           ORDER BY p.uploaded_at DESC
           LIMIT 1`,
          [user.id, medicineId]
        );

        if (prescResult.rowCount === 0) {
          canBuy = false;
          prescriptionStatus = 'not_uploaded';
        } else {
          const presc = prescResult.rows[0];
          prescriptionStatus = presc.status;
          canBuy = presc.status === 'approved';
        }
      }
    }

    return NextResponse.json({
      medicine,
      reviews,
      avg_rating: avgRating,
      can_buy: canBuy,
      prescription_status: prescriptionStatus,
    });
  } catch (error) {
    console.error('Get medicine detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
