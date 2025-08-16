import fetch from 'node-fetch';

// Test local de l'enrichissement DexScreener avec des données mock
const mockData = {
  portfolio: [
    {
      symbol: 'SDOG',
      mint: '4ERBJKY3NnF2z718fQcFm9Q6MnHirZHXVrdpVbhwpump',
      balance: 1000000,
      value_usd: 8.34
    },
    {
      symbol: 'BONK', 
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      balance: 50000000,
      value_usd: 12.45
    },
    {
      symbol: 'JUP',
      mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      balance: 100,
      value_usd: 85.30
    }
  ],
  
  pnl_tokens: [
    {
      token_symbol: 'SDOG',
      symbol: 'SDOG',
      mint: '4ERBJKY3NnF2z718fQcFm9Q6MnHirZHXVrdpVbhwpump',
      pnl_usd: 234.56,
      pnl_percentage: 15.7
    },
    {
      token_symbol: 'BONK',
      symbol: 'BONK',
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 
      pnl_usd: -45.23,
      pnl_percentage: -8.2
    },
    {
      token_symbol: 'JUP',
      symbol: 'JUP',
      mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      pnl_usd: 567.89,
      pnl_percentage: 45.3
    },
    {
      token_symbol: 'WIF',
      symbol: 'WIF', 
      mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
      pnl_usd: 123.45,
      pnl_percentage: 12.1
    }
  ]
};

async function enrichTokenWithDexScreener(tokenQuery) {
  try {
    console.log(`🔍 Enriching token: ${tokenQuery} via DexScreener`);
    
    // Normaliser le query
    const normalizedQuery = tokenQuery.trim().replace(/[^a-zA-Z0-9]/g, '');
    
    // Rechercher sur DexScreener
    const searchUrl = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(tokenQuery)}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.pairs || searchData.pairs.length === 0) {
      console.log(`❌ No pairs found for: ${tokenQuery}`);
      return null;
    }

    // Trouver la meilleure paire Solana
    const solanaPairs = searchData.pairs.filter(pair => pair.chainId === 'solana');
    
    if (solanaPairs.length === 0) {
      console.log(`❌ No Solana pairs found for: ${tokenQuery}`);
      return null;
    }
    
    // Privilégier les matchs exacts de symbole
    let bestPair = solanaPairs.find(pair => 
      pair.baseToken.symbol.toLowerCase() === tokenQuery.toLowerCase()
    );
    
    // Si pas de match exact, prendre le premier avec la meilleure liquidité
    if (!bestPair) {
      bestPair = solanaPairs.sort((a, b) => 
        (parseFloat(b.liquidity?.usd || '0')) - (parseFloat(a.liquidity?.usd || '0'))
      )[0];
    }

    console.log(`✅ Best pair: ${bestPair.baseToken.symbol} - $${bestPair.priceUsd}`);

    // Récupérer les détails complets
    const detailsUrl = `https://api.dexscreener.com/latest/dex/pairs/solana/${bestPair.pairAddress}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    if (!detailsData.pair) {
      console.log(`❌ No pair details found`);
      return null;
    }

    const pairData = detailsData.pair;
    return {
      search_query: tokenQuery,
      extraction_timestamp: new Date().toISOString(),
      data_source: 'DexScreener',
      
      token_info: {
        symbol: pairData.baseToken?.symbol || null,
        name: pairData.baseToken?.name || null,
        address: pairData.baseToken?.address || null
      },
      
      financial_data: {
        price_usd: parseFloat(pairData.priceUsd) || null,
        price_change_24h: parseFloat(pairData.priceChange?.h24) || null,
        liquidity_usd: parseFloat(pairData.liquidity?.usd) || null,
        volume_24h_usd: parseFloat(pairData.volume?.h24) || null,
        fdv: parseFloat(pairData.fdv) || null,
        market_cap: parseFloat(pairData.marketCap) || null
      }
    };
    
  } catch (error) {
    console.error(`❌ Error enriching ${tokenQuery}:`, error.message);
    return null;
  }
}

async function testMockEnrichment() {
  console.log('🧪 Test d\'enrichissement DexScreener avec données mock\n');

  // Test Portfolio
  console.log('📋 ENRICHISSEMENT PORTFOLIO:');
  const enrichedPortfolio = [];
  
  for (const token of mockData.portfolio) {
    console.log(`\n🔍 Processing ${token.symbol}...`);
    const enrichedData = await enrichTokenWithDexScreener(token.symbol);
    
    const enrichedToken = {
      ...token,
      dexscreener_enriched: !!enrichedData,
      dexscreener_data: enrichedData
    };
    
    if (enrichedData) {
      enrichedToken.price = enrichedData.financial_data?.price_usd;
      enrichedToken.market_cap = enrichedData.financial_data?.market_cap;
      enrichedToken.liquidity = enrichedData.financial_data?.liquidity_usd;
      enrichedToken.volume_24h = enrichedData.financial_data?.volume_24h_usd;
      enrichedToken.price_change_24h = enrichedData.financial_data?.price_change_24h;
    }
    
    enrichedPortfolio.push(enrichedToken);
    
    // Pause pour éviter rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test PnL
  console.log('\n\n💰 ENRICHISSEMENT PNL:');
  const enrichedPnL = [];
  
  for (const token of mockData.pnl_tokens) {
    console.log(`\n🔍 Processing ${token.symbol}...`);
    const enrichedData = await enrichTokenWithDexScreener(token.symbol);
    
    const enrichedToken = {
      ...token,
      dexscreener_enriched: !!enrichedData,
      dexscreener_data: enrichedData
    };
    
    if (enrichedData) {
      enrichedToken.price = enrichedData.financial_data?.price_usd;
      enrichedToken.market_cap = enrichedData.financial_data?.market_cap;
      enrichedToken.liquidity = enrichedData.financial_data?.liquidity_usd;
      enrichedToken.volume_24h = enrichedData.financial_data?.volume_24h_usd;
      enrichedToken.price_change_24h = enrichedData.financial_data?.price_change_24h;
    }
    
    enrichedPnL.push(enrichedToken);
    
    // Pause pour éviter rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Résultats
  console.log('\n\n📊 RÉSULTATS:');
  console.log(`Portfolio: ${enrichedPortfolio.filter(t => t.dexscreener_enriched).length}/${enrichedPortfolio.length} tokens enrichis`);
  console.log(`PnL: ${enrichedPnL.filter(t => t.dexscreener_enriched).length}/${enrichedPnL.length} tokens enrichis`);

  console.log('\n🏦 PORTFOLIO ENRICHI:');
  enrichedPortfolio.forEach((token, i) => {
    console.log(`${i+1}. ${token.symbol} - Enrichi: ${token.dexscreener_enriched ? '✅' : '❌'}`);
    if (token.dexscreener_enriched) {
      console.log(`   Prix: $${token.price || 'N/A'}`);
      console.log(`   Market Cap: $${token.market_cap ? token.market_cap.toLocaleString() : 'N/A'}`);
      console.log(`   Liquidité: $${token.liquidity ? token.liquidity.toLocaleString() : 'N/A'}`);
    }
  });

  console.log('\n💰 PNL ENRICHI:');
  enrichedPnL.forEach((token, i) => {
    console.log(`${i+1}. ${token.symbol} - Enrichi: ${token.dexscreener_enriched ? '✅' : '❌'}`);
    if (token.dexscreener_enriched) {
      console.log(`   Prix: $${token.price || 'N/A'}`);
      console.log(`   PnL: $${token.pnl_usd || 'N/A'}`);
      console.log(`   Market Cap: $${token.market_cap ? token.market_cap.toLocaleString() : 'N/A'}`);
    }
  });

  // Focus sur SDOG
  const sdogTokens = [...enrichedPortfolio, ...enrichedPnL].filter(token => 
    token.symbol.toLowerCase().includes('sdog')
  );

  if (sdogTokens.length > 0) {
    console.log('\n🐕 SDOG ENRICHISSEMENT:');
    sdogTokens.forEach(token => {
      console.log(`   Source: ${enrichedPortfolio.includes(token) ? 'Portfolio' : 'PnL'}`);
      console.log(`   Enrichi: ${token.dexscreener_enriched ? '✅' : '❌'}`);
      if (token.dexscreener_enriched) {
        console.log(`   Prix: $${token.price}`);
        console.log(`   Market Cap: $${token.market_cap ? token.market_cap.toLocaleString() : 'N/A'}`);
        console.log(`   Change 24h: ${token.price_change_24h ? token.price_change_24h.toFixed(2) + '%' : 'N/A'}`);
      }
    });
  }
}

testMockEnrichment().catch(console.error);
