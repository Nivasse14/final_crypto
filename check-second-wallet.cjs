#!/usr/bin/env node

// Script pour vérifier les métriques du second wallet
const WALLET_ADDRESS = '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5';
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function checkSecondWallet() {
  console.log('🔍 Checking second wallet metrics for:', WALLET_ADDRESS);
  
  try {
    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.${WALLET_ADDRESS}&select=*`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'apikey': BEARER_TOKEN
      }
    });
    
    if (!dbResponse.ok) {
      console.error('❌ DB query failed:', dbResponse.status, dbResponse.statusText);
      return;
    }
    
    const dbData = await dbResponse.json();
    console.log('✅ Database record found:', dbData.length > 0);
    
    if (dbData.length > 0) {
      const record = dbData[0];
      console.log('\n📋 Current metrics in database:');
      console.log('- dexscreener_enriched_portfolio_tokens:', record.dexscreener_enriched_portfolio_tokens);
      console.log('- dexscreener_enriched_pnl_tokens:', record.dexscreener_enriched_pnl_tokens);
      console.log('- dexscreener_tokens_with_market_cap:', record.dexscreener_tokens_with_market_cap);
      console.log('- dexscreener_tokens_with_price_data:', record.dexscreener_tokens_with_price_data);
      console.log('- dexscreener_average_reliability_score:', record.dexscreener_average_reliability_score);
      console.log('- copy_trading_score:', record.copy_trading_score);
      console.log('- last_processed_at:', record.last_processed_at);
      console.log('- cielo_last_enriched_at:', record.cielo_last_enriched_at);
      console.log('- dexscreener_last_enriched_at:', record.dexscreener_last_enriched_at);
      
      // Calculer si les métriques sont remplies
      const hasMetrics = record.dexscreener_enriched_portfolio_tokens > 0 || 
                        record.dexscreener_enriched_pnl_tokens > 0 ||
                        record.dexscreener_tokens_with_market_cap > 0;
      
      console.log('\n🎯 Metrics status:', hasMetrics ? '✅ ENRICHED' : '❌ NOT ENRICHED');
      
      if (!hasMetrics && record.cielo_complete_data) {
        console.log('\n🔧 Data exists but metrics not populated - might need re-processing');
      }
    } else {
      console.log('❌ No database record found for wallet:', WALLET_ADDRESS);
    }
    
  } catch (error) {
    console.error('❌ Check error:', error);
  }
}

checkSecondWallet();
