import fetch from 'node-fetch';

const CIELO_BASE_URL = 'https://app.cielo.finance';

async function testSDOGWallet() {
  console.log('🐕 Test spécifique du wallet SDOG avec l\'approche qui marche');
  
  const walletAddress = 'CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy';
  
  console.log(`\n📋 Test Portfolio pour: ${walletAddress.slice(0, 8)}...`);
  
  try {
    // Utiliser l'approche simple qui a marché
    const portfolioUrl = `${CIELO_BASE_URL}/api/trpc/profile.getWalletPortfolio?batch=1&input={"0":{"json":{"wallet":"${walletAddress}"}}}`;
    
    console.log('📡 Portfolio request...');
    const portfolioResponse = await fetch(portfolioUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Portfolio Status: ${portfolioResponse.status}`);
    
    if (portfolioResponse.ok) {
      const portfolioData = await portfolioResponse.json();
      console.log(`✅ Portfolio Success! Data length: ${JSON.stringify(portfolioData).length}`);
      
      if (portfolioData[0]?.result?.data?.portfolio) {
        console.log(`📊 Portfolio tokens: ${portfolioData[0].result.data.portfolio.length}`);
        
        // Afficher les premiers tokens
        portfolioData[0].result.data.portfolio.slice(0, 5).forEach((token, i) => {
          console.log(`   ${i+1}. ${token.symbol || 'Unknown'} - Balance: ${token.balance}`);
        });
      } else {
        console.log(`⚠️  Structure portfolio différente:`, Object.keys(portfolioData[0]?.result?.data || {}));
      }
    } else {
      console.log(`❌ Portfolio Error: ${portfolioResponse.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Portfolio Exception: ${error.message}`);
  }

  // Attendre avant la requête PnL
  console.log('\n⏳ Pause de 2 secondes...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`\n💰 Test PnL pour: ${walletAddress.slice(0, 8)}...`);
  
  try {
    const pnlUrl = `${CIELO_BASE_URL}/api/trpc/profile.fetchTokenPnlFast?batch=1&input={"0":{"json":{"wallet":"${walletAddress}","chains":"","timeframe":"max","sortBy":"","page":"1","tokenFilter":""}}}`;
    
    console.log('📡 PnL request...');
    const pnlResponse = await fetch(pnlUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 PnL Status: ${pnlResponse.status}`);
    
    if (pnlResponse.ok) {
      const pnlData = await pnlResponse.json();
      console.log(`✅ PnL Success! Data length: ${JSON.stringify(pnlData).length}`);
      
      // Chercher les tokens dans différentes structures
      let tokens = null;
      if (pnlData[0]?.result?.data?.json?.data?.tokens) {
        tokens = pnlData[0].result.data.json.data.tokens;
        console.log(`📊 PnL tokens (json structure): ${tokens.length}`);
      } else if (pnlData[0]?.result?.data?.tokens) {
        tokens = pnlData[0].result.data.tokens;
        console.log(`📊 PnL tokens (direct structure): ${tokens.length}`);
      } else {
        console.log(`⚠️  Structure PnL différente:`, Object.keys(pnlData[0]?.result?.data || {}));
      }
      
      if (tokens && tokens.length > 0) {
        console.log('\n📋 Premiers tokens PnL:');
        tokens.slice(0, 5).forEach((token, i) => {
          console.log(`   ${i+1}. ${token.symbol || token.token_symbol || 'Unknown'} - PnL: ${token.pnl_usd || 'N/A'}`);
        });
        
        // Chercher SDOG spécifiquement
        const sdogTokens = tokens.filter(token => {
          const symbol = token.symbol || token.token_symbol || '';
          return symbol.toLowerCase().includes('sdog') || symbol.toLowerCase().includes('dog');
        });
        
        if (sdogTokens.length > 0) {
          console.log(`\n🐕 SDOG tokens trouvés: ${sdogTokens.length}`);
          sdogTokens.forEach(token => {
            console.log(`   - ${token.symbol || token.token_symbol}: PnL ${token.pnl_usd || 'N/A'}`);
            console.log(`     Adresse: ${token.mint || 'N/A'}`);
          });
          
          // Si on trouve SDOG, testons l'enrichissement DexScreener
          console.log(`\n🦎 Test enrichissement DexScreener pour SDOG...`);
          const sdogSymbol = sdogTokens[0].symbol || sdogTokens[0].token_symbol;
          
          try {
            const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(sdogSymbol)}`);
            const dexData = await dexResponse.json();
            
            if (dexData.pairs && dexData.pairs.length > 0) {
              const solanaSDOG = dexData.pairs.filter(pair => pair.chainId === 'solana');
              console.log(`   ✅ DexScreener: ${solanaSDOG.length} pairs Solana trouvés`);
              
              if (solanaSDOG.length > 0) {
                const best = solanaSDOG[0];
                console.log(`   🏆 Meilleur match: ${best.baseToken.symbol}`);
                console.log(`      Prix: $${best.priceUsd}`);
                console.log(`      Liquidité: $${best.liquidity?.usd || 'N/A'}`);
                console.log(`      Volume 24h: $${best.volume?.h24 || 'N/A'}`);
              }
            } else {
              console.log(`   ❌ DexScreener: Pas de résultats pour ${sdogSymbol}`);
            }
            
          } catch (dexError) {
            console.log(`   ❌ DexScreener error: ${dexError.message}`);
          }
          
        } else {
          console.log(`\n🔍 Aucun token SDOG/DOG trouvé dans ce wallet`);
        }
      }
    } else {
      console.log(`❌ PnL Error: ${pnlResponse.status}`);
    }
    
  } catch (error) {
    console.log(`❌ PnL Exception: ${error.message}`);
  }
}

testSDOGWallet().catch(console.error);
