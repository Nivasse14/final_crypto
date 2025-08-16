import fetch from 'node-fetch';

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU";
const CIELO_API_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api';

async function testEnrichedResponse() {
  console.log('🧪 Test de la nouvelle structure enrichie');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes

    console.log('📡 Calling Complete API...');
    const completeResponse = await fetch(`${CIELO_API_URL}/complete/CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!completeResponse.ok) {
      console.log(`❌ API Error: ${completeResponse.status} ${completeResponse.statusText}`);
      return;
    }

    const responseData = await completeResponse.json();
    console.log(`✅ API Response received`);

    // 1. Vérifier les stats d'enrichissement
    if (responseData.enrichment_stats) {
      console.log('\n📈 ENRICHMENT STATS:');
      console.log(`   Portfolio enrichi: ${responseData.enrichment_stats.dexscreener_enriched_portfolio_tokens}`);
      console.log(`   PnL enrichi: ${responseData.enrichment_stats.dexscreener_enriched_pnl_tokens}`);
      console.log(`   Tokens avec Market Cap: ${responseData.enrichment_stats.dexscreener_tokens_with_market_cap}`);
      console.log(`   Tokens avec Price Data: ${responseData.enrichment_stats.dexscreener_tokens_with_price_data}`);
      console.log(`   Score de fiabilité moyen: ${responseData.enrichment_stats.dexscreener_average_reliability_score}`);
    } else {
      console.log('⚠️  Pas de stats d\'enrichissement trouvées');
    }

    // 2. Vérifier les tokens du portfolio
    if (responseData.portfolio_tokens && responseData.portfolio_tokens.length > 0) {
      console.log('\n🏦 PORTFOLIO TOKENS:');
      let enrichedCount = 0;
      
      responseData.portfolio_tokens.slice(0, 5).forEach((token, index) => {
        const isEnriched = token.dexscreener_enriched;
        enrichedCount += isEnriched ? 1 : 0;
        console.log(`${index + 1}. ${token.symbol || 'Unknown'}`);
        console.log(`   - Enrichi: ${isEnriched ? '✅' : '❌'}`);
        if (isEnriched) {
          console.log(`   - Prix: $${token.price || 'N/A'}`);
          console.log(`   - Market Cap: $${token.market_cap ? token.market_cap.toLocaleString() : 'N/A'}`);
          console.log(`   - Liquidité: $${token.liquidity ? token.liquidity.toLocaleString() : 'N/A'}`);
          console.log(`   - Score: ${token.reliability_score || 'N/A'}`);
        }
      });
      
      console.log(`📊 Portfolio: ${enrichedCount}/${Math.min(5, responseData.portfolio_tokens.length)} tokens enrichis (échantillon)`);
    } else {
      console.log('⚠️  Pas de tokens portfolio trouvés');
    }

    // 3. Vérifier les tokens PnL
    if (responseData.pnl_tokens && responseData.pnl_tokens.length > 0) {
      console.log('\n💰 PNL TOKENS:');
      let enrichedCount = 0;
      
      responseData.pnl_tokens.slice(0, 5).forEach((token, index) => {
        const isEnriched = token.dexscreener_enriched;
        enrichedCount += isEnriched ? 1 : 0;
        console.log(`${index + 1}. ${token.symbol || token.token_symbol || 'Unknown'}`);
        console.log(`   - Enrichi: ${isEnriched ? '✅' : '❌'}`);
        if (isEnriched) {
          console.log(`   - Prix: $${token.price || 'N/A'}`);
          console.log(`   - Market Cap: $${token.market_cap ? token.market_cap.toLocaleString() : 'N/A'}`);
          console.log(`   - Volume 24h: $${token.volume_24h ? token.volume_24h.toLocaleString() : 'N/A'}`);
          console.log(`   - Score: ${token.reliability_score || 'N/A'}`);
        }
      });
      
      console.log(`📊 PnL: ${enrichedCount}/${Math.min(5, responseData.pnl_tokens.length)} tokens enrichis (échantillon)`);
    } else {
      console.log('⚠️  Pas de tokens PnL trouvés');
    }

    // 4. Rechercher spécifiquement SDOG/sDog
    const allTokens = [
      ...(responseData.portfolio_tokens || []),
      ...(responseData.pnl_tokens || [])
    ];

    const sdogTokens = allTokens.filter(token => {
      const symbol = token.symbol || token.token_symbol || '';
      return symbol.toLowerCase().includes('sdog') || symbol.toLowerCase().includes('dog');
    });

    if (sdogTokens.length > 0) {
      console.log('\n🐕 SDOG/DOG TOKENS TROUVÉS:');
      sdogTokens.forEach((token, index) => {
        console.log(`${index + 1}. ${token.symbol || token.token_symbol} - Enrichi: ${token.dexscreener_enriched ? '✅' : '❌'}`);
        if (token.dexscreener_enriched) {
          console.log(`   Prix: $${token.price || 'N/A'}`);
          console.log(`   Market Cap: $${token.market_cap ? token.market_cap.toLocaleString() : 'N/A'}`);
          console.log(`   Liquidité: $${token.liquidity ? token.liquidity.toLocaleString() : 'N/A'}`);
        }
      });
    } else {
      console.log('\n🔍 Aucun token SDOG/DOG trouvé');
    }

    // 5. Statistiques générales
    console.log('\n📊 RÉSUMÉ GÉNÉRAL:');
    console.log(`   Total Portfolio Tokens: ${responseData.portfolio_tokens?.length || 0}`);
    console.log(`   Total PnL Tokens: ${responseData.pnl_tokens?.length || 0}`);
    console.log(`   API Version: ${responseData.api_version}`);
    console.log(`   Success: ${responseData.success}`);

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ Timeout - l\'API met trop de temps à répondre');
    } else {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
}

testEnrichedResponse().catch(console.error);
