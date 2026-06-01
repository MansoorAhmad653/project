import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const prescription = searchParams.get('prescription');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '12', 10)));

    const conditions = ['m.is_active = true'];
    const params = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(`(m.name ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex} OR m.manufacturer ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`c.slug = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (minPrice) {
      const minVal = parseFloat(minPrice);
      if (!isNaN(minVal)) {
        conditions.push(`m.price >= $${paramIndex}`);
        params.push(minVal);
        paramIndex++;
      }
    }

    if (maxPrice) {
      const maxVal = parseFloat(maxPrice);
      if (!isNaN(maxVal)) {
        conditions.push(`m.price <= $${paramIndex}`);
        params.push(maxVal);
        paramIndex++;
      }
    }

    if (prescription === 'yes') {
      conditions.push('m.requires_prescription = true');
    } else if (prescription === 'no') {
      conditions.push('m.requires_prescription = false');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM shop_medicine m
       LEFT JOIN shop_category c ON m.category_id = c.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / perPage);
    const offset = (page - 1) * perPage;

    // Fetch paginated results
    const medicinesResult = await query(
      `SELECT m.id, m.name, m.price, m.stock_quantity, m.description, m.image,
              m.requires_prescription, m.manufacturer, m.dosage, m.created_at,
              c.id as category_id, c.name as category_name, c.slug as category_slug
       FROM shop_medicine m
       LEFT JOIN shop_category c ON m.category_id = c.id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, perPage, offset]
    );

    return NextResponse.json({
      medicines: medicinesResult.rows,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
