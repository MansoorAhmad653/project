import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const STATUS_CHOICES = ['confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'];

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.role !== 'admin' && !user.is_staff) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Total orders
    const totalOrdersResult = await query('SELECT COUNT(*) as count FROM orders_order');
    const totalOrders = parseInt(totalOrdersResult.rows[0].count, 10);

    // Total revenue (exclude cancelled orders)
    const revenueResult = await query(
      "SELECT COALESCE(SUM(total_price), 0) as revenue FROM orders_order WHERE status != 'cancelled'"
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].revenue);

    // Pending prescriptions
    const pendingPrescResult = await query(
      "SELECT COUNT(*) as count FROM prescriptions_prescription WHERE status = 'pending'"
    );
    const pendingPrescriptions = parseInt(pendingPrescResult.rows[0].count, 10);

    // Low stock medicines (stock <= 10)
    const lowStockResult = await query(
      'SELECT COUNT(*) as count FROM shop_medicine WHERE stock_quantity <= 10 AND is_active = true'
    );
    const lowStock = parseInt(lowStockResult.rows[0].count, 10);

    // Total customers
    const totalUsersResult = await query(
      "SELECT COUNT(*) as count FROM users_customuser WHERE role = 'customer'"
    );
    const totalUsers = parseInt(totalUsersResult.rows[0].count, 10);

    // Recent orders (last 20 with user email)
    const recentOrdersResult = await query(
      `SELECT o.id, o.total_price, o.status, o.created_at, o.delivery_address,
              u.email as user_email, u.name as user_name
       FROM orders_order o
       JOIN users_customuser u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 20`
    );
    const recentOrders = recentOrdersResult.rows;

    // Medicines (first 20 with category, ordered by stock ascending)
    const medicinesResult = await query(
      `SELECT m.id, m.name, m.price, m.stock_quantity, m.is_active, m.image,
              c.name as category_name
       FROM shop_medicine m
       LEFT JOIN shop_category c ON m.category_id = c.id
       ORDER BY m.stock_quantity ASC
       LIMIT 20`
    );
    const medicines = medicinesResult.rows;

    // Weekly order data (last 7 days)
    const weekLabels = [];
    const weekData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayAbbr = dayNames[date.getDay()];
      weekLabels.push(dayAbbr);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrdersResult = await query(
        'SELECT COUNT(*) as count FROM orders_order WHERE created_at >= $1 AND created_at <= $2',
        [dayStart.toISOString(), dayEnd.toISOString()]
      );
      weekData.push(parseInt(dayOrdersResult.rows[0].count, 10));
    }

    return NextResponse.json({
      total_orders: totalOrders,
      total_revenue: totalRevenue,
      pending_prescriptions: pendingPrescriptions,
      low_stock: lowStock,
      total_users: totalUsers,
      recent_orders: recentOrders,
      medicines,
      week_labels: weekLabels,
      week_data: weekData,
      status_choices: STATUS_CHOICES,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.role !== 'admin' && !user.is_staff) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json(
        { error: 'order_id and status are required' },
        { status: 400 }
      );
    }

    if (!STATUS_CHOICES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${STATUS_CHOICES.join(', ')}` },
        { status: 400 }
      );
    }

    const orderResult = await query(
      'SELECT id, status FROM orders_order WHERE id = $1',
      [order_id]
    );

    if (orderResult.rowCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await query(
      'UPDATE orders_order SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, order_id]
    );

    return NextResponse.json({
      message: `Order #${order_id} status updated to "${status}"`,
      order_id,
      status,
    });
  } catch (error) {
    console.error('Dashboard update order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
