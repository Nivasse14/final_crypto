#!/usr/bin/env node

// Script pour forcer la mise à jour des métriques DexScreener depuis les données existantes
const https = require('https');

const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function fixWalletMetrics(walletAddress) {
  console.log(`🔧 Fixing DexScreener metrics for: ${walletAddress}`);
  
  // 1. Récupérer les données actuelles
  const getResponse = await fetch(`${supabaseUrl}/functions/v1/wallet-registry/get/${walletAddress}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!getResponse.ok) {
    console.error(`❌ Failed to get wallet data: ${getResponse.status}`);
    return false;
  }

  const walletData = await getResponse.json();
  console.log(`✅ Retrieved wallet data`);

  // 2. Extraire les métriques DexScreener depuis cielo_complete_data
  const extractedData = walletData.cielo_complete_data?.extracted_data;
  if (!extractedData) {
    console.error(`❌ No extracted_data found`);
    return false;
  }

  const globalStats = extractedData.global_enrichment_stats || {};
  console.log('📊 Global enrichment stats:', globalStats);

  // 3. Préparer les updates avec les bonnes valeurs
  const correctMetrics = {
    dexscreener_enriched_portfolio_tokens: globalStats.enriched_portfolio_tokens || 0,
    dexscreener_enriched_pnl_tokens: globalStats.enriched_pnl_tokens || 0,
    dexscreener_tokens_with_market_cap: globalStats.tokens_with_market_cap || 0,
    dexscreener_tokens_with_price_data: globalStats.tokens_with_price_data || 0,
    dexscreener_average_reliability_score: globalStats.average_reliability_score || 0,
    last_processed_at: new Date().toISOString()
  };

  console.log('🔄 Correct metrics to apply:', correctMetrics);

  // 4. Mettre à jour en base
  const updateResponse = await fetch(`${supabaseUrl}/functions/v1/wallet-registry/update`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      wallet_address: walletAddress,
      updates: correctMetrics
    })
  });

  if (updateResponse.ok) {
    console.log(`✅ Successfully updated DexScreener metrics`);
    return true;
  } else {
    console.error(`❌ Failed to update: ${updateResponse.status}`);
    return false;
  }
}

async function main() {
  const walletAddress = '8sLbNZfGUrj3ADbMXmzZe8p3GbXVKWfxo9B8b2D5NWnV';
  
  console.log('🚀 Starting DexScreener metrics fix...\n');
  
  const success = await fixWalletMetrics(walletAddress);
  
  if (success) {
    console.log('\n🎉 Metrics fix completed successfully!');
    
    // Vérifier les résultats
    console.log('\n🔍 Verifying results...');
    const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/wallet-registry/get/${walletAddress}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const verifiedData = await verifyResponse.json();
      console.log('📊 Updated metrics:');
      console.log(`  - Enriched portfolio tokens: ${verifiedData.dexscreener_enriched_portfolio_tokens}`);
      console.log(`  - Enriched PnL tokens: ${verifiedData.dexscreener_enriched_pnl_tokens}`);
      console.log(`  - Tokens with market cap: ${verifiedData.dexscreener_tokens_with_market_cap}`);
      console.log(`  - Tokens with price data: ${verifiedData.dexscreener_tokens_with_price_data}`);
      console.log(`  - Average reliability score: ${verifiedData.dexscreener_average_reliability_score}`);
    }
  } else {
    console.log('\n💥 Metrics fix failed!');
    process.exit(1);
  }
}

main();
