const fetch = require('cross-fetch');

const GECKOTERMINAL_CONFIG = {
  baseUrl: 'https://app.geckoterminal.com/api/p1',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
};

// Test avec différents tokens populaires Solana
const testTokens = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
  '5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC'  // RNDR
];

async function testGeckoTerminalP1API() {
  console.log('🧪 Test de l\'API GeckoTerminal P1 avec structure complète\n');

  for (const tokenAddress of testTokens) {
    console.log(`\n📍 Test du token: ${tokenAddress}`);
    
    try {
      // Test de l'API pools
      const poolsUrl = `${GECKOTERMINAL_CONFIG.baseUrl}/networks/solana/tokens/${tokenAddress}/pools?include=dex&page=1&limit=3`;
      console.log(`🔗 URL: ${poolsUrl}`);
      
      const response = await fetch(poolsUrl, {
        headers: GECKOTERMINAL_CONFIG.headers
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          const mainPool = data.data[0];
          const attrs = mainPool.attributes;
          
          console.log(`✅ Pool trouvé pour ${tokenAddress}:`);
          console.log(`   - Pool ID: ${mainPool.id}`);
          console.log(`   - Nom: ${attrs.name}`);
          console.log(`   - Prix base token: $${attrs.base_token_price_usd}`);
          console.log(`   - Symbol: ${attrs.base_token_symbol}`);
          console.log(`   - Market Cap: $${attrs.market_cap_usd}`);
          console.log(`   - FDV: $${attrs.fdv_usd}`);
          console.log(`   - Liquidité: $${attrs.reserve_in_usd}`);
          console.log(`   - Volume 24h: $${attrs.volume_usd?.h24}`);
          console.log(`   - Volume 1h: $${attrs.volume_usd?.h1}`);
          console.log(`   - Volume 6h: $${attrs.volume_usd?.h6}`);
          console.log(`   - Change 1h: ${attrs.price_change_percentage?.h1}%`);
          console.log(`   - Change 6h: ${attrs.price_change_percentage?.h6}%`);
          console.log(`   - Change 24h: ${attrs.price_change_percentage?.h24}%`);
          console.log(`   - Transactions 24h: ${attrs.transactions?.h24?.buys} achats, ${attrs.transactions?.h24?.sells} ventes`);
          console.log(`   - Pool address: ${attrs.address}`);
          console.log(`   - DEX: ${mainPool.relationships?.dex?.data?.id}`);
          console.log(`   - Base token address: ${attrs.base_token_address}`);
          console.log(`   - Quote token address: ${attrs.quote_token_address}`);
          console.log(`   - Pool créé le: ${attrs.pool_created_at}`);

          // Mapper vers la structure de la table wallet_tokens_extended
          const enrichedData = {
            gecko_enriched: true,
            gecko_id: mainPool.id,
            gecko_name: attrs.name,
            gecko_symbol: attrs.base_token_symbol,
            price_usd: attrs.base_token_price_usd ? parseFloat(attrs.base_token_price_usd) : null,
            market_cap_usd: attrs.market_cap_usd ? parseFloat(attrs.market_cap_usd) : null,
            fdv_usd: attrs.fdv_usd ? parseFloat(attrs.fdv_usd) : null,
            liquidity_usd: attrs.reserve_in_usd ? parseFloat(attrs.reserve_in_usd) : null,
            volume_24h_usd: attrs.volume_usd?.h24 ? parseFloat(attrs.volume_usd.h24) : null,
            volume_1h_usd: attrs.volume_usd?.h1 ? parseFloat(attrs.volume_usd.h1) : null,
            volume_6h_usd: attrs.volume_usd?.h6 ? parseFloat(attrs.volume_usd.h6) : null,
            price_change_percentage_1h: attrs.price_change_percentage?.h1 ? parseFloat(attrs.price_change_percentage.h1) : null,
            price_change_percentage_6h: attrs.price_change_percentage?.h6 ? parseFloat(attrs.price_change_percentage.h6) : null,
            price_change_percentage_24h: attrs.price_change_percentage?.h24 ? parseFloat(attrs.price_change_percentage.h24) : null,
            transactions_24h_buys: attrs.transactions?.h24?.buys || null,
            transactions_24h_sells: attrs.transactions?.h24?.sells || null,
            transactions_1h_buys: attrs.transactions?.h1?.buys || null,
            transactions_1h_sells: attrs.transactions?.h1?.sells || null,
            pool_address: attrs.address || null,
            dex: mainPool.relationships?.dex?.data?.id || null,
            base_token_address: attrs.base_token_address || tokenAddress,
            quote_token_address: attrs.quote_token_address || null,
            pool_created_at: attrs.pool_created_at || null
          };

          console.log(`📊 Données enrichies mappées:`, JSON.stringify(enrichedData, null, 2));
          
        } else {
          console.log(`❌ Aucun pool trouvé pour ${tokenAddress}`);
        }
      } else {
        console.log(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error(`💥 Erreur pour ${tokenAddress}:`, error.message);
    }
    
    // Pause pour éviter les rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Test avec un token spécifique
async function testSingleToken(tokenAddress) {
  console.log(`\n🔍 Test approfondi du token: ${tokenAddress}\n`);
  
  try {
    const poolsUrl = `${GECKOTERMINAL_CONFIG.baseUrl}/networks/solana/tokens/${tokenAddress}/pools?include=dex&page=1&limit=5`;
    console.log(`🔗 URL: ${poolsUrl}`);
    
    const response = await fetch(poolsUrl, {
      headers: GECKOTERMINAL_CONFIG.headers
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📥 Réponse complète:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Erreur HTTP ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.log(`📄 Détails de l'erreur:`, errorText);
    }
  } catch (error) {
    console.error(`💥 Erreur:`, error);
  }
}

// Exécuter les tests
async function runTests() {
  await testGeckoTerminalP1API();
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 Test approfondi avec SOL');
  await testSingleToken('So11111111111111111111111111111111111111112');
}

runTests().catch(console.error);
