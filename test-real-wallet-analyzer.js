#!/usr/bin/env node

// Script pour tester que l'API wallet-analyzer utilise les vraies données Cielo
// et retourne des résultats dynamiques (non-mock)

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTI5NDcsImV4cCI6MjA2OTA4ODk0N30.w1TJf8D7dqU9LlhIZTIZ4sIX5xp5mO4Zx-zOPJQwSF0';

// Wallets de test différents pour vérifier que les résultats changent
const TEST_WALLETS = [
  'So11111111111111111111111111111111111111112',  // SOL wrapper
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',  // Wallet populaire Solana
  'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',  // Wallet DUST
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  // USDC token
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'   // USDT token
];

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
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

async function testHealthCheck() {
  console.log('🏥 Test du health check wallet-analyzer...');
  
  try {
    const result = await makeRequest(`${SUPABASE_URL}/functions/v1/wallet-analyzer/health`);
    
    if (result.status === 200) {
      console.log('✅ Health check OK');
      console.log('📊 Status:', result.data.status);
      console.log('📊 Version:', result.data.version);
      console.log('📊 Cielo API URL:', result.data.cielo_api_url);
    } else {
      console.log('❌ Health check failed:', result.status);
      console.log(result.data);
    }
  } catch (error) {
    console.error('❌ Erreur health check:', error.message);
  }
  
  console.log('');
}

async function testQuickAnalysis(walletAddress) {
  console.log(`⚡ Test analyse rapide pour: ${walletAddress}`);
  
  try {
    const startTime = Date.now();
    const result = await makeRequest(`${SUPABASE_URL}/functions/v1/wallet-analyzer/quick/${walletAddress}`);
    const duration = Date.now() - startTime;
    
    if (result.status === 200) {
      console.log(`✅ Analyse rapide réussie (${duration}ms)`);
      console.log('📊 Data source:', result.data.data_source);
      console.log('📊 Total trades:', result.data.total_trades);
      console.log('📊 Win rate:', result.data.win_rate.toFixed(2) + '%');
      console.log('📊 Total PnL:', '$' + result.data.total_pnl_usd.toFixed(2));
      console.log('📊 Alpha score:', result.data.alpha_score.toFixed(2));
      
      if (result.data.recent_tokens && result.data.recent_tokens.length > 0) {
        console.log('📊 Recent tokens:', result.data.recent_tokens.length);
        result.data.recent_tokens.forEach(token => {
          console.log(`   - ${token.symbol}: $${token.market_cap.toFixed(0)} market cap`);
        });
      }
      
      return result.data;
    } else {
      console.log('❌ Analyse rapide failed:', result.status);
      console.log(result.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur analyse rapide:', error.message);
    return null;
  }
}

async function testCompleteAnalysis(walletAddress) {
  console.log(`🎯 Test analyse complète pour: ${walletAddress}`);
  
  try {
    const startTime = Date.now();
    const result = await makeRequest(`${SUPABASE_URL}/functions/v1/wallet-analyzer/complete/${walletAddress}`);
    const duration = Date.now() - startTime;
    
    if (result.status === 200) {
      console.log(`✅ Analyse complète réussie (${duration}ms)`);
      console.log('📊 Data source:', result.data.data_source);
      console.log('📊 Wallet:', result.data.wallet_address);
      console.log('📊 Analysis type:', result.data.analysis_type);
      
      // Vérifier les données principales
      const data = result.data.data;
      if (data) {
        console.log('📊 Total transactions:', data.transaction_summary?.total_transactions || 'N/A');
        console.log('📊 Total PnL:', '$' + (data.trade_analysis?.total_pnl_usd?.toFixed(2) || 'N/A'));
        console.log('📊 Win rate:', (data.trade_analysis?.win_rate?.toFixed(2) || 'N/A') + '%');
        console.log('📊 Alpha score:', data.alpha_analysis?.alpha_score?.toFixed(2) || 'N/A');
        console.log('📊 Alpha category:', data.alpha_analysis?.alpha_category || 'N/A');
        console.log('📊 Recommendation:', data.copy_trading_recommendations?.recommendation || 'N/A');
        console.log('📊 Suggested allocation:', (data.copy_trading_recommendations?.suggested_allocation_percentage || 0) + '%');
        
        if (data.token_analysis?.tokens && data.token_analysis.tokens.length > 0) {
          console.log('📊 Tokens analyzed:', data.token_analysis.tokens.length);
          data.token_analysis.tokens.slice(0, 3).forEach(token => {
            console.log(`   - ${token.symbol}: PnL $${token.total_pnl_usd?.toFixed(2) || 'N/A'}, ROI ${token.roi_percentage?.toFixed(2) || 'N/A'}%`);
          });
        }
      }
      
      return result.data;
    } else {
      console.log('❌ Analyse complète failed:', result.status);
      console.log(result.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur analyse complète:', error.message);
    return null;
  }
}

async function checkDataVariation() {
  console.log('🔄 Test de variation des données entre différents wallets...');
  
  const results = [];
  
  for (const wallet of TEST_WALLETS.slice(0, 3)) { // Tester 3 wallets
    const result = await testQuickAnalysis(wallet);
    if (result) {
      results.push({
        wallet,
        pnl: result.total_pnl_usd,
        winRate: result.win_rate,
        alphaScore: result.alpha_score,
        dataSource: result.data_source
      });
    }
    console.log(''); // Ligne vide pour séparer
  }
  
  // Vérifier que les résultats sont différents (pas des mocks identiques)
  if (results.length >= 2) {
    let allIdentical = true;
    const first = results[0];
    
    for (let i = 1; i < results.length; i++) {
      const current = results[i];
      if (
        Math.abs(current.pnl - first.pnl) > 0.01 ||
        Math.abs(current.winRate - first.winRate) > 0.01 ||
        Math.abs(current.alphaScore - first.alphaScore) > 0.01
      ) {
        allIdentical = false;
        break;
      }
    }
    
    if (allIdentical) {
      console.log('⚠️  ATTENTION: Les résultats sont identiques entre les wallets (possibles données mock)');
    } else {
      console.log('✅ SUCCÈS: Les résultats varient entre les wallets (vraies données dynamiques)');
    }
    
    console.log('\n📊 Résumé des variations:');
    results.forEach(r => {
      console.log(`  ${r.wallet.slice(0, 8)}...: PnL $${r.pnl.toFixed(2)}, Win ${r.winRate.toFixed(1)}%, Alpha ${r.alphaScore.toFixed(2)} [${r.dataSource}]`);
    });
  }
}

async function main() {
  console.log('🚀 Test de l\'API Wallet Analyzer avec vraies données Cielo\n');
  
  // Test du health check
  await testHealthCheck();
  
  // Test d'une analyse rapide
  console.log('⚡ Tests d\'analyse rapide:');
  await testQuickAnalysis(TEST_WALLETS[0]);
  console.log('');
  
  // Test d'une analyse complète
  console.log('🎯 Tests d\'analyse complète:');
  await testCompleteAnalysis(TEST_WALLETS[0]);
  console.log('');
  
  // Test de variation des données
  await checkDataVariation();
  
  console.log('\n✅ Tests terminés');
}

main().catch(console.error);
