#!/usr/bin/env node

// Script pour vérifier les données en base PostgreSQL
const { Pool } = require('pg');

// Configuration Supabase
const pool = new Pool({
  host: 'aws-0-eu-west-3.pooler.supabase.com',
  database: 'postgres',
  user: 'postgres.xkndddxqqlxqknbqtefv',
  password: 'BQs99PSFyKF4mwm4',
  port: 6543,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkWalletData(walletAddress) {
  const client = await pool.connect();
  
  try {
    console.log(`🔍 Checking wallet data for: ${walletAddress}`);
    
    // Vérifier si le wallet existe
    const result = await client.query(
      'SELECT * FROM wallet_registry WHERE wallet_address = $1',
      [walletAddress]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Wallet not found in database');
      return null;
    }
    
    const wallet = result.rows[0];
    console.log('✅ Wallet found!');
    console.log('📊 Wallet metrics:');
    console.log(`  - Status: ${wallet.status}`);
    console.log(`  - Last processed: ${wallet.last_processed_at}`);
    console.log(`  - Processing version: ${wallet.processing_version}`);
    console.log(`  - Enriched PnL USD: ${wallet.enriched_total_pnl_usd}`);
    console.log(`  - Enriched winrate: ${wallet.enriched_winrate}`);
    console.log(`  - Enriched total trades: ${wallet.enriched_total_trades}`);
    console.log(`  - Enriched ROI %: ${wallet.enriched_roi_percentage}`);
    console.log(`  - Portfolio value USD: ${wallet.enriched_portfolio_value_usd}`);
    console.log(`  - Portfolio tokens: ${wallet.enriched_portfolio_tokens}`);
    console.log(`  - Analysis score: ${wallet.enriched_analysis_score}`);
    console.log(`  - AI risk level: ${wallet.enriched_ai_risk_level}`);
    console.log(`  - Data completeness: ${wallet.enriched_data_completeness_score}`);
    
    console.log('\n🎯 DexScreener enrichment metrics:');
    console.log(`  - Enriched portfolio tokens: ${wallet.dexscreener_enriched_portfolio_tokens}`);
    console.log(`  - Enriched PnL tokens: ${wallet.dexscreener_enriched_pnl_tokens}`);
    console.log(`  - Tokens with market cap: ${wallet.dexscreener_tokens_with_market_cap}`);
    console.log(`  - Tokens with price data: ${wallet.dexscreener_tokens_with_price_data}`);
    console.log(`  - Average reliability score: ${wallet.dexscreener_average_reliability_score}`);
    console.log(`  - Last enriched: ${wallet.dexscreener_last_enriched_at}`);
    
    // Vérifier la taille des données complètes
    if (wallet.cielo_complete_data) {
      const dataSize = JSON.stringify(wallet.cielo_complete_data).length;
      console.log(`\n📦 Complete data size: ${(dataSize / 1024).toFixed(2)} KB`);
      
      const data = wallet.cielo_complete_data;
      if (data.extracted_data) {
        console.log('📋 Data structure found:');
        console.log(`  - Portfolio: ${data.extracted_data.portfolio ? '✅' : '❌'}`);
        console.log(`  - Enhanced stats: ${data.extracted_data.enhanced_stats ? '✅' : '❌'}`);
        console.log(`  - PnL data: ${data.extracted_data.pnl_data ? '✅' : '❌'}`);
        console.log(`  - Consolidated metrics: ${data.extracted_data.consolidated_metrics ? '✅' : '❌'}`);
        console.log(`  - DexScreener enrichment: ${data.extracted_data.global_enrichment_stats ? '✅' : '❌'}`);
      }
    }
    
    return wallet;
    
  } catch (error) {
    console.error('❌ Database error:', error);
    return null;
  } finally {
    client.release();
  }
}

async function listRecentWallets() {
  const client = await pool.connect();
  
  try {
    console.log('\n📋 Recent enriched wallets:');
    
    const result = await client.query(`
      SELECT wallet_address, status, last_processed_at, enriched_total_pnl_usd, enriched_winrate
      FROM wallet_registry 
      WHERE status = 'enriched' 
      ORDER BY last_processed_at DESC 
      LIMIT 10
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No enriched wallets found');
      return;
    }
    
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    const walletAddress = process.argv[2] || '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5';
    
    console.log('🔗 Connecting to Supabase PostgreSQL...');
    
    await checkWalletData(walletAddress);
    await listRecentWallets();
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await pool.end();
  }
}

main();
