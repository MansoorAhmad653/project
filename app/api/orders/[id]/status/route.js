import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const VALID_STATUSES = ['confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'];

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Admin-only check
    if (user.role !== 'admin' && !user.is_staff) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Check order exists
    const orderResult = await query(
      'SELECT id, status FROM orders_order WHERE id = $1',
      [orderId]
    );

    if (orderResult.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status
    await query(
      'UPDATE orders_order SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, orderId]
    );

    return NextResponse.json({
      message: `Order status updated to "${status}"`,
      order_id: orderId,
      status,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
