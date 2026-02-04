import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db';

// PATCH /api/orders/:id/status - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    if (!status || !['Received', 'Preparing', 'Ready', 'Completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Use native MongoDB driver for writes
    const db = await getMongoDb();
    const orderObjectId = new ObjectId(id);

    const result = await db.collection('orders').findOneAndUpdate(
      { _id: orderObjectId },
      {
        $set: {
          status: status,
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
      items: orderItems.map((item) => ({
        itemId: item.itemId.toString(),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: result.total,
      status: result.status,
      createdAt:
        result.createdAt instanceof Date
          ? result.createdAt.toISOString()
          : new Date(result.createdAt).toISOString(),
      updatedAt:
        result.updatedAt instanceof Date
          ? result.updatedAt.toISOString()
          : new Date(result.updatedAt).toISOString(),
    };

    return NextResponse.json(transformedOrder);
  } catch (error: unknown) {
    console.error('Error updating order status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to update order status',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

