/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * MongoDB Atlas Migration Script
 * 
 * This script helps migrate data from local MongoDB to MongoDB Atlas
 * 
 * Usage:
 * 1. Update the connection strings below
 * 2. Run: node scripts/migrate-to-atlas.js
 */

const { MongoClient } = require('mongodb');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration - UPDATE THESE
const LOCAL_DB_URL = process.env.LOCAL_DATABASE_URL || 'mongodb://localhost:27017/sukiyarestaurant';
const ATLAS_DB_URL = process.env.ATLAS_DATABASE_URL || ''; // Your Atlas connection string

const DB_NAME = 'sukiyarestaurant';
const COLLECTIONS = ['users', 'menu_items', 'orders', 'order_items'];

async function migrateCollection(localClient, atlasClient, collectionName) {
  console.log(`\n📦 Migrating collection: ${collectionName}...`);

  const localDb = localClient.db(DB_NAME);
  const atlasDb = atlasClient.db(DB_NAME);

  const localCollection = localDb.collection(collectionName);
  const atlasCollection = atlasDb.collection(collectionName);

  // Count documents
  const count = await localCollection.countDocuments();
  console.log(`   Found ${count} documents`);

  if (count === 0) {
    console.log(`   ⚠️  Collection is empty, skipping...`);
    return;
  }

  // Fetch all documents
  const documents = await localCollection.find({}).toArray();

  // Insert into Atlas (with error handling for duplicates)
  let inserted = 0;
  let skipped = 0;

  for (const doc of documents) {
    try {
      // Check if document already exists
      const exists = await atlasCollection.findOne({ _id: doc._id });
      if (exists) {
        // Update existing document
        await atlasCollection.replaceOne({ _id: doc._id }, doc);
        skipped++;
      } else {
        // Insert new document
        await atlasCollection.insertOne(doc);
        inserted++;
      }
    } catch (error) {
      console.error(`   ❌ Error migrating document ${doc._id}:`, error.message);
    }
  }

  console.log(`   ✅ Migrated: ${inserted} new, ${skipped} updated`);
}

async function main() {
  if (!ATLAS_DB_URL) {
    console.error('❌ ATLAS_DATABASE_URL is not set!');
    console.log('Please set it as an environment variable or update the script.');
    process.exit(1);
  }

  console.log('🚀 Starting MongoDB Atlas Migration...\n');
  console.log(`Local DB: ${LOCAL_DB_URL}`);
  console.log(`Atlas DB: ${ATLAS_DB_URL.split('@')[1] || 'hidden'}\n`);

  const localClient = new MongoClient(LOCAL_DB_URL);
  const atlasClient = new MongoClient(ATLAS_DB_URL);

  try {
    // Connect to both databases
    console.log('🔌 Connecting to local MongoDB...');
    await localClient.connect();
    console.log('✅ Connected to local MongoDB');

    console.log('🔌 Connecting to MongoDB Atlas...');
    await atlasClient.connect();
    console.log('✅ Connected to MongoDB Atlas');

    // Migrate each collection
    for (const collectionName of COLLECTIONS) {
      await migrateCollection(localClient, atlasClient, collectionName);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env files with the Atlas connection string');
    console.log('2. Test your application');
    console.log('3. Update Vercel environment variables if deploying');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await localClient.close();
    await atlasClient.close();
    rl.close();
  }
}

// Run migration
main().catch(console.error);

