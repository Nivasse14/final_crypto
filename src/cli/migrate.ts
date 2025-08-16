#!/usr/bin/env node

import 'dotenv/config';
import { WalletETL } from '../etl/index.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const etl = new WalletETL({ databaseUrl: DATABASE_URL });

console.log('🔧 Running database migrations...');

etl.runMigrations()
  .then(() => {
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(() => {
    etl.close();
  });
