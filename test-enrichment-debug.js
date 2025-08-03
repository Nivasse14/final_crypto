// Test d'enrichissement Gecko avec Node.js (pas Deno)
const fetch = require('cross-fetch');

const GECKOTERMINAL_CONFIG = {
  baseUrl: 'https://api.geckoterminal.com/api/v2',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
};

async function geckoterminalRequest(endpoint) {
  const fullUrl = `${GECKOTERMINAL_CONFIG.baseUrl}${endpoint}`;
  
  try {
    console.log(`🦎 [GECKO REQUEST] ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: GECKOTERMINAL_CONFIG.headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`🔍 [GECKO 404] Token/Pool non trouvé sur Geckoterminal`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📥 [GECKO SUCCESS] Données reçues pour ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`💥 [GECKO ERROR] ${fullUrl}:`, error.message);
    return null;
  }
}

async function enrichTokenWithGecko(token, network = 'solana') {
  if (!token.token_address) {
    console.log(`⚠️ [GECKO] Pas d'adresse token pour ${token.token_symbol || 'Unknown'}`);
    return token;
  }

  try {
    const endpoint = `/networks/${network}/tokens/${token.token_address}`;
    console.log(`🔄 [GECKO] Tentative enrichissement: ${token.token_symbol} (${token.token_address})`);
    
    const geckoData = await geckoterminalRequest(endpoint);
    
    if (geckoData && geckoData.data && geckoData.data.attributes) {
      const attrs = geckoData.data.attributes;
      const enrichedData = {
        gecko_price_usd: attrs.price_usd,
        gecko_market_cap_usd: attrs.market_cap_usd,
        gecko_volume_24h: attrs.volume_usd?.h24,
        gecko_fdv_usd: attrs.fdv_usd,
        gecko_total_supply: attrs.total_supply,
        gecko_updated_at: new Date().toISOString()
      };
      
      console.log(`✅ [GECKO ENRICHED] ${token.token_address} - Prix: $${attrs.price_usd}`);
      return { ...token, ...enrichedData };
    } else {
      console.log(`⚠️ [GECKO] Pas de données dans la réponse pour ${token.token_address}`);
      console.log(`🔍 [GECKO] Structure reçue:`, geckoData ? Object.keys(geckoData) : 'null');
    }
  } catch (error) {
    console.log(`⚠️ [GECKO SKIP] ${token.token_address}: ${error.message}`);
  }
  
  return token;
}

// Test avec les tokens du portefeuille ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB
async function testEnrichment() {
  console.log('🚀 Test d\'enrichissement avec les tokens réels\n');
  
  const testTokens = [
    {
      token_address: '25PwuUsuJ4PHtZ4TCprvmrVkbNQNvYuWj1CZd2xqbonk',
      token_symbol: 'SDOG',
      token_name: 'SDOG'
    },
    {
      token_address: 'DYtHi5uNo54QZBeiFBGajZPpaW8wX1qSzaSDRKvSbonk',
      token_symbol: 'STKE',
      token_name: 'STKE'
    },
    {
      token_address: '5RkMx3egmwMXFvsgyUwryu3LmmA4F8LDBmvEjEtJbonk',
      token_symbol: 'AH3000',
      token_name: 'AH3000'
    }
  ];
  
  for (let i = 0; i < testTokens.length; i++) {
    const token = testTokens[i];
    console.log(`\n🪙 Test ${i+1}/${testTokens.length} - Enrichissement pour ${token.token_symbol}:`);
    console.log(`   📍 Adresse: ${token.token_address}`);
    
    const enriched = await enrichTokenWithGecko(token);
    
    if (enriched.gecko_price_usd) {
      console.log(`✅ Enrichi avec succès:`);
      console.log(`   💰 Prix: $${enriched.gecko_price_usd}`);
      console.log(`   📊 Market Cap: $${enriched.gecko_market_cap_usd || 'N/A'}`);
      console.log(`   📈 Volume 24h: $${enriched.gecko_volume_24h || 'N/A'}`);
    } else {
      console.log(`❌ Échec d'enrichissement`);
    }
    
    // Petite pause entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n🏁 Test terminé');
}

testEnrichment().catch(console.error);
