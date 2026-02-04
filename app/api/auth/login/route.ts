import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getMongoDb } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    // Validate required fields
    if (!userId || !password) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields: !userId ? ['userId'] : ['password'],
        },
        { status: 400 }
      );
    }

    // Find user by userId using MongoDB
    const db = await getMongoDb();
    const user = await db.collection('users').findOne({
      userId: userId.trim(),
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 401 });
    }

    // Check if user has admin, manager, or staff role
    if (user.role !== 'Admin' && user.role !== 'Manager' && user.role !== 'Staff') {
      return NextResponse.json(
        { error: 'Access denied. Admin, Manager, or Staff role required' },
        { status: 403 }
      );
    }

    // Check if user has a password set
    if (!user.password) {
      return NextResponse.json(
        { error: 'Password not set for this account. Please set a password first.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.userId,
      id: user._id.toString(),
      role: user.role,
      displayName: user.displayName,
    });

    // Return user data (without password) and token
    return NextResponse.json({
      token,
      user: {
        _id: user._id.toString(),
        id: user._id.toString(),
        userId: user.userId,
        displayName: user.displayName,
        email: user.email || undefined,
        phone: user.phone || undefined,
        role: user.role.toLowerCase(),
        isActive: user.isActive,
        createdAt:
          user.createdAt instanceof Date
            ? user.createdAt.toISOString()
            : new Date(user.createdAt).toISOString(),
        updatedAt:
          user.updatedAt instanceof Date
            ? user.updatedAt.toISOString()
            : new Date(user.updatedAt).toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('Error during login:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to authenticate',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

