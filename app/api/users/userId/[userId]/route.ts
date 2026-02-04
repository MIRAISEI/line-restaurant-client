import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';

// GET /api/users/userId/:userId - Get user by userId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const db = await getMongoDb();
    const user = await db.collection('users').findOne({
      userId: userId.trim(),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get order stats
    const orders = await db
      .collection('orders')
      .find({ userId: user.userId })
      .project({ total: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const lastOrderDate = orders[0]?.createdAt || null;

    // Transform to match frontend format
    const userWithStats = {
      _id: user._id.toString(),
      id: user._id.toString(),
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      role: user.role.toLowerCase(),
      totalOrders,
      totalSpent,
      lastOrderDate: lastOrderDate
        ? lastOrderDate instanceof Date
          ? lastOrderDate.toISOString()
          : new Date(lastOrderDate).toISOString()
        : undefined,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : new Date(user.createdAt).toISOString(),
      updatedAt:
        user.updatedAt instanceof Date
          ? user.updatedAt.toISOString()
          : new Date(user.updatedAt).toISOString(),
      isActive: user.isActive,
    };

    return NextResponse.json(userWithStats);
  } catch (error: unknown) {
    console.error('Error fetching user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch user',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

