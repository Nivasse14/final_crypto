import fetch from 'node-fetch';

// Test avec différents wallets et méthodes
const CIELO_BASE_URL = 'https://app.cielo.finance';

async function testDifferentApproaches() {
  console.log('🔄 Test de différentes approches pour contourner le 403');

  // Wallets de test différents
  const testWallets = [
    'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', // Un wallet populaire
    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',  // Autre wallet
    'CobcsUrt3p91FwvULYKorQejgsm5HoQdv5T6eqb2srTy'  // Notre wallet avec SDOG
  ];

  for (let i = 0; i < testWallets.length; i++) {
    const wallet = testWallets[i];
    console.log(`\n${i + 1}️⃣ Test wallet: ${wallet.slice(0, 8)}...`);
    
    try {
      // Essayer une URL plus simple d'abord
      const simpleUrl = `${CIELO_BASE_URL}/api/trpc/profile.getWalletPortfolio?batch=1&input={"0":{"json":{"wallet":"${wallet}"}}}`;
      
      console.log('   📡 Simple URL approach...');
      const response = await fetch(simpleUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      console.log(`   📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success! Data length: ${JSON.stringify(data).length}`);
        
        if (data[0]?.result?.data?.portfolio) {
          console.log(`   📊 Portfolio tokens: ${data[0].result.data.portfolio.length}`);
          break; // On a trouvé un wallet qui marche !
        }
      } else if (response.status === 403) {
        console.log(`   ❌ Still 403 - trying with delay...`);
        
        // Attendre avant le prochain test
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test alternative: vérifier si la page principale de Cielo est accessible
  console.log('\n🌐 Test de la page principale Cielo...');
  try {
    const mainPageResponse = await fetch('https://app.cielo.finance/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log(`   📊 Main page status: ${mainPageResponse.status}`);
    
    if (mainPageResponse.ok) {
      const content = await mainPageResponse.text();
      console.log(`   ✅ Main page accessible (${content.length} chars)`);
      
      // Vérifier s'il y a des indices dans le HTML
      if (content.includes('api/trpc')) {
        console.log(`   🔍 tRPC références trouvées dans le HTML`);
      }
      
      if (content.includes('cloudflare') || content.includes('security')) {
        console.log(`   🛡️  Protection Cloudflare détectée`);
      }
      
    } else {
      console.log(`   ❌ Main page blocked: ${mainPageResponse.status}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Main page error: ${error.message}`);
  }

  // Test de notre propre endpoint health pour comparaison
  console.log('\n🩺 Test de notre API health...');
  try {
    const healthResponse = await fetch('https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/health');
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   ✅ Notre API fonctionne - Version: ${healthData.version}`);
    } else {
      console.log(`   ❌ Notre API a un problème: ${healthResponse.status}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Health error: ${error.message}`);
  }
}

testDifferentApproaches().catch(console.error);
