// Test d'enrichissement DexScreener pour les tokens PnL
// Simule exactement ce qui se passe dans l'Edge Function

const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex';

const getDexScreenerHeaders = () => ({
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
});

function safeParseFloat(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function safeParseInt(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

function calculateDexScreenerReliabilityScore(pairData) {
  let score = 0;
  const factors = {};

  const liquidityUsd = safeParseFloat(pairData.liquidity?.usd);
  if (liquidityUsd && liquidityUsd > 1000000) {
    score += 30;
    factors.liquidity = 'excellent';
  } else if (liquidityUsd && liquidityUsd > 100000) {
    score += 20;
    factors.liquidity = 'good';
  } else if (liquidityUsd && liquidityUsd > 10000) {
    score += 10;
    factors.liquidity = 'fair';
  } else {
    factors.liquidity = 'poor';
  }

  const volume24h = safeParseFloat(pairData.volume?.h24);
  if (volume24h && volume24h > 1000000) {
    score += 25;
    factors.volume_24h = 'excellent';
  } else if (volume24h && volume24h > 100000) {
    score += 20;
    factors.volume_24h = 'good';
  } else if (volume24h && volume24h > 10000) {
    score += 15;
    factors.volume_24h = 'fair';
  } else {
    factors.volume_24h = 'poor';
  }

  const marketCap = safeParseFloat(pairData.marketCap);
  if (marketCap && marketCap > 100000000) {
    score += 25;
    factors.market_cap = 'excellent';
  } else if (marketCap && marketCap > 10000000) {
    score += 20;
    factors.market_cap = 'good';
  } else if (marketCap && marketCap > 1000000) {
    score += 15;
    factors.market_cap = 'fair';
  } else {
    factors.market_cap = 'poor';
  }

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

async function enrichTokenWithDexScreener(tokenQuery) {
  try {
    console.log(`🔍 Enriching token: ${tokenQuery} via DexScreener`);
    
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

    // Afficher les 3 premiers résultats pour debug
    console.log('🔍 First 3 search results:');
    searchData.pairs.slice(0, 3).forEach((pair, i) => {
      console.log(`  ${i+1}. ${pair.baseToken?.symbol} (${pair.chainId}) - ${pair.pairAddress}`);
    });

    const solanaPair = searchData.pairs.find(pair => pair.chainId === 'solana');
    
    if (!solanaPair) {
      console.log(`❌ No Solana pair found for: ${tokenQuery}`);
      console.log(`Available chains: ${[...new Set(searchData.pairs.map(p => p.chainId))].join(', ')}`);
      return null;
    }

    console.log(`✅ Solana pair found: ${solanaPair.pairAddress}`);
    console.log(`   Symbol: ${solanaPair.baseToken?.symbol}`);
    console.log(`   Name: ${solanaPair.baseToken?.name}`);

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
      
      pair_info: {
        pair_address: pairData.pairAddress || null,
        dex_id: pairData.dexId || null,
        url: pairData.url || null,
        chain_id: pairData.chainId || null
      },
      
      financial_data: {
        price_usd: safeParseFloat(pairData.priceUsd),
        price_change_24h: safeParseFloat(pairData.priceChange?.h24),
        liquidity_usd: safeParseFloat(pairData.liquidity?.usd),
        volume_24h_usd: safeParseFloat(pairData.volume?.h24),
        fdv: safeParseFloat(pairData.fdv),
        market_cap: safeParseFloat(pairData.marketCap)
      },
      
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
      
      reliability_score: calculateDexScreenerReliabilityScore(pairData)
    };

    console.log(`✅ Token enriched via DexScreener: ${tokenQuery} - Price: $${enrichedData.financial_data.price_usd || 'N/A'}`);
    return enrichedData;
    
  } catch (error) {
    console.error(`❌ Error enriching token ${tokenQuery} via DexScreener:`, error);
    return null;
  }
}

// Test avec les tokens de l'exemple PnL
async function testPnLTokens() {
  // Tokens de l'exemple fourni
  const testTokens = [
    { token_symbol: 'SDOG', token_name: 'Smiling Dog' },
    { token_symbol: 'SOL', token_name: 'Solana' },
    // Test avec d'autres variations
    { token_symbol: 'JUP', token_name: 'Jupiter' }
  ];
  
  console.log('🚀 Testing PnL Token Enrichment with DexScreener');
  console.log('==================================================');
  
  for (const token of testTokens) {
    console.log(`\n🔄 Testing: ${token.token_symbol} (${token.token_name})`);
    console.log('-'.repeat(50));
    
    const result = await enrichTokenWithDexScreener(token.token_symbol);
    
    if (result) {
      console.log(`✅ SUCCESS for ${token.token_symbol}:`);
      console.log(`   • Symbol: ${result.token_info.symbol}`);
      console.log(`   • Name: ${result.token_info.name}`);
      console.log(`   • Price: $${result.financial_data.price_usd}`);
      console.log(`   • Market Cap: $${result.financial_data.market_cap?.toLocaleString() || 'N/A'}`);
      console.log(`   • Liquidity: $${result.financial_data.liquidity_usd?.toLocaleString() || 'N/A'}`);
      console.log(`   • Volume 24h: $${result.financial_data.volume_24h_usd?.toLocaleString() || 'N/A'}`);
      console.log(`   • Reliability: ${result.reliability_score.total_score}/100 (${result.reliability_score.rating})`);
    } else {
      console.log(`❌ FAILED for ${token.token_symbol}`);
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 PnL Token Test completed!');
}

// Exécuter le test
testPnLTokens().catch(console.error);
