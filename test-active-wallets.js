#!/usr/bin/env node

// Test avec de vraies adresses Solana actives pour vérifier les données Cielo
const https = require('https');

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTI5NDcsImV4cCI6MjA2OTA4ODk0N30.w1TJf8D7dqU9LlhIZTIZ4sIX5xp5mO4Zx-zOPJQwSF0';

// Vraies adresses de wallets Solana actifs
const ACTIVE_WALLETS = [
  'HdSc3j6p9fLcvz6MhZoUE1JXqP7xpvYDgrtAf3sxF1YN',  // Wallet actif 1
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',  // Wallet actif 2
  'GUFxwDrsLzSQ27xxTVe4y9BARZ6cENWmjzgzn6f6THCp',  // Wallet actif 3
];

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, parseError: e.message });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function testWallet(walletAddress) {
  console.log(`\n🔍 Test du wallet: ${walletAddress}`);
  console.log('='.repeat(60));
  
  try {
    // Test l'API Cielo directement
    console.log('📡 Test direct de l\'API Cielo...');
    const cieloResult = await makeRequest(`${SUPABASE_URL}/functions/v1/cielo-api/complete/${walletAddress}`);
    
    if (cieloResult.status === 200) {
      console.log('✅ API Cielo répond');
      console.log('📊 Data source:', cieloResult.data.data_source);
      
      if (cieloResult.data.summary) {
        console.log('📊 Summary:', JSON.stringify(cieloResult.data.summary, null, 2));
      }
    } else {
      console.log('❌ API Cielo error:', cieloResult.status);
    }
    
    // Test analyse rapide
    console.log('\n⚡ Test analyse rapide...');
    const quickResult = await makeRequest(`${SUPABASE_URL}/functions/v1/wallet-analyzer/quick/${walletAddress}`);
    
    if (quickResult.status === 200) {
      console.log('✅ Analyse rapide réussie');
      console.log('📊 Data source:', quickResult.data.data_source);
      console.log('📊 Total trades:', quickResult.data.total_trades);
      console.log('📊 Win rate:', quickResult.data.win_rate?.toFixed(2) + '%');
      console.log('📊 Total PnL:', '$' + quickResult.data.total_pnl_usd?.toFixed(2));
      console.log('📊 Alpha score:', quickResult.data.alpha_score?.toFixed(2));
      
      return {
        wallet: walletAddress,
        dataSource: quickResult.data.data_source,
        pnl: quickResult.data.total_pnl_usd,
        winRate: quickResult.data.win_rate,
        alphaScore: quickResult.data.alpha_score,
        trades: quickResult.data.total_trades
      };
    } else {
      console.log('❌ Analyse rapide failed:', quickResult.status);
      console.log(quickResult.data);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Test avec vraies adresses Solana actives\n');
  
  const results = [];
  
  for (const wallet of ACTIVE_WALLETS) {
    const result = await testWallet(wallet);
    if (result) {
      results.push(result);
    }
    
    // Pause entre les requêtes
    if (ACTIVE_WALLETS.indexOf(wallet) < ACTIVE_WALLETS.length - 1) {
      console.log('\n⏱️  Pause 2 secondes...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Analyse des résultats
  console.log('\n📊 RÉSUMÉ DES RÉSULTATS');
  console.log('='.repeat(60));
  
  if (results.length > 0) {
    let realDataCount = 0;
    let fallbackCount = 0;
    
    results.forEach(r => {
      console.log(`${r.wallet.slice(0, 8)}...: ${r.dataSource}`);
      console.log(`  PnL: $${r.pnl?.toFixed(2) || 'N/A'}, WR: ${r.winRate?.toFixed(1) || 'N/A'}%, Alpha: ${r.alphaScore?.toFixed(2) || 'N/A'}, Trades: ${r.trades || 'N/A'}`);
      
      if (r.dataSource === 'REAL_CIELO_API') {
        realDataCount++;
      } else {
        fallbackCount++;
      }
    });
    
    console.log(`\n📈 STATISTIQUES:`);
    console.log(`✅ Wallets avec données Cielo réelles: ${realDataCount}/${results.length}`);
    console.log(`⚠️  Wallets avec fallback: ${fallbackCount}/${results.length}`);
    
    if (realDataCount > 0) {
      console.log(`\n🎯 SUCCÈS: L'API utilise les vraies données Cielo !`);
    } else {
      console.log(`\n❌ PROBLÈME: Aucune donnée réelle Cielo récupérée`);
    }
  } else {
    console.log('❌ Aucun résultat obtenu');
  }
  
  console.log('\n✅ Test terminé');
}

main().catch(console.error);
