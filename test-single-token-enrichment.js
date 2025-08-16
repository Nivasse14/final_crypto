// Test simple d'enrichissement d'un seul token
async function testSingleTokenEnrichment() {
  console.log('🧪 Test enrichissement simple (1 token)');
  console.log('=' .repeat(40));
  
  const tokenAddress = "So11111111111111111111111111111111111111112"; // SOL
  const network = "solana";
  
  try {
    console.log(`🦎 Test enrichissement pour: ${tokenAddress}`);
    
    // 1. Test pools
    const poolsUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${tokenAddress}/pools`;
    console.log(`📡 URL pools: ${poolsUrl}`);
    
    const poolsResponse = await fetch(poolsUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log(`📊 Pools response status: ${poolsResponse.status}`);
    
    if (poolsResponse.ok) {
      const poolsData = await poolsResponse.json();
      console.log(`✅ Pools trouvés: ${poolsData.data?.length || 0}`);
      
      if (poolsData.data && poolsData.data.length > 0) {
        const bestPool = poolsData.data.reduce((best, current) => {
          const bestReserve = parseFloat(best.attributes.reserve_in_usd) || 0;
          const currentReserve = parseFloat(current.attributes.reserve_in_usd) || 0;
          return currentReserve > bestReserve ? current : best;
        });
        
        console.log(`🏆 Meilleur pool: ${bestPool.attributes.name}`);
        console.log(`💰 Reserve USD: ${bestPool.attributes.reserve_in_usd}`);
        console.log(`💲 Token price USD: ${bestPool.attributes.token_price_usd}`);
        
        // 2. Test pool details
        const poolDetailUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${bestPool.attributes.address}?include=tokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities`;
        console.log(`\n📡 URL pool details: ${poolDetailUrl.substring(0, 120)}...`);
        
        const poolDetailResponse = await fetch(poolDetailUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });
        
        console.log(`📊 Pool details response status: ${poolDetailResponse.status}`);
        
        if (poolDetailResponse.ok) {
          const poolDetail = await poolDetailResponse.json();
          
          const tokens = poolDetail.included?.filter(item => item.type === 'token') || [];
          const tokenData = tokens.find(t => t.attributes.address === tokenAddress);
          
          const securities = poolDetail.included?.filter(item => item.type === 'token_security_metric') || [];
          const securityData = securities.find(s => s.relationships?.token?.data?.id === tokenData?.id);
          
          const liquidities = poolDetail.included?.filter(item => item.type === 'pool_locked_liquidity') || [];
          
          console.log(`\n📋 Résultats enrichissement:`);
          console.log(`  Token data: ${tokenData ? 'Trouvé' : 'Non trouvé'}`);
          console.log(`  Security data: ${securityData ? 'Trouvé' : 'Non trouvé'}`);
          console.log(`  Liquidities: ${liquidities.length} trouvées`);
          
          if (tokenData) {
            console.log(`  Total supply: ${tokenData.attributes?.total_supply || 'N/A'}`);
          }
          
          if (securityData) {
            console.log(`  Holder count: ${securityData.attributes?.holder_count || 'N/A'}`);
            console.log(`  Is honeypot: ${securityData.attributes?.is_honeypot || 'N/A'}`);
          }
          
          // Calculer le market cap
          const marketCap = tokenData?.attributes?.total_supply ? 
            parseFloat(tokenData.attributes.total_supply) * parseFloat(bestPool.attributes.token_price_usd || '0') : null;
          
          console.log(`\n💎 Métriques calculées:`);
          console.log(`  Market cap USD: ${marketCap ? '$' + marketCap.toLocaleString() : 'N/A'}`);
          console.log(`  Price USD: $${bestPool.attributes.token_price_usd || 'N/A'}`);
          console.log(`  Volume 24h: $${bestPool.attributes.volume_usd?.h24 || 'N/A'}`);
          
          console.log(`\n✅ Enrichissement réussi !`);
        } else {
          const errorText = await poolDetailResponse.text();
          console.log(`❌ Erreur pool details: ${errorText}`);
        }
      }
    } else {
      const errorText = await poolsResponse.text();
      console.log(`❌ Erreur pools: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur globale:', error.message);
  }
}

// Exécuter le test
testSingleTokenEnrichment().catch(console.error);
