import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db';
import { getAuthTokenFromHeader } from '@/lib/auth';

interface MenuItemDocument {
  _id: ObjectId;
  nameEn: string;
  nameJp: string;
  price: number;
  imageUrl: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/menu - Get menu items (all items for admin, only active for public)
export async function GET(request: NextRequest) {
  try {
    // Check if request has authorization header (admin request)
    const authHeader = request.headers.get('authorization');
    const isAdminRequest = !!getAuthTokenFromHeader(authHeader);

    // For admin requests, return all items. For public requests, return only active items.
    const whereClause = isAdminRequest ? {} : { isActive: true };

    const db = await getMongoDb();
    const menuItems = await db
      .collection('menu_items')
      .find(whereClause)
      .sort({ createdAt: -1 })
      .toArray();

    // Normalize response to include _id field
    const normalizedItems = (menuItems as MenuItemDocument[]).map((item) => {
      const itemId = item._id.toString();
      return {
        ...item,
        _id: itemId,
        id: itemId,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(normalizedItems);
  } catch (error: unknown) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

// POST /api/menu - Create a new menu item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nameEn, nameJp, price, imageUrl, category, isActive } = body;

    // Validate required fields
    if (!nameEn || !nameJp || price === undefined || !imageUrl || !category) {
      const missingFields = [];
      if (!nameEn) missingFields.push('nameEn');
      if (!nameJp) missingFields.push('nameJp');
      if (price === undefined) missingFields.push('price');
      if (!imageUrl) missingFields.push('imageUrl');
      if (!category) missingFields.push('category');

      return NextResponse.json(
        {
          error: 'Missing required fields',
          missingFields: missingFields,
        },
        { status: 400 }
      );
    }

    // Validate price is a valid number
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'Price must be a valid positive number' },
        { status: 400 }
      );
    }

    // Use native MongoDB driver for writes
    const db = await getMongoDb();
    const now = new Date();
    const menuItemData = {
      _id: new ObjectId(),
      nameEn: nameEn.trim(),
      nameJp: nameJp.trim(),
      price: parsedPrice,
      imageUrl: imageUrl.trim(),
      category: category.trim(),
      isActive: isActive !== undefined ? isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('menu_items').insertOne(menuItemData);

    // Convert for response
    const menuItem = {
      id: menuItemData._id.toString(),
      _id: menuItemData._id.toString(),
      nameEn: menuItemData.nameEn,
      nameJp: menuItemData.nameJp,
      price: menuItemData.price,
      imageUrl: menuItemData.imageUrl,
      category: menuItemData.category,
      isActive: menuItemData.isActive,
      createdAt: menuItemData.createdAt.toISOString(),
      updatedAt: menuItemData.updatedAt.toISOString(),
    };

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating menu item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to create menu item',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

