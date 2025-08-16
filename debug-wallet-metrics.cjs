#!/usr/bin/env node

// Script pour débugger pourquoi les métriques DexScreener ne sont pas sauvegardées
const WALLET_ADDRESS = '8sLbNZfGUrj3ADbMXmzZe8p3GbXVKWfxo9B8b2D5NWnV';
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function debugWalletMetrics() {
  console.log('🔍 Debugging wallet metrics for:', WALLET_ADDRESS);
  
  try {
    // 1. Vérifier l'état actuel en base
    console.log('\n📊 1. Checking current database state...');
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
      console.log('- last_processed_at:', record.last_processed_at);
      console.log('- cielo_last_enriched_at:', record.cielo_last_enriched_at);
      console.log('- dexscreener_last_enriched_at:', record.dexscreener_last_enriched_at);
      
      // Analyser les données complètes
      if (record.cielo_complete_data) {
        console.log('\n🔍 2. Analyzing cielo_complete_data structure...');
        const completeData = record.cielo_complete_data;
        
        // Vérifier extracted_data
        if (completeData.extracted_data) {
          console.log('✅ extracted_data found');
          
          if (completeData.extracted_data.global_enrichment_stats) {
            console.log('✅ global_enrichment_stats found:');
            const stats = completeData.extracted_data.global_enrichment_stats;
            console.log('  - total_portfolio_tokens:', stats.total_portfolio_tokens);
            console.log('  - total_pnl_tokens:', stats.total_pnl_tokens);
            console.log('  - enriched_portfolio_tokens:', stats.enriched_portfolio_tokens);
            console.log('  - enriched_pnl_tokens:', stats.enriched_pnl_tokens);
            console.log('  - tokens_with_market_cap:', stats.tokens_with_market_cap);
            console.log('  - tokens_with_price_data:', stats.tokens_with_price_data);
            console.log('  - average_reliability_score:', stats.average_reliability_score);
          } else {
            console.log('❌ global_enrichment_stats NOT found in extracted_data');
          }
          
          // Vérifier dexscreener_portfolio
          if (completeData.extracted_data.dexscreener_portfolio) {
            console.log('✅ dexscreener_portfolio found with', completeData.extracted_data.dexscreener_portfolio.enriched_tokens?.length || 0, 'tokens');
          } else {
            console.log('❌ dexscreener_portfolio NOT found in extracted_data');
          }
          
          // Vérifier dexscreener_pnl
          if (completeData.extracted_data.dexscreener_pnl) {
            console.log('✅ dexscreener_pnl found with', completeData.extracted_data.dexscreener_pnl.enriched_tokens?.length || 0, 'tokens');
          } else {
            console.log('❌ dexscreener_pnl NOT found in extracted_data');
          }
        } else {
          console.log('❌ extracted_data NOT found in cielo_complete_data');
        }
        
        // Vérifier enriched_portfolio et enriched_pnl directement
        if (completeData.enriched_portfolio) {
          console.log('\n✅ enriched_portfolio found at root level:');
          console.log('  - enriched_tokens:', completeData.enriched_portfolio.enriched_tokens?.length || 0);
          console.log('  - enrichment_stats:', JSON.stringify(completeData.enriched_portfolio.enrichment_stats || {}, null, 2));
        } else {
          console.log('\n❌ enriched_portfolio NOT found at root level');
        }
        
        if (completeData.enriched_pnl) {
          console.log('\n✅ enriched_pnl found at root level:');
          console.log('  - enriched_tokens:', completeData.enriched_pnl.enriched_tokens?.length || 0);
          console.log('  - enrichment_stats:', JSON.stringify(completeData.enriched_pnl.enrichment_stats || {}, null, 2));
        } else {
          console.log('\n❌ enriched_pnl NOT found at root level');
        }
      } else {
        console.log('\n❌ cielo_complete_data NOT found in database record');
      }
    } else {
      console.log('❌ No database record found for wallet:', WALLET_ADDRESS);
    }
    
    // 2. Tester un appel API pour voir la structure actuelle
    console.log('\n🚀 3. Testing API call to see current data structure...');
    const apiResponse = await fetch(`${SUPABASE_URL}/functions/v1/cielo-api/complete/${WALLET_ADDRESS}`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });
    
    if (!apiResponse.ok) {
      console.error('❌ API call failed:', apiResponse.status, apiResponse.statusText);
      return;
    }
    
    const apiData = await apiResponse.json();
    console.log('✅ API response received');
    
    if (apiData.data && apiData.data.extracted_data) {
      console.log('\n📊 API Response - extracted_data structure:');
      const extractedData = apiData.data.extracted_data;
      
      if (extractedData.global_enrichment_stats) {
        console.log('✅ global_enrichment_stats in API response:');
        console.log(JSON.stringify(extractedData.global_enrichment_stats, null, 2));
      } else {
        console.log('❌ global_enrichment_stats NOT in API response');
      }
    }
    
    if (apiData.enrichment_stats) {
      console.log('\n📊 API Response - enrichment_stats at root:');
      console.log(JSON.stringify(apiData.enrichment_stats, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugWalletMetrics();
