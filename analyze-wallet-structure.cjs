#!/usr/bin/env node

// Script pour analyser la structure des données DexScreener sauvegardées
const https = require('https');

const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function analyzeWalletData(walletAddress) {
  console.log(`🔍 Analyzing data structure for: ${walletAddress}`);
  
  const getResponse = await fetch(`${supabaseUrl}/functions/v1/wallet-registry/get/${walletAddress}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!getResponse.ok) {
    console.error(`❌ Failed to get wallet data: ${getResponse.status}`);
    return;
  }

  const walletData = await getResponse.json();
  
  // Analyser la structure de cielo_complete_data
  console.log('\n📋 Top-level keys in cielo_complete_data:');
  if (walletData.cielo_complete_data) {
    const keys = Object.keys(walletData.cielo_complete_data);
    keys.forEach(key => {
      console.log(`  - ${key}`);
    });
    
    // Chercher où sont les stats DexScreener
    console.log('\n🔍 Looking for DexScreener stats...');
    
    const data = walletData.cielo_complete_data;
    
    // Vérifier extracted_data
    if (data.extracted_data) {
      console.log('\n✅ Found extracted_data');
      if (data.extracted_data.global_enrichment_stats) {
        console.log('📊 Global enrichment stats:', data.extracted_data.global_enrichment_stats);
      }
    }
    
    // Vérifier enriched_portfolio
    if (data.enriched_portfolio) {
      console.log('\n✅ Found enriched_portfolio');
      if (data.enriched_portfolio.enrichment_stats) {
        console.log('📊 Portfolio enrichment stats:', data.enriched_portfolio.enrichment_stats);
      }
    }
    
    // Vérifier enriched_pnl  
    if (data.enriched_pnl) {
      console.log('\n✅ Found enriched_pnl');
      if (data.enriched_pnl.enrichment_stats) {
        console.log('📊 PnL enrichment stats:', data.enriched_pnl.enrichment_stats);
      }
    }
    
  } else {
    console.log('❌ No cielo_complete_data found');
  }
  
  // Montrer les métriques actuelles en base
  console.log('\n📊 Current DexScreener metrics in database:');
  console.log(`  - dexscreener_enriched_portfolio_tokens: ${walletData.dexscreener_enriched_portfolio_tokens}`);
  console.log(`  - dexscreener_enriched_pnl_tokens: ${walletData.dexscreener_enriched_pnl_tokens}`);
  console.log(`  - dexscreener_tokens_with_market_cap: ${walletData.dexscreener_tokens_with_market_cap}`);
  console.log(`  - dexscreener_tokens_with_price_data: ${walletData.dexscreener_tokens_with_price_data}`);
  console.log(`  - dexscreener_average_reliability_score: ${walletData.dexscreener_average_reliability_score}`);
}

async function main() {
  const walletAddress = '8sLbNZfGUrj3ADbMXmzZe8p3GbXVKWfxo9B8b2D5NWnV';
  await analyzeWalletData(walletAddress);
}

main();
