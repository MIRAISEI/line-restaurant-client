import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db';

// PATCH /api/orders/:id/payment - Process payment for an order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { paymentStatus } = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    if (!paymentStatus || !['pending', 'paid'].includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid payment status. Must be "pending" or "paid"' },
        { status: 400 }
      );
    }

    // Use native MongoDB driver for writes
    const db = await getMongoDb();
    const orderObjectId = new ObjectId(id);

    const result = await db.collection('orders').findOneAndUpdate(
      { _id: orderObjectId },
      {
        $set: {
          paymentStatus: paymentStatus,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items using native MongoDB driver
    const orderItems = await db
      .collection('order_items')
      .find({
        orderId: orderObjectId,
      })
      .toArray();

    // Transform to match frontend format
    const transformedOrder = {
      _id: result._id.toString(),
      id: result._id.toString(),
      orderId: result.orderId,
      userId: result.userId,
      displayName: result.displayName,
      tableNumber: result.tableNumber,
      lineUserId: result.lineUserId || undefined,
      paymentMethod: result.paymentMethod || 'manual',
      paymentStatus: result.paymentStatus || null,
      items: orderItems.map((item) => ({
        itemId: item.itemId.toString(),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        parentItemId: item.parentItemId ? item.parentItemId.toString() : undefined,
      })),
      total: result.total,
      status: result.status,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedOrder);
  } catch (error: unknown) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      {
        error: 'Failed to process payment',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined,
      },
      { status: 500 }
    );
  }
}

















