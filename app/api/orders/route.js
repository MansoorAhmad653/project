import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import pool from '@/lib/db';

const DELIVERY_FEE = 150;

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const ordersResult = await query(
      `SELECT o.id, o.delivery_address, o.phone, o.total_price, o.delivery_fee,
              o.status, o.notes, o.created_at, o.updated_at
       FROM orders_order o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [user.id]
    );

    const orders = ordersResult.rows;

    // Fetch items for all orders
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const itemsResult = await query(
        `SELECT oi.id, oi.order_id, oi.quantity, oi.price,
                m.id as medicine_id, m.name as medicine_name, m.image as medicine_image
         FROM orders_orderitem oi
         JOIN shop_medicine m ON oi.medicine_id = m.id
         WHERE oi.order_id = ANY($1)
         ORDER BY oi.id`,
        [orderIds]
      );

      const itemsByOrder = {};
      for (const item of itemsResult.rows) {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }
        itemsByOrder[item.order_id].push(item);
      }

      for (const order of orders) {
        order.items = itemsByOrder[order.id] || [];
      }
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await pool.connect();
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { delivery_address, phone, items, notes } = body;

    if (!delivery_address || !phone) {
      return NextResponse.json(
        { error: 'Delivery address and phone are required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Validate and fetch medicine prices + stock
    const medicineIds = items.map((item) => item.medicine_id);
    const medicinesResult = await client.query(
      `SELECT id, name, price, stock_quantity, requires_prescription, is_active
       FROM shop_medicine
       WHERE id = ANY($1)
       FOR UPDATE`,
      [medicineIds]
    );

    const medicineMap = {};
    for (const med of medicinesResult.rows) {
      medicineMap[med.id] = med;
    }

    // Validate each item
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const medicine = medicineMap[item.medicine_id];
      if (!medicine) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `Medicine with ID ${item.medicine_id} not found` },
          { status: 400 }
        );
      }

      if (!medicine.is_active) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `${medicine.name} is no longer available` },
          { status: 400 }
        );
      }

      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `Invalid quantity for ${medicine.name}` },
          { status: 400 }
        );
      }

      if (qty > medicine.stock_quantity) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock_quantity}` },
          { status: 400 }
        );
      }

      const itemPrice = parseFloat(medicine.price);
      subtotal += itemPrice * qty;

      validatedItems.push({
        medicine_id: medicine.id,
        quantity: qty,
        price: itemPrice,
      });
    }

    const totalPrice = subtotal + DELIVERY_FEE;

    // Create the order
    const orderResult = await client.query(
      `INSERT INTO orders_order (user_id, delivery_address, phone, total_price, delivery_fee, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, NOW(), NOW())
       RETURNING id, delivery_address, phone, total_price, delivery_fee, status, notes, created_at`,
      [user.id, delivery_address, phone, totalPrice, DELIVERY_FEE, notes || '']
    );

    const order = orderResult.rows[0];

    // Create order items and deduct stock
    const orderItems = [];
    for (const vi of validatedItems) {
      const itemResult = await client.query(
        `INSERT INTO orders_orderitem (order_id, medicine_id, quantity, price)
         VALUES ($1, $2, $3, $4)
         RETURNING id, order_id, medicine_id, quantity, price`,
        [order.id, vi.medicine_id, vi.quantity, vi.price]
      );
      orderItems.push(itemResult.rows[0]);

      await client.query(
        'UPDATE shop_medicine SET stock_quantity = stock_quantity - $1, updated_at = NOW() WHERE id = $2',
        [vi.quantity, vi.medicine_id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        message: 'Order placed successfully',
        order: {
          ...order,
          items: orderItems,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
