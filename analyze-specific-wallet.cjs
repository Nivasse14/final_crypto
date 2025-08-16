#!/usr/bin/env node

// Script pour analyser en détail les métriques DexScreener d'un wallet spécifique
const WALLET_ADDRESS = 'ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB';
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function analyzeWalletTokens() {
  console.log('🔍 Analyse détaillée des tokens pour wallet:', WALLET_ADDRESS);
  
  try {
    // Récupérer les données complètes du wallet
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
    if (dbData.length === 0) {
      console.log('❌ Wallet not found');
      return;
    }
    
    const record = dbData[0];
    console.log('\n📊 Métriques en base:');
    console.log('- dexscreener_enriched_portfolio_tokens:', record.dexscreener_enriched_portfolio_tokens);
    console.log('- dexscreener_enriched_pnl_tokens:', record.dexscreener_enriched_pnl_tokens);
    console.log('- dexscreener_tokens_with_market_cap:', record.dexscreener_tokens_with_market_cap);
    console.log('- dexscreener_tokens_with_price_data:', record.dexscreener_tokens_with_price_data);
    console.log('- dexscreener_average_reliability_score:', record.dexscreener_average_reliability_score);
    
    // Analyser les données enrichies
    if (!record.cielo_complete_data) {
      console.log('❌ Pas de données enrichies trouvées');
      return;
    }
    
    const completeData = record.cielo_complete_data;
    console.log('\n🔍 Analyse des données enrichies...');
    
    // Vérifier enriched_pnl
    if (completeData.enriched_pnl) {
      const enrichedPnl = completeData.enriched_pnl;
      console.log('\n📈 Enriched PnL Data:');
      console.log('- Total tokens:', enrichedPnl.enrichment_stats?.total_tokens || 0);
      console.log('- Tokens enrichis:', enrichedPnl.enrichment_stats?.enriched_tokens || 0);
      console.log('- Tokens avec market cap:', enrichedPnl.enrichment_stats?.tokens_with_market_cap || 0);
      console.log('- Tokens avec price data:', enrichedPnl.enrichment_stats?.tokens_with_price_data || 0);
      
      // Examiner quelques tokens en détail
      if (enrichedPnl.enriched_tokens && enrichedPnl.enriched_tokens.length > 0) {
        console.log('\n🔍 Analyse des premiers tokens:');
        
        let tokensWithMarketCap = 0;
        let tokensWithPriceData = 0;
        let totalTokens = enrichedPnl.enriched_tokens.length;
        
        enrichedPnl.enriched_tokens.slice(0, 10).forEach((token, index) => {
          const hasMarketCap = token.dexscreener_data?.financial_data?.market_cap !== null && 
                               token.dexscreener_data?.financial_data?.market_cap !== undefined;
          const hasPriceData = token.dexscreener_data?.financial_data?.price_usd !== null && 
                              token.dexscreener_data?.financial_data?.price_usd !== undefined;
          
          console.log(`Token ${index + 1}: ${token.token_symbol || token.symbol || 'N/A'}`);
          console.log(`  - DexScreener enriched: ${token.dexscreener_enriched ? '✅' : '❌'}`);
          console.log(`  - Market cap: ${hasMarketCap ? `$${token.dexscreener_data.financial_data.market_cap?.toLocaleString() || 'N/A'}` : '❌ Aucune'}`);
          console.log(`  - Price: ${hasPriceData ? `$${token.dexscreener_data.financial_data.price_usd || 'N/A'}` : '❌ Aucun'}`);
          console.log('');
          
          if (hasMarketCap) tokensWithMarketCap++;
          if (hasPriceData) tokensWithPriceData++;
        });
        
        // Compter TOUS les tokens
        console.log('\n📊 Recompte manuel des métriques:');
        let allTokensWithMarketCap = 0;
        let allTokensWithPriceData = 0;
        
        enrichedPnl.enriched_tokens.forEach(token => {
          if (token.dexscreener_data?.financial_data?.market_cap !== null && 
              token.dexscreener_data?.financial_data?.market_cap !== undefined) {
            allTokensWithMarketCap++;
          }
          if (token.dexscreener_data?.financial_data?.price_usd !== null && 
              token.dexscreener_data?.financial_data?.price_usd !== undefined) {
            allTokensWithPriceData++;
          }
        });
        
        console.log(`Recompte manuel - Total tokens: ${totalTokens}`);
        console.log(`Recompte manuel - Tokens avec market cap: ${allTokensWithMarketCap}`);
        console.log(`Recompte manuel - Tokens avec price data: ${allTokensWithPriceData}`);
        
        // Comparer avec les stats stockées
        console.log('\n⚖️ Comparaison:');
        console.log(`En base - market cap: ${record.dexscreener_tokens_with_market_cap}`);
        console.log(`En base - price data: ${record.dexscreener_tokens_with_price_data}`);
        console.log(`Recompté - market cap: ${allTokensWithMarketCap}`);
        console.log(`Recompté - price data: ${allTokensWithPriceData}`);
        
        if (allTokensWithMarketCap === record.dexscreener_tokens_with_market_cap) {
          console.log('✅ Les métriques market cap correspondent !');
        } else {
          console.log('❌ Différence dans les métriques market cap');
        }
      }
    }
    
    // Vérifier les global_enrichment_stats
    if (completeData.extracted_data?.global_enrichment_stats) {
      const globalStats = completeData.extracted_data.global_enrichment_stats;
      console.log('\n🌍 Global Enrichment Stats:');
      console.log('- total_portfolio_tokens:', globalStats.total_portfolio_tokens);
      console.log('- total_pnl_tokens:', globalStats.total_pnl_tokens);
      console.log('- enriched_portfolio_tokens:', globalStats.enriched_portfolio_tokens);
      console.log('- enriched_pnl_tokens:', globalStats.enriched_pnl_tokens);
      console.log('- tokens_with_market_cap:', globalStats.tokens_with_market_cap);
      console.log('- tokens_with_price_data:', globalStats.tokens_with_price_data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeWalletTokens();
