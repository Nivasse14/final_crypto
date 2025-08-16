import fetch from 'node-fetch';

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU";
const CIELO_API_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api';

async function quickDiagnosis() {
  console.log('🩺 Diagnostic rapide de l\'API Cielo');

  // 1. Test health endpoint
  console.log('\n1️⃣ Test Health Endpoint...');
  try {
    const healthResponse = await fetch(`${CIELO_API_URL}/health`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`✅ Health OK - Version: ${healthData.version}`);
      console.log(`   DexScreener: ${healthData.dexscreener_enrichment?.enabled ? 'Activé' : 'Désactivé'}`);
    } else {
      console.log(`❌ Health Error: ${healthResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Health Exception: ${error.message}`);
  }

  // 2. Test de l'API directe Cielo (tRPC)
  console.log('\n2️⃣ Test Direct Cielo tRPC...');
  try {
    const walletAddress = 'CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy';
    const cieloUrl = `https://app.cielo.finance/api/trpc/profile.getWalletPortfolio?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22wallet%22%3A%22${walletAddress}%22%7D%7D%7D`;
    
    console.log('📡 Calling Cielo directly...');
    const directResponse = await fetch(cieloUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://app.cielo.finance/',
        'Origin': 'https://app.cielo.finance'
      }
    });

    if (directResponse.ok) {
      const directData = await directResponse.json();
      console.log(`✅ Cielo Direct OK`);
      if (directData[0]?.result?.data?.portfolio) {
        console.log(`   Portfolio tokens: ${directData[0].result.data.portfolio.length}`);
        console.log(`   First token: ${directData[0].result.data.portfolio[0]?.symbol || 'N/A'}`);
      } else {
        console.log(`   Pas de portfolio dans la réponse`);
      }
    } else {
      console.log(`❌ Cielo Direct Error: ${directResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Cielo Direct Exception: ${error.message}`);
  }

  // 3. Test DexScreener direct
  console.log('\n3️⃣ Test DexScreener Direct...');
  try {
    const dexResponse = await fetch('https://api.dexscreener.com/latest/dex/search/?q=SDOG');
    const dexData = await dexResponse.json();
    
    if (dexData.pairs && dexData.pairs.length > 0) {
      const solanaSDOG = dexData.pairs.filter(pair => pair.chainId === 'solana');
      console.log(`✅ DexScreener OK - SDOG pairs: ${solanaSDOG.length}`);
      if (solanaSDOG.length > 0) {
        console.log(`   Best SDOG: ${solanaSDOG[0].baseToken.symbol} - $${solanaSDOG[0].priceUsd}`);
      }
    } else {
      console.log(`❌ DexScreener - Pas de résultats pour SDOG`);
    }
  } catch (error) {
    console.log(`❌ DexScreener Exception: ${error.message}`);
  }

  // 4. Test Complete API avec timeout court
  console.log('\n4️⃣ Test Complete API (timeout 10s)...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const completeResponse = await fetch(`${CIELO_API_URL}/complete/CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (completeResponse.ok) {
      const completeData = await completeResponse.json();
      console.log(`✅ Complete API OK`);
      console.log(`   Success: ${completeData.success}`);
      console.log(`   API Version: ${completeData.api_version}`);
      console.log(`   Data Source: ${completeData.data?.data_source || 'N/A'}`);
      
      if (completeData.enrichment_stats) {
        console.log(`   Portfolio enrichi: ${completeData.enrichment_stats.dexscreener_enriched_portfolio_tokens}`);
        console.log(`   PnL enrichi: ${completeData.enrichment_stats.dexscreener_enriched_pnl_tokens}`);
      }
    } else {
      console.log(`❌ Complete API Error: ${completeResponse.status}`);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`⏰ Complete API Timeout après 10s`);
    } else {
      console.log(`❌ Complete API Exception: ${error.message}`);
    }
  }

  console.log('\n🏁 Diagnostic terminé');
}

quickDiagnosis().catch(console.error);
