import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, medicine_id, rating, comment } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    // Verify user owns the order if order_id is provided
    if (order_id) {
      const orderResult = await query(
        'SELECT id FROM orders_order WHERE id = $1 AND user_id = $2',
        [order_id, user.id]
      );

      if (orderResult.rowCount === 0) {
        return NextResponse.json(
          { error: 'Order not found or does not belong to you' },
          { status: 403 }
        );
      }
    }

    // Verify medicine exists if medicine_id is provided
    if (medicine_id) {
      const medResult = await query(
        'SELECT id FROM shop_medicine WHERE id = $1',
        [medicine_id]
      );

      if (medResult.rowCount === 0) {
        return NextResponse.json(
          { error: 'Medicine not found' },
          { status: 404 }
        );
      }
    }

    // Check for duplicate feedback
    if (order_id && medicine_id) {
      const duplicateCheck = await query(
        'SELECT id FROM feedback_feedback WHERE user_id = $1 AND order_id = $2 AND medicine_id = $3',
        [user.id, order_id, medicine_id]
      );

      if (duplicateCheck.rowCount > 0) {
        return NextResponse.json(
          { error: 'You have already submitted feedback for this medicine in this order' },
          { status: 409 }
        );
      }
    }

    const feedbackResult = await query(
      `INSERT INTO feedback_feedback (user_id, order_id, medicine_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, user_id, order_id, medicine_id, rating, comment, created_at`,
      [user.id, order_id || null, medicine_id || null, rating, comment.trim()]
    );

    return NextResponse.json(
      {
        message: 'Feedback submitted successfully',
        feedback: feedbackResult.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
