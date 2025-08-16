// Script de test pour l'enrichissement Geckoterminal
const testWallet = "DBparSN3fbzMQsCRuCZNp3vi7wapaPsLVqzSGj5qEbVH"; // Wallet des requêtes tRPC originales

async function testGeckoterminalEnrichment() {
  console.log('🧪 Test enrichissement Geckoterminal');
  console.log('=' .repeat(50));
  
  const baseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';
  
  try {
    // 1. Récupérer le portfolio pour voir les tokens disponibles
    console.log('\n📋 Étape 1: Récupération du portfolio');
    const portfolioResponse = await fetch(`${baseUrl}/portfolio/${testWallet}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!portfolioResponse.ok) {
      throw new Error(`Portfolio error: ${portfolioResponse.status}`);
    }
    
    const portfolioData = await portfolioResponse.json();
    console.log('Portfolio tokens count:', portfolioData.data?.portfolio?.length || 0);
    
    if (portfolioData.data?.portfolio?.length > 0) {
      console.log('Premier token du portfolio:');
      const firstToken = portfolioData.data.portfolio[0];
      console.log('  Symbol:', firstToken.symbol || 'N/A');
      console.log('  Mint:', firstToken.mint || 'N/A');
      console.log('  USD Value:', firstToken.usd_value || 'N/A');
      
      // Test manuel de l'enrichissement Geckoterminal pour ce token
      if (firstToken.mint && firstToken.mint !== 'undefined') {
        console.log('\n🦎 Étape 2: Test enrichissement Geckoterminal manuel');
        const geckoUrl = `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${firstToken.mint}/pools`;
        
        try {
          const geckoResponse = await fetch(geckoUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          });
          
          console.log('Geckoterminal status:', geckoResponse.status);
          
          if (geckoResponse.ok) {
            const geckoData = await geckoResponse.json();
            console.log('Pools trouvés:', geckoData.data?.length || 0);
            
            if (geckoData.data && geckoData.data.length > 0) {
              const firstPool = geckoData.data[0];
              console.log('Pool info:');
              console.log('  Name:', firstPool.attributes?.name || 'N/A');
              console.log('  Reserve USD:', firstPool.attributes?.reserve_in_usd || 'N/A');
              console.log('  Token price USD:', firstPool.attributes?.token_price_usd || 'N/A');
              console.log('  Volume 24h:', firstPool.attributes?.volume_usd?.h24 || 'N/A');
            }
          } else {
            const errorText = await geckoResponse.text();
            console.log('Erreur Geckoterminal:', errorText);
          }
        } catch (geckoError) {
          console.log('Erreur test Geckoterminal:', geckoError.message);
        }
      }
    }
    
    // 3. Test de l'endpoint complete avec enrichissement
    console.log('\n📊 Étape 3: Test endpoint complete avec enrichissement');
    const completeResponse = await fetch(`${baseUrl}/complete/${testWallet}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Complete endpoint status:', completeResponse.status);
    
    if (completeResponse.ok) {
      const completeData = await completeResponse.json();
      console.log('Data source:', completeData.data?.data_source || 'N/A');
      
      // Vérifier si l'enrichissement Geckoterminal a eu lieu
      const extractedData = completeData.data?.extracted_data;
      if (extractedData) {
        console.log('\n🔍 Résultats enrichissement:');
        console.log('  Success:', extractedData.success);
        console.log('  Portfolio tokens:', extractedData.portfolio?.token_count || 0);
        console.log('  Geckoterminal portfolio:', extractedData.geckoterminal_portfolio ? 'Présent' : 'Absent');
        console.log('  Geckoterminal PnL:', extractedData.geckoterminal_pnl ? 'Présent' : 'Absent');
        
        if (extractedData.global_enrichment_stats) {
          const stats = extractedData.global_enrichment_stats;
          console.log('  Stats enrichissement globales:');
          console.log('    Total portfolio tokens:', stats.total_portfolio_tokens);
          console.log('    Enriched portfolio tokens:', stats.enriched_portfolio_tokens);
          console.log('    Tokens with market cap:', stats.tokens_with_market_cap);
          console.log('    Average reliability score:', stats.average_reliability_score);
        }
      }
      
      // Vérifier les données enrichies détaillées
      if (completeData.data?.enriched_portfolio?.enriched_tokens) {
        const enrichedTokens = completeData.data.enriched_portfolio.enriched_tokens;
        console.log('\n✅ Tokens enrichis dans le portfolio:', enrichedTokens.length);
        
        enrichedTokens.slice(0, 3).forEach((token, index) => {
          console.log(`  Token ${index + 1}:`);
          console.log(`    Symbol: ${token.symbol || 'N/A'}`);
          console.log(`    Enriched: ${token.geckoterminal_enriched || false}`);
          console.log(`    Market cap: ${token.geckoterminal_data?.market_cap_usd || 'N/A'}`);
          console.log(`    Error: ${token.geckoterminal_error || 'None'}`);
        });
      }
      
    } else {
      const errorText = await completeResponse.text();
      console.log('Erreur complete endpoint:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erreur globale:', error.message);
  }
}

// Exécuter le test
testGeckoterminalEnrichment().catch(console.error);
