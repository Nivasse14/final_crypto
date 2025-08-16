// Test d'enrichissement DexScreener avec les données d'exemple
// Ce script simule l'enrichissement des tokens du PnL

const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex';

// Headers pour les requêtes DexScreener
const getDexScreenerHeaders = () => ({
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
});

// Parser sécurisé pour les nombres flottants
function safeParseFloat(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

// Parser sécurisé pour les entiers
function safeParseInt(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

// Fonction pour enrichir un token avec les données DexScreener
async function enrichTokenWithDexScreener(tokenQuery) {
  try {
    console.log(`🔍 Enriching token: ${tokenQuery} via DexScreener`);
    
    // 1. Rechercher le token sur DexScreener
    const searchUrl = `${DEXSCREENER_BASE_URL}/search?q=${encodeURIComponent(tokenQuery)}`;
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: getDexScreenerHeaders()
    });

    if (!searchResponse.ok) {
      console.log(`❌ DexScreener search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      return null;
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.pairs || searchData.pairs.length === 0) {
      console.log(`❌ No pairs found for: ${tokenQuery}`);
      return null;
    }

    // 2. Trouver la première paire Solana
    const solanaPair = searchData.pairs.find(pair => pair.chainId === 'solana');
    
    if (!solanaPair) {
      console.log(`❌ No Solana pair found for: ${tokenQuery}`);
      return null;
    }

    console.log(`✅ Solana pair found: ${solanaPair.pairAddress}`);

    // 3. Récupérer les détails complets de la paire
    const detailsUrl = `${DEXSCREENER_BASE_URL}/pairs/solana/${solanaPair.pairAddress}`;
    
    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: getDexScreenerHeaders()
    });

    if (!detailsResponse.ok) {
      console.log(`❌ Pair details failed: ${detailsResponse.status} ${detailsResponse.statusText}`);
      return null;
    }

    const detailsData = await detailsResponse.json();
    
    if (!detailsData.pair) {
      console.log(`❌ No pair data found in response`);
      return null;
    }

    console.log(`✅ Pair details retrieved for: ${detailsData.pair.baseToken?.symbol || 'N/A'}`);

    // 4. Extraire et formater les données
    const pairData = detailsData.pair;
    const enrichedData = {
      search_query: tokenQuery,
      extraction_timestamp: new Date().toISOString(),
      data_source: 'DexScreener',
      
      token_info: {
        symbol: pairData.baseToken?.symbol || null,
        name: pairData.baseToken?.name || null,
        address: pairData.baseToken?.address || null
      },
      
      financial_data: {
        price_usd: safeParseFloat(pairData.priceUsd),
        price_change_24h: safeParseFloat(pairData.priceChange?.h24),
        liquidity_usd: safeParseFloat(pairData.liquidity?.usd),
        volume_24h_usd: safeParseFloat(pairData.volume?.h24),
        fdv: safeParseFloat(pairData.fdv),
        market_cap: safeParseFloat(pairData.marketCap)
      }
    };

    console.log(`✅ Token enriched: ${tokenQuery} - Price: $${enrichedData.financial_data.price_usd || 'N/A'}`);
    return enrichedData;
    
  } catch (error) {
    console.error(`❌ Error enriching token ${tokenQuery}:`, error);
    return null;
  }
}

// Tokens d'exemple extraits des données PnL
const samplePnLTokens = [
  {
    "token_symbol": "SDOG",
    "token_name": "Smiling Dog",
    "token_address": "25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk",
    "total_pnl_usd": 819.21,
    "roi_percentage": 889.28
  },
  {
    "token_symbol": "TRUMP",
    "token_name": "MAGA Token",
    "total_pnl_usd": 500.0,
    "roi_percentage": 150.0
  },
  {
    "token_symbol": "BONK",
    "token_name": "Bonk Token",
    "total_pnl_usd": 200.0,
    "roi_percentage": 80.0
  }
];

// Test principal
async function testPnLEnrichment() {
  console.log('🚀 Testing DexScreener enrichment for PnL tokens...');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (let i = 0; i < samplePnLTokens.length; i++) {
    const token = samplePnLTokens[i];
    console.log(`\n📊 Token ${i + 1}/${samplePnLTokens.length}: ${token.token_symbol}`);
    console.log('-'.repeat(40));
    
    const enrichedData = await enrichTokenWithDexScreener(token.token_symbol);
    
    if (enrichedData) {
      results.push({
        original_token: token,
        dexscreener_enriched: true,
        dexscreener_data: enrichedData,
        dexscreener_error: null
      });
      
      console.log(`✅ Success:`);
      console.log(`   • Original PnL: $${token.total_pnl_usd} (${token.roi_percentage}% ROI)`);
      console.log(`   • Current Price: $${enrichedData.financial_data.price_usd}`);
      console.log(`   • Market Cap: $${enrichedData.financial_data.market_cap?.toLocaleString() || 'N/A'}`);
      console.log(`   • Liquidity: $${enrichedData.financial_data.liquidity_usd?.toLocaleString() || 'N/A'}`);
      console.log(`   • Volume 24h: $${enrichedData.financial_data.volume_24h_usd?.toLocaleString() || 'N/A'}`);
    } else {
      results.push({
        original_token: token,
        dexscreener_enriched: false,
        dexscreener_data: null,
        dexscreener_error: 'Enrichment failed'
      });
      
      console.log(`❌ Failed to enrich ${token.token_symbol}`);
    }
    
    // Pause entre les tokens
    if (i < samplePnLTokens.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Statistiques finales
  const enrichmentStats = {
    total_tokens: samplePnLTokens.length,
    enriched_tokens: results.filter(r => r.dexscreener_enriched).length,
    tokens_with_market_cap: results.filter(r => r.dexscreener_data?.financial_data?.market_cap).length,
    tokens_with_price_data: results.filter(r => r.dexscreener_data?.financial_data?.price_usd).length
  };
  
  console.log('\n📋 ENRICHMENT STATISTICS:');
  console.log('=' .repeat(40));
  console.log(`Total tokens processed: ${enrichmentStats.total_tokens}`);
  console.log(`Successfully enriched: ${enrichmentStats.enriched_tokens}`);
  console.log(`Tokens with market cap: ${enrichmentStats.tokens_with_market_cap}`);
  console.log(`Tokens with price data: ${enrichmentStats.tokens_with_price_data}`);
  console.log(`Success rate: ${Math.round((enrichmentStats.enriched_tokens / enrichmentStats.total_tokens) * 100)}%`);
  
  console.log('\n🎯 FINAL RESULT:');
  console.log(JSON.stringify({
    enriched_tokens: results,
    enrichment_stats: enrichmentStats
  }, null, 2));
}

// Exécuter le test
testPnLEnrichment().catch(console.error);
