#!/usr/bin/env node

import 'dotenv/config';
import { WalletAPIServer } from '../api/server.js';

// Configuration depuis les variables d'environnement
const PORT = parseInt(process.env.PORT || '3000');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Créer et démarrer le serveur
const server = new WalletAPIServer(DATABASE_URL);

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await server.close();
    console.log('✅ Server closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  try {
    await server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Démarrer le serveur
console.log('🚀 Starting Solana Copy Trading API...');
console.log(`📊 Database: ${DATABASE_URL.split('@')[1] || 'configured'}`);
server.start(PORT);
