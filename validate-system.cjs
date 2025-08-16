#!/usr/bin/env node

// Script de validation complète du système
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

const TEST_WALLETS = [
  '8sLbNZfGUrj3ADbMXmzZe8p3GbXVKWfxo9B8b2D5NWnV', // Déjà traité
  '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5'  // À traiter
];

async function validateSystem() {
  console.log('🚀 Validation complète du système d\'enrichissement\n');
  
  // 1. Vérifier les wallets existants
  console.log('📊 1. Vérification des wallets existants...');
  for (const wallet of TEST_WALLETS) {
    await checkWalletInDB(wallet);
  }
  
  // 2. Lister tous les wallets enrichis
  console.log('\n📋 2. Liste de tous les wallets enrichis...');
  await listAllEnrichedWallets();
  
  // 3. Vérifier les statistiques globales
  console.log('\n📈 3. Statistiques globales...');
  await getGlobalStats();
  
  // 4. Test de l'API avec un nouveau wallet (si nécessaire)
  console.log('\n🧪 4. Test API...');
  const newWallet = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH'; // Nouveau wallet de test
  await testAPIWithNewWallet(newWallet);
}

async function checkWalletInDB(walletAddress) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.${walletAddress}&select=wallet_address,dexscreener_enriched_portfolio_tokens,dexscreener_enriched_pnl_tokens,dexscreener_tokens_with_market_cap,dexscreener_tokens_with_price_data,dexscreener_average_reliability_score,copy_trading_score,last_processed_at`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'apikey': BEARER_TOKEN
      }
    });
    
    const data = await response.json();
    if (data.length > 0) {
      const record = data[0];
      console.log(`✅ ${walletAddress.slice(0, 8)}...:`);
      console.log(`   Portfolio tokens: ${record.dexscreener_enriched_portfolio_tokens}`);
      console.log(`   PnL tokens: ${record.dexscreener_enriched_pnl_tokens}`);
      console.log(`   Market cap tokens: ${record.dexscreener_tokens_with_market_cap}`);
      console.log(`   Price data tokens: ${record.dexscreener_tokens_with_price_data}`);
      console.log(`   Reliability score: ${record.dexscreener_average_reliability_score}`);
      console.log(`   Copy trading score: ${record.copy_trading_score}`);
      console.log(`   Last processed: ${record.last_processed_at}`);
    } else {
      console.log(`❌ ${walletAddress.slice(0, 8)}...: Non trouvé en base`);
    }
  } catch (error) {
    console.error(`❌ Erreur pour ${walletAddress.slice(0, 8)}...:`, error.message);
  }
}

async function listAllEnrichedWallets() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?dexscreener_enriched_portfolio_tokens=gte.1&select=wallet_address,dexscreener_enriched_portfolio_tokens,dexscreener_enriched_pnl_tokens,copy_trading_score&order=copy_trading_score.desc.nullslast&limit=10`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'apikey': BEARER_TOKEN
      }
    });
    
    const data = await response.json();
    console.log(`✅ ${data.length} wallets enrichis trouvés:`);
    
    data.forEach((record, index) => {
      console.log(`${index + 1}. ${record.wallet_address.slice(0, 8)}... - Portfolio: ${record.dexscreener_enriched_portfolio_tokens}, PnL: ${record.dexscreener_enriched_pnl_tokens}, Score: ${record.copy_trading_score || 'N/A'}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des wallets enrichis:', error.message);
  }
}

async function getGlobalStats() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?select=count,dexscreener_enriched_portfolio_tokens,dexscreener_enriched_pnl_tokens,dexscreener_tokens_with_market_cap&dexscreener_enriched_portfolio_tokens=gte.1`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'apikey': BEARER_TOKEN,
        'Prefer': 'count=exact'
      }
    });
    
    const count = response.headers.get('content-range');
    console.log(`✅ Nombre total de wallets enrichis: ${count ? count.split('/')[1] : 'N/A'}`);
    
    // Statistiques des moyennes
    const avgResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/wallet_enrichment_stats`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'apikey': BEARER_TOKEN
      }
    });
    
    if (avgResponse.ok) {
      const avgData = await avgResponse.json();
      console.log('📊 Statistiques moyennes:', avgData);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error.message);
  }
}

async function testAPIWithNewWallet(walletAddress) {
  try {
    console.log(`🧪 Test API avec nouveau wallet: ${walletAddress.slice(0, 8)}...`);
    
    const startTime = Date.now();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cielo-api/complete/${walletAddress}`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });
    
    const endTime = Date.now();
    console.log(`⏱️ Temps de traitement: ${(endTime - startTime) / 1000}s`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response status:', data.success ? 'SUCCESS' : 'FAILED');
      
      if (data.success && data.data && data.data.extracted_data) {
        const stats = data.data.extracted_data.global_enrichment_stats;
        if (stats) {
          console.log('📊 Métriques DexScreener générées:');
          console.log(`   Portfolio tokens enrichis: ${stats.enriched_portfolio_tokens}`);
          console.log(`   PnL tokens enrichis: ${stats.enriched_pnl_tokens}`);
          console.log(`   Tokens avec market cap: ${stats.tokens_with_market_cap}`);
          console.log(`   Score de fiabilité moyen: ${stats.average_reliability_score}`);
        }
      }
      
      // Vérifier la sauvegarde en base après le traitement
      setTimeout(async () => {
        console.log('🔍 Vérification de la sauvegarde en base...');
        await checkWalletInDB(walletAddress);
      }, 2000);
      
    } else {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test API:', error.message);
  }
}

// Exécuter la validation
validateSystem();
