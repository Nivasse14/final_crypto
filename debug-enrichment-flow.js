import fetch from 'node-fetch';

// Script pour diagnostiquer l'enrichissement DexScreener dans le flow complet
const CIELO_API_URL = process.env.CIELO_API_URL || 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api';

async function testCompleteFlow(walletAddress) {
  console.log(`\n🔍 Test complet enrichissement DexScreener pour: ${walletAddress}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${CIELO_API_URL}/complete/${walletAddress}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const endTime = Date.now();
    
    console.log(`⏱️  Durée totale: ${endTime - startTime}ms`);
    console.log(`📊 Status: ${data.status}`);
    
    // Analyser les stats d'enrichissement
    if (data.enrichment_stats) {
      console.log('\n📈 Stats d\'enrichissement:');
      console.log(`- Portfolio tokens enrichis: ${data.enrichment_stats.dexscreener_enriched_portfolio_tokens || 0}`);
      console.log(`- PnL tokens enrichis: ${data.enrichment_stats.dexscreener_enriched_pnl_tokens || 0}`);
    }

    // Vérifier les tokens du portfolio
    if (data.data?.portfolio_tokens?.length > 0) {
      console.log('\n🏦 PORTFOLIO TOKENS:');
      let enrichedCount = 0;
      data.data.portfolio_tokens.forEach((token, index) => {
        const isEnriched = token.dexscreener_enriched;
        enrichedCount += isEnriched ? 1 : 0;
        console.log(`${index + 1}. ${token.symbol || 'Unknown'} (${token.mint})`);
        console.log(`   - Enrichi: ${isEnriched ? '✅' : '❌'}`);
        if (isEnriched) {
          console.log(`   - Prix: $${token.price || 'N/A'}`);
          console.log(`   - Market Cap: $${token.market_cap ? token.market_cap.toLocaleString() : 'N/A'}`);
          console.log(`   - Liquidité: $${token.liquidity ? token.liquidity.toLocaleString() : 'N/A'}`);
        }
      });
      console.log(`📊 Portfolio enrichi: ${enrichedCount}/${data.data.portfolio_tokens.length}`);
    }

    // Vérifier les tokens PnL
    if (data.data?.pnl_tokens?.length > 0) {
      console.log('\n💰 PNL TOKENS:');
      let enrichedCount = 0;
      data.data.pnl_tokens.forEach((token, index) => {
        const isEnriched = token.dexscreener_enriched;
        enrichedCount += isEnriched ? 1 : 0;
        console.log(`${index + 1}. ${token.symbol || 'Unknown'} (${token.mint})`);
        console.log(`   - Enrichi: ${isEnriched ? '✅' : '❌'}`);
        if (isEnriched) {
          console.log(`   - Prix: $${token.price || 'N/A'}`);
          console.log(`   - Market Cap: $${token.market_cap ? token.market_cap.toLocaleString() : 'N/A'}`);
          console.log(`   - Volume 24h: $${token.volume_24h ? token.volume_24h.toLocaleString() : 'N/A'}`);
        }
      });
      console.log(`📊 PnL enrichi: ${enrichedCount}/${data.data.pnl_tokens.length}`);
    }

    // Test de mapping symbole vers adresse pour quelques tokens
    console.log('\n🔍 Test de mapping direct DexScreener pour tokens trouvés:');
    const allTokens = [
      ...(data.data?.portfolio_tokens || []),
      ...(data.data?.pnl_tokens || [])
    ];
    
    const uniqueTokens = allTokens.reduce((acc, token) => {
      if (token.symbol && !acc.find(t => t.symbol === token.symbol)) {
        acc.push(token);
      }
      return acc;
    }, []);

    for (const token of uniqueTokens.slice(0, 5)) { // Test sur les 5 premiers
      await testDirectDexScreener(token.symbol, token.mint);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

async function testDirectDexScreener(symbol, mint) {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(symbol)}`);
    const data = await response.json();
    
    if (data.pairs && data.pairs.length > 0) {
      const solanaTokens = data.pairs.filter(pair => 
        pair.chainId === 'solana' && 
        (pair.baseToken.symbol.toLowerCase() === symbol.toLowerCase() || 
         pair.baseToken.address === mint)
      );
      
      console.log(`  🔍 ${symbol}: ${solanaTokens.length} pairs trouvés sur Solana`);
      if (solanaTokens.length > 0) {
        const best = solanaTokens[0];
        console.log(`    ✅ Meilleur match: ${best.baseToken.symbol} (${best.baseToken.address})`);
        console.log(`    💰 Prix: $${best.priceUsd || 'N/A'}`);
      }
    } else {
      console.log(`  ❌ ${symbol}: Aucun résultat trouvé`);
    }
  } catch (error) {
    console.log(`  ⚠️  ${symbol}: Erreur API - ${error.message}`);
  }
}

// Test avec plusieurs wallets
const testWallets = [
  'CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy', // Wallet avec SDOG dans le PnL
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',  // Autre wallet de test
];

async function runAllTests() {
  for (const wallet of testWallets) {
    await testCompleteFlow(wallet);
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

runAllTests().catch(console.error);
