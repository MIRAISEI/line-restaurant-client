import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db';

// GET /api/users/:id - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const db = await getMongoDb();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(id),
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
      lineUserId: user.lineUserId || undefined,
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

// PATCH /api/users/:id - Update user (role, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Use native MongoDB driver for writes
    const db = await getMongoDb();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.role !== undefined) {
      updateData.role =
        updates.role.charAt(0).toUpperCase() + updates.role.slice(1).toLowerCase();
    }
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }
    if (updates.displayName !== undefined) {
      updateData.displayName = updates.displayName.trim();
    }
    if (updates.email !== undefined) {
      updateData.email = updates.email?.trim() || null;
    }
    if (updates.phone !== undefined) {
      updateData.phone = updates.phone?.trim() || null;
    }

    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get order stats
    const orders = await db
      .collection('orders')
      .find({ userId: result.userId })
      .project({ total: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const lastOrderDate = orders[0]?.createdAt || null;

    // Transform to match frontend format
    const user = {
      _id: result._id.toString(),
      id: result._id.toString(),
      userId: result.userId,
      displayName: result.displayName,
      email: result.email,
      phone: result.phone,
      role: result.role.toLowerCase(),
      totalOrders,
      totalSpent,
      lastOrderDate: lastOrderDate
        ? lastOrderDate instanceof Date
          ? lastOrderDate.toISOString()
          : new Date(lastOrderDate).toISOString()
        : undefined,
      createdAt:
        result.createdAt instanceof Date
          ? result.createdAt.toISOString()
          : new Date(result.createdAt).toISOString(),
      updatedAt:
        result.updatedAt instanceof Date
          ? result.updatedAt.toISOString()
          : new Date(result.updatedAt).toISOString(),
      isActive: result.isActive,
      lineUserId: result.lineUserId || undefined,
    };

    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to update user',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/:id - Hard delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Use native MongoDB driver for writes
    const db = await getMongoDb();
    const result = await db.collection('users').findOneAndDelete({
      _id: new ObjectId(id),
    });

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

