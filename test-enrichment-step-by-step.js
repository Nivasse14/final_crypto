import fetch from 'node-fetch';

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU";
const CIELO_API_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api';

async function testEnrichmentStep() {
  console.log('🧪 Test spécifique enrichissement DexScreener\n');

  // 1. Test des APIs individuelles d'abord
  console.log('1️⃣ Test Portfolio API...');
  try {
    const portfolioResponse = await fetch(`${CIELO_API_URL}/portfolio/CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (portfolioResponse.ok) {
      const portfolioData = await portfolioResponse.json();
      console.log(`✅ Portfolio récupéré: ${portfolioData.data?.tokens?.length || 0} tokens`);
      
      if (portfolioData.data?.tokens?.length > 0) {
        console.log('📋 Tokens du portfolio:');
        portfolioData.data.tokens.slice(0, 3).forEach((token, i) => {
          console.log(`   ${i+1}. ${token.symbol || 'Unknown'} (${token.mint})`);
          console.log(`      - Balance: ${token.balance}`);
          console.log(`      - Enrichi DexScreener: ${token.dexscreener_enriched ? '✅' : '❌'}`);
          if (token.dexscreener_enriched) {
            console.log(`      - Prix: $${token.price || 'N/A'}`);
          }
        });
      }
    } else {
      console.log(`❌ Erreur Portfolio: ${portfolioResponse.status}`);
    }
  } catch (error) {
    console.log(`⚠️  Erreur Portfolio: ${error.message}`);
  }

  console.log('\n2️⃣ Test PnL API...');
  try {
    const pnlResponse = await fetch(`${CIELO_API_URL}/pnl/CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy?page=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (pnlResponse.ok) {
      const pnlData = await pnlResponse.json();
      console.log(`✅ PnL récupéré: ${pnlData.data?.tokens?.length || 0} tokens`);
      
      if (pnlData.data?.tokens?.length > 0) {
        console.log('📋 Tokens PnL:');
        pnlData.data.tokens.slice(0, 3).forEach((token, i) => {
          console.log(`   ${i+1}. ${token.symbol || 'Unknown'} (${token.mint || 'Unknown'})`);
          console.log(`      - PnL: ${token.pnl_usd || 'N/A'}`);
          console.log(`      - Enrichi DexScreener: ${token.dexscreener_enriched ? '✅' : '❌'}`);
          if (token.dexscreener_enriched) {
            console.log(`      - Prix: $${token.price || 'N/A'}`);
          }
        });
      }
    } else {
      console.log(`❌ Erreur PnL: ${pnlResponse.status}`);
    }
  } catch (error) {
    console.log(`⚠️  Erreur PnL: ${error.message}`);
  }

  // 3. Test DexScreener direct sur SDOG
  console.log('\n3️⃣ Test DexScreener direct pour SDOG...');
  try {
    const dexResponse = await fetch('https://api.dexscreener.com/latest/dex/search/?q=SDOG');
    const dexData = await dexResponse.json();
    
    if (dexData.pairs && dexData.pairs.length > 0) {
      const solanaSDOG = dexData.pairs.filter(pair => 
        pair.chainId === 'solana' && 
        pair.baseToken.symbol.toLowerCase().includes('sdog')
      );
      
      console.log(`✅ DexScreener SDOG: ${solanaSDOG.length} pairs trouvés`);
      if (solanaSDOG.length > 0) {
        const best = solanaSDOG[0];
        console.log(`   - Symbol: ${best.baseToken.symbol}`);
        console.log(`   - Address: ${best.baseToken.address}`);
        console.log(`   - Prix: $${best.priceUsd}`);
        console.log(`   - Liquidité: $${best.liquidity?.usd || 'N/A'}`);
        console.log(`   - Volume 24h: $${best.volume?.h24 || 'N/A'}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Erreur DexScreener: ${error.message}`);
  }

  // 4. Test du complete endpoint avec monitoring
  console.log('\n4️⃣ Test API Complete (avec timeout 15s)...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const completeResponse = await fetch(`${CIELO_API_URL}/complete/CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (completeResponse.ok) {
      const completeData = await completeResponse.json();
      console.log(`✅ Complete API success`);
      console.log(`📊 Status: ${completeData.status}`);
      
      if (completeData.enrichment_stats) {
        console.log('\n📈 Stats d\'enrichissement:');
        console.log(`   - Portfolio enrichi: ${completeData.enrichment_stats.dexscreener_enriched_portfolio_tokens || 0}`);
        console.log(`   - PnL enrichi: ${completeData.enrichment_stats.dexscreener_enriched_pnl_tokens || 0}`);
      }

      // Chercher SDOG spécifiquement
      const allTokens = [
        ...(completeData.data?.portfolio_tokens || []),
        ...(completeData.data?.pnl_tokens || [])
      ];

      const sdogTokens = allTokens.filter(token => 
        token.symbol && token.symbol.toLowerCase().includes('sdog')
      );

      if (sdogTokens.length > 0) {
        console.log('\n🐕 Tokens SDOG trouvés:');
        sdogTokens.forEach(token => {
          console.log(`   - ${token.symbol}: enrichi = ${token.dexscreener_enriched ? '✅' : '❌'}`);
          if (token.dexscreener_enriched) {
            console.log(`     Prix: $${token.price || 'N/A'}`);
            console.log(`     Market Cap: $${token.market_cap || 'N/A'}`);
          }
        });
      } else {
        console.log('\n🔍 Aucun token SDOG trouvé dans la réponse');
      }

    } else {
      console.log(`❌ Complete API error: ${completeResponse.status}`);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ Timeout - l\'API met trop de temps à répondre');
    } else {
      console.log(`⚠️  Erreur Complete API: ${error.message}`);
    }
  }
}

testEnrichmentStep().catch(console.error);
