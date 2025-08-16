// Test simple de l'Edge Function cielo-api
const testWallet = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB";

async function testCieloAPI() {
  console.log('🧪 Test de la nouvelle Edge Function cielo-api');
  console.log('=' .repeat(50));
  
  const baseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api';
  
  try {
    // Test 1: Endpoint de base (documentation)
    console.log('\n📍 Test 1: Endpoint de base');
    const docResponse = await fetch(baseUrl);
    console.log(`Status: ${docResponse.status}`);
    
    if (docResponse.ok) {
      const docData = await docResponse.json();
      console.log('✅ Documentation:', JSON.stringify(docData, null, 2));
    } else {
      console.log('❌ Erreur:', await docResponse.text());
    }
    
    // Test 2: Portfolio endpoint
    console.log('\n📍 Test 2: Portfolio endpoint');
    const portfolioResponse = await fetch(`${baseUrl}/portfolio/${testWallet}`);
    console.log(`Status: ${portfolioResponse.status}`);
    
    if (portfolioResponse.ok) {
      const portfolioData = await portfolioResponse.json();
      console.log('✅ Portfolio data available');
      console.log('Portfolio tokens:', portfolioData.data?.portfolio?.length || 0);
    } else {
      console.log('❌ Erreur portfolio:', await portfolioResponse.text());
    }
    
    // Test 3: Stats endpoint
    console.log('\n📍 Test 3: Stats endpoint');
    const statsResponse = await fetch(`${baseUrl}/stats/${testWallet}`);
    console.log(`Status: ${statsResponse.status}`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Stats data available');
      console.log('PnL:', statsData.data?.total_pnl_usd || 'N/A');
      console.log('Winrate:', statsData.data?.winrate || 'N/A');
    } else {
      console.log('❌ Erreur stats:', await statsResponse.text());
    }
    
    // Test 4: Complete endpoint (plus lourd)
    console.log('\n📍 Test 4: Complete endpoint (peut prendre du temps...)');
    const completeResponse = await fetch(`${baseUrl}/complete/${testWallet}`);
    console.log(`Status: ${completeResponse.status}`);
    
    if (completeResponse.ok) {
      const completeData = await completeResponse.json();
      console.log('✅ Complete data available');
      console.log('Data source:', completeData.data?.data_source || 'N/A');
      console.log('Extracted data success:', completeData.data?.extracted_data?.success || false);
    } else {
      console.log('❌ Erreur complete:', await completeResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Erreur globale:', error.message);
  }
}

// Exécuter le test
testCieloAPI().catch(console.error);
