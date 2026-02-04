import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db';

interface OrderItemDocument {
  itemId: ObjectId;
  name: string;
  quantity: number;
  price: number;
}

// GET /api/orders - Get all orders
export async function GET() {
  try {
    // Use native MongoDB driver for more reliable querying
    const db = await getMongoDb();

    // Fetch orders
    const orders = await db
      .collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch all order items
    const orderItemsMap = new Map();
    if (orders.length > 0) {
      const orderIds = orders.map((order) => order._id);
      const orderItems = await db
        .collection('order_items')
        .find({ orderId: { $in: orderIds } })
        .toArray();

      // Group items by orderId
      orderItems.forEach((item) => {
        const orderIdStr = item.orderId.toString();
        if (!orderItemsMap.has(orderIdStr)) {
          orderItemsMap.set(orderIdStr, []);
        }
        orderItemsMap.get(orderIdStr).push(item);
      });
    }

    // Transform to match frontend format
    const transformedOrders = orders.map((order) => {
      const orderIdStr = order._id.toString();
      const items = ((orderItemsMap.get(orderIdStr) || []) as OrderItemDocument[]).map((item) => ({
        itemId: item.itemId.toString(),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      return {
        _id: order._id.toString(),
        id: order._id.toString(),
        orderId: order.orderId,
        userId: order.userId,
        displayName: order.displayName,
        tableNumber: order.tableNumber,
        paymentMethod: order.paymentMethod || 'manual',
        paymentStatus: order.paymentStatus || null,
        items: items,
        total: order.total,
        status: order.status,
        createdAt:
          order.createdAt instanceof Date
            ? order.createdAt.toISOString()
            : new Date(order.createdAt).toISOString(),
        updatedAt:
          order.updatedAt instanceof Date
            ? order.updatedAt.toISOString()
            : new Date(order.updatedAt).toISOString(),
      };
    });

    return NextResponse.json(transformedOrders);
  } catch (error: unknown) {
    console.error('Error fetching orders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch orders',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

