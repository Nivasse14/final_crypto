// Test simple d'intégration DexScreener pour l'Edge Function
// Ce script simule l'enrichissement DexScreener comme dans l'Edge Function

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

// Calculer un score de fiabilité basé sur les données DexScreener
function calculateDexScreenerReliabilityScore(pairData) {
  let score = 0;
  const factors = {};

  // Facteur 1: Liquidité (0-30 points)
  const liquidityUsd = safeParseFloat(pairData.liquidity?.usd);
  if (liquidityUsd && liquidityUsd > 1000000) { // > 1M USD
    score += 30;
    factors.liquidity = 'excellent';
  } else if (liquidityUsd && liquidityUsd > 100000) { // > 100k USD
    score += 20;
    factors.liquidity = 'good';
  } else if (liquidityUsd && liquidityUsd > 10000) { // > 10k USD
    score += 10;
    factors.liquidity = 'fair';
  } else {
    factors.liquidity = 'poor';
  }

  // Facteur 2: Volume 24h (0-25 points)
  const volume24h = safeParseFloat(pairData.volume?.h24);
  if (volume24h && volume24h > 1000000) { // > 1M USD
    score += 25;
    factors.volume_24h = 'excellent';
  } else if (volume24h && volume24h > 100000) { // > 100k USD
    score += 20;
    factors.volume_24h = 'good';
  } else if (volume24h && volume24h > 10000) { // > 10k USD
    score += 15;
    factors.volume_24h = 'fair';
  } else {
    factors.volume_24h = 'poor';
  }

  // Facteur 3: Market Cap (0-25 points)
  const marketCap = safeParseFloat(pairData.marketCap);
  if (marketCap && marketCap > 100000000) { // > 100M USD
    score += 25;
    factors.market_cap = 'excellent';
  } else if (marketCap && marketCap > 10000000) { // > 10M USD
    score += 20;
    factors.market_cap = 'good';
  } else if (marketCap && marketCap > 1000000) { // > 1M USD
    score += 15;
    factors.market_cap = 'fair';
  } else {
    factors.market_cap = 'poor';
  }

  // Facteur 4: Activité de trading (0-20 points)
  const buys24h = safeParseInt(pairData.txns?.h24?.buys);
  const sells24h = safeParseInt(pairData.txns?.h24?.sells);
  const totalTxns = (buys24h || 0) + (sells24h || 0);
  
  if (totalTxns > 1000) {
    score += 20;
    factors.trading_activity = 'high';
  } else if (totalTxns > 100) {
    score += 15;
    factors.trading_activity = 'medium';
  } else if (totalTxns > 10) {
    score += 10;
    factors.trading_activity = 'low';
  } else {
    factors.trading_activity = 'very_low';
  }

  return {
    total_score: Math.min(score, 100),
    factors,
    rating: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
  };
}

// Fonction pour enrichir un token avec les données DexScreener
async function enrichTokenWithDexScreener(tokenQuery) {
  try {
    console.log(`🔍 Enriching token: ${tokenQuery} via DexScreener`);
    
    // 1. Rechercher le token sur DexScreener
    const searchUrl = `${DEXSCREENER_BASE_URL}/search?q=${encodeURIComponent(tokenQuery)}`;
    console.log(`📡 DexScreener search: ${searchUrl}`);
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: getDexScreenerHeaders()
    });

    if (!searchResponse.ok) {
      console.log(`❌ DexScreener search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      return null;
    }

    const searchData = await searchResponse.json();
    console.log(`📊 Search results: ${searchData.pairs?.length || 0} pairs found`);
    
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
    console.log(`📡 Pair details: ${detailsUrl}`);
    
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
      // Métadonnées de recherche
      search_query: tokenQuery,
      extraction_timestamp: new Date().toISOString(),
      data_source: 'DexScreener',
      
      // Informations de base du token
      token_info: {
        symbol: pairData.baseToken?.symbol || null,
        name: pairData.baseToken?.name || null,
        address: pairData.baseToken?.address || null
      },
      
      // Informations de la paire
      pair_info: {
        pair_address: pairData.pairAddress || null,
        dex_id: pairData.dexId || null,
        url: pairData.url || null,
        chain_id: pairData.chainId || null
      },
      
      // Données financières principales
      financial_data: {
        price_usd: safeParseFloat(pairData.priceUsd),
        price_change_24h: safeParseFloat(pairData.priceChange?.h24),
        liquidity_usd: safeParseFloat(pairData.liquidity?.usd),
        volume_24h_usd: safeParseFloat(pairData.volume?.h24),
        fdv: safeParseFloat(pairData.fdv),
        market_cap: safeParseFloat(pairData.marketCap)
      },
      
      // Données étendues
      extended_data: {
        price_change_5m: safeParseFloat(pairData.priceChange?.m5),
        price_change_1h: safeParseFloat(pairData.priceChange?.h1),
        price_change_6h: safeParseFloat(pairData.priceChange?.h6),
        volume_5m: safeParseFloat(pairData.volume?.m5),
        volume_1h: safeParseFloat(pairData.volume?.h1),
        volume_6h: safeParseFloat(pairData.volume?.h6),
        transactions_24h_buys: safeParseInt(pairData.txns?.h24?.buys),
        transactions_24h_sells: safeParseInt(pairData.txns?.h24?.sells)
      },
      
      // Score de fiabilité calculé
      reliability_score: calculateDexScreenerReliabilityScore(pairData)
    };

    console.log(`✅ Token enriched via DexScreener: ${tokenQuery} - Price: $${enrichedData.financial_data.price_usd || 'N/A'}`);
    return enrichedData;
    
  } catch (error) {
    console.error(`❌ Error enriching token ${tokenQuery} via DexScreener:`, error);
    return null;
  }
}

// Test principal
async function main() {
  const testTokens = ['jup', 'bonk', 'sol'];
  
  console.log('🚀 Testing DexScreener integration...');
  console.log('====================================');
  
  for (const token of testTokens) {
    console.log(`\n🔄 Testing: ${token.toUpperCase()}`);
    console.log('-'.repeat(30));
    
    const result = await enrichTokenWithDexScreener(token);
    
    if (result) {
      console.log(`✅ Success for ${token.toUpperCase()}:`);
      console.log(`   • Symbol: ${result.token_info.symbol}`);
      console.log(`   • Price: $${result.financial_data.price_usd}`);
      console.log(`   • Market Cap: $${result.financial_data.market_cap?.toLocaleString() || 'N/A'}`);
      console.log(`   • Liquidity: $${result.financial_data.liquidity_usd?.toLocaleString() || 'N/A'}`);
      console.log(`   • Volume 24h: $${result.financial_data.volume_24h_usd?.toLocaleString() || 'N/A'}`);
      console.log(`   • Reliability Score: ${result.reliability_score.total_score}/100 (${result.reliability_score.rating})`);
    } else {
      console.log(`❌ Failed for ${token.toUpperCase()}`);
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Test completed!');
}

// Exécuter le test
main().catch(console.error);
