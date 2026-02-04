import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields: !userId ? ['userId'] : ['password'],
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find user
    const db = await getMongoDb();
    const user = await db.collection('users').findOne({
      userId: userId.trim(),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has admin, manager, or staff role
    if (user.role !== 'Admin' && user.role !== 'Manager' && user.role !== 'Staff') {
      return NextResponse.json(
        { error: 'Access denied. Admin, Manager, or Staff role required' },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await db.collection('users').updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ message: 'Password set successfully' });
  } catch (error: unknown) {
    console.error('Error setting password:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to set password',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

