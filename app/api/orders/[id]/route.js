import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Fetch order (only if it belongs to the user, or user is admin)
    const isAdmin = user.role === 'admin' || user.is_staff;
    const orderResult = await query(
      `SELECT o.id, o.user_id, o.delivery_address, o.phone, o.total_price, o.delivery_fee,
              o.status, o.notes, o.created_at, o.updated_at
       FROM orders_order o
       WHERE o.id = $1 ${isAdmin ? '' : 'AND o.user_id = $2'}`,
      isAdmin ? [orderId] : [orderId, user.id]
    );

    if (orderResult.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // Fetch order items
    const itemsResult = await query(
      `SELECT oi.id, oi.order_id, oi.quantity, oi.price,
              m.id as medicine_id, m.name as medicine_name, m.image as medicine_image,
              m.dosage as medicine_dosage
       FROM orders_orderitem oi
       JOIN shop_medicine m ON oi.medicine_id = m.id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [orderId]
    );

    order.items = itemsResult.rows;

    // Determine if order can be cancelled
    const nonCancellableStatuses = ['delivered', 'cancelled'];
    const createdAt = new Date(order.created_at);
    const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const canCancel = !nonCancellableStatuses.includes(order.status) && hoursSinceCreation <= 24;

    return NextResponse.json({ order, can_cancel: canCancel });
  } catch (error) {
    console.error('Get order detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const client = await pool.connect();
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Fetch the order with row lock
    const orderResult = await client.query(
      'SELECT id, user_id, status, created_at FROM orders_order WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [orderId, user.id]
    );

    if (orderResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // Check if order can be cancelled
    const nonCancellableStatuses = ['delivered', 'cancelled'];
    if (nonCancellableStatuses.includes(order.status)) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: `Cannot cancel an order with status "${order.status}"` },
        { status: 400 }
      );
    }

    const createdAt = new Date(order.created_at);
    const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Cannot cancel orders older than 24 hours' },
        { status: 400 }
      );
    }

    // Restore stock quantities
    const itemsResult = await client.query(
      'SELECT medicine_id, quantity FROM orders_orderitem WHERE order_id = $1',
      [orderId]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        'UPDATE shop_medicine SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, item.medicine_id]
      );
    }

    // Update order status
    await client.query(
      "UPDATE orders_order SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [orderId]
    );

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Cancel order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
