#!/usr/bin/env node

// Test de l'API wallet-registry pour vérifier la sauvegarde
const https = require('https');

const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function testWalletRegistryGet(walletAddress) {
  console.log(`🔍 Testing wallet-registry GET for: ${walletAddress}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'xkndddxqqlxqknbqtefv.supabase.co',
      port: 443,
      path: `/functions/v1/wallet-registry/get/${walletAddress}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ Wallet registry data:');
          console.log(`  - Wallet: ${jsonData.wallet_address}`);
          console.log(`  - Status: ${jsonData.status}`);
          console.log(`  - Last processed: ${jsonData.last_processed_at}`);
          console.log(`  - Processing version: ${jsonData.processing_version}`);
          console.log(`  - Enriched PnL: $${jsonData.enriched_total_pnl_usd}`);
          console.log(`  - Enriched winrate: ${jsonData.enriched_winrate}%`);
          console.log(`  - Portfolio value: $${jsonData.enriched_portfolio_value_usd}`);
          console.log(`  - Analysis score: ${jsonData.enriched_analysis_score}`);
          console.log(`  - DexScreener enriched tokens: ${jsonData.dexscreener_enriched_portfolio_tokens}`);
          resolve(jsonData);
        } catch (e) {
          console.log('📄 Raw response:');
          console.log(data);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('⏰ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testWalletRegistryList() {
  console.log('📋 Testing wallet-registry list...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'xkndddxqqlxqknbqtefv.supabase.co',
      port: 443,
      path: '/functions/v1/wallet-registry/list',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ Recent wallets:');
          if (jsonData.wallets && jsonData.wallets.length > 0) {
            jsonData.wallets.slice(0, 5).forEach((wallet, i) => {
              console.log(`  ${i+1}. ${wallet.wallet_address} - ${wallet.status} - $${wallet.enriched_total_pnl_usd}`);
            });
          }
          resolve(jsonData);
        } catch (e) {
          console.log('📄 Raw response:');
          console.log(data);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('⏰ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Testing wallet-registry API...\n');
    
    // Test avec le wallet qu'on vient d'enrichir
    await testWalletRegistryGet('7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5');
    
    console.log('\n');
    
    // Lister les wallets récents
    await testWalletRegistryList();
    
    console.log('\n🎉 Test completed!');
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

main();
