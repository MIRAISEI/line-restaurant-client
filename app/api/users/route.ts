import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db';

// GET /api/users - Get all users
export async function GET() {
  try {
    const db = await getMongoDb();

    // Get users from database
    const users = await db
      .collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Also aggregate order data to update stats
    const orders = await db
      .collection('orders')
      .find({})
      .project({ userId: 1, total: 1, createdAt: 1 })
      .toArray();

    // Calculate stats per user
    const userStats = new Map<
      string,
      { totalOrders: number; totalSpent: number; lastOrderDate?: Date }
    >();
    orders.forEach((order) => {
      if (!userStats.has(order.userId)) {
        userStats.set(order.userId, { totalOrders: 0, totalSpent: 0 });
      }
      const stats = userStats.get(order.userId)!;
      stats.totalOrders += 1;
      stats.totalSpent += order.total;
      const orderDate =
        order.createdAt instanceof Date
          ? order.createdAt
          : new Date(order.createdAt);
      if (!stats.lastOrderDate || orderDate > stats.lastOrderDate) {
        stats.lastOrderDate = orderDate;
      }
    });

    // Merge user data with stats
    const usersWithStats = users.map((user) => {
      const stats = userStats.get(user.userId) || { totalOrders: 0, totalSpent: 0 };
      return {
        _id: user._id.toString(),
        id: user._id.toString(),
        userId: user.userId,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        lastOrderDate: stats.lastOrderDate?.toISOString(),
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
    });

    return NextResponse.json(usersWithStats);
  } catch (error: unknown) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const { userId, displayName, email, phone, role } = await request.json();

    // Validate required fields
    if (!userId || !displayName) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields: !userId ? ['userId'] : ['displayName'],
        },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ userId });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this userId already exists' },
        { status: 409 }
      );
    }

    // Use native MongoDB driver for writes
    const now = new Date();
    const userData = {
      _id: new ObjectId(),
      userId: userId.trim(),
      displayName: displayName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      role: role || 'Customer',
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').insertOne(userData);

    // Convert for response
    const user = {
      _id: userData._id.toString(),
      id: userData._id.toString(),
      userId: userData.userId,
      displayName: userData.displayName,
      email: userData.email,
      phone: userData.phone,
      role: userData.role.toLowerCase(),
      totalOrders: userData.totalOrders,
      totalSpent: userData.totalSpent,
      lastOrderDate: null,
      createdAt: userData.createdAt.toISOString(),
      updatedAt: userData.updatedAt.toISOString(),
      isActive: userData.isActive,
    };

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

