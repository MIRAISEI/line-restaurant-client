import { MongoClient, Db } from 'mongodb';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

export async function getMongoDb(): Promise<Db> {
  if (mongoDb) {
    return mongoDb;
  }
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }
  
  // Extract database name from connection string
  let dbName = 'sukiyarestaurant';
  try {
    const url = new URL(process.env.DATABASE_URL.replace('mongodb://', 'http://'));
    dbName = url.pathname.slice(1) || dbName;
  } catch {
    // If URL parsing fails, try to extract from connection string directly
    const match = process.env.DATABASE_URL.match(/\/([^?]+)/);
    if (match) {
      dbName = match[1];
    }
  }
  
  // Remove replica set requirement from connection string
  const cleanUrl = process.env.DATABASE_URL
    .replace(/[?&]replicaSet=[^&]*/g, '')
    .replace(/[?&]retryWrites=[^&]*/g, '')
    .replace(/[?&]w=[^&]*/g, '');
  
  mongoClient = new MongoClient(cleanUrl);
  await mongoClient.connect();
  mongoDb = mongoClient.db(dbName);
  
  return mongoDb;
}

