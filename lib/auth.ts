import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { ObjectId } from 'mongodb';
import { getMongoDb } from './db';

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  id: string;
  role: string;
  displayName: string;
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function generateToken(payload: JwtPayload): string {
  const expiresInValue = (JWT_EXPIRES_IN as StringValue) || ('7d' as StringValue);
  const signOptions: SignOptions = {
    expiresIn: expiresInValue,
  };
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

export async function verifyUserFromToken(token: string) {
  try {
    const decoded = verifyToken(token);
    
    const db = await getMongoDb();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.id),
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      _id: user._id.toString(),
      id: user._id.toString(),
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      role: user.role.toLowerCase(),
      isActive: user.isActive,
      lineUserId: user.lineUserId || undefined,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date(user.createdAt).toISOString(),
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : new Date(user.updatedAt).toISOString(),
    };
  } catch {
    return null;
  }
}

export function getAuthTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

