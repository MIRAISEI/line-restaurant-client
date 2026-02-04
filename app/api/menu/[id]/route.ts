import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db';

// PATCH /api/menu/:id - Update a menu item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid menu item ID format' }, { status: 400 });
    }

    const updates = await request.json();
    if (updates.price !== undefined) {
      updates.price = parseFloat(updates.price);
    }
    updates.updatedAt = new Date();

    // Use native MongoDB driver for writes
    const db = await getMongoDb();
    const result = await db.collection('menu_items').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Convert for response
    const menuItem = {
      id: result._id.toString(),
      _id: result._id.toString(),
      nameEn: result.nameEn,
      nameJp: result.nameJp,
      price: result.price,
      imageUrl: result.imageUrl,
      category: result.category,
      isActive: result.isActive,
      createdAt:
        result.createdAt instanceof Date
          ? result.createdAt.toISOString()
          : new Date(result.createdAt).toISOString(),
      updatedAt:
        result.updatedAt instanceof Date
          ? result.updatedAt.toISOString()
          : new Date(result.updatedAt).toISOString(),
    };

    return NextResponse.json(menuItem);
  } catch (error: unknown) {
    console.error('Error updating menu item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to update menu item',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/menu/:id - Hard delete a menu item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid menu item ID format' }, { status: 400 });
    }

    // Use native MongoDB driver for writes
    const db = await getMongoDb();
    const result = await db.collection('menu_items').findOneAndDelete({
      _id: new ObjectId(id),
    });

    if (!result) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting menu item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to delete menu item',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

