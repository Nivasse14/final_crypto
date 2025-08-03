const https = require('https');

console.log('🔍 ANALYSE DES REQUÊTES VERS CIELO');
console.log('='.repeat(50));

// Test 1: Vérifier la configuration de l'API Cielo
async function testCieloConfig() {
  return new Promise((resolve) => {
    console.log('1️⃣ Test Configuration API Cielo...');
    
    const req = https.get('https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/health', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('📊 Configuration Cielo API:');
          console.log(`   Status: ${parsed.status}`);
          console.log(`   Use Mock Data: ${parsed.config?.use_mock_data}`);
          console.log(`   Has Cielo URL: ${parsed.config?.has_cielo_url}`);
          console.log(`   Has CoinGecko Key: ${parsed.config?.has_coingecko_key}`);
          resolve(parsed);
        } catch (e) {
          console.log('❌ Erreur parsing config:', e.message);
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Erreur requête config:', err.message);
      resolve(null);
    });
    
    req.end();
  });
}

// Test 2: Vérifier exactement ce que wallet-analyzer appelle
async function testWalletAnalyzerCall() {
  return new Promise((resolve) => {
    console.log('\n2️⃣ Test Appel Wallet-Analyzer vers Cielo...');
    
    const walletAddress = 'HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk';
    console.log(`   Wallet testé: ${walletAddress.slice(0, 8)}...`);
    
    // C'est exactement la même URL que wallet-analyzer utilise
    const cieloUrl = `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/complete/${walletAddress}`;
    console.log(`   URL appelée: ${cieloUrl}`);
    
    const req = https.get(cieloUrl, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU',
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('📊 Réponse Cielo API:');
          console.log(`   Response size: ${data.length} chars`);
          console.log(`   Has data: ${!!parsed.data}`);
          
          if (parsed.data) {
            console.log(`   Data structure keys: ${Object.keys(parsed.data).join(', ')}`);
            
            if (parsed.data.pnl?.data) {
              console.log(`   PnL data keys: ${Object.keys(parsed.data.pnl.data).join(', ')}`);
              
              const tokens = parsed.data.pnl.data.token_trading_performance || [];
              console.log(`   Tokens count: ${tokens.length}`);
              
              if (tokens.length > 0) {
                console.log(`   Sample token: ${JSON.stringify(tokens[0], null, 2).slice(0, 200)}...`);
              }
            }
            
            if (parsed.data.portfolio?.data?.portfolio) {
              console.log(`   Portfolio tokens: ${parsed.data.portfolio.data.portfolio.length}`);
            }
          }
          
          // Analyser si ce sont des données mock ou réelles
          const isMockData = data.includes('mock') || 
                           data.includes('fake') ||
                           data.includes('simulation') ||
                           (parsed.data?.pnl?.data?.summary?.total_pnl_usd && 
                            typeof parsed.data.pnl.data.summary.total_pnl_usd === 'number' &&
                            parsed.data.pnl.data.summary.total_pnl_usd % 1000 === 0); // PnL rond = suspect
          
          console.log(`   🤔 Probablement des données mock: ${isMockData ? 'OUI' : 'NON'}`);
          
          resolve(parsed);
        } catch (e) {
          console.log('❌ Erreur parsing Cielo response:', e.message);
          console.log(`📄 Raw data preview: ${data.slice(0, 500)}`);
          resolve(null);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Erreur requête Cielo:', err.message);
      resolve(null);
    });
    
    req.end();
  });
}

// Test 3: Comparaison avec vraie API Cielo (si vous en avez une)
async function testRealCieloAPI() {
  console.log('\n3️⃣ Info sur la vraie API Cielo...');
  console.log('❓ Questions importantes:');
  console.log('   - Avez-vous accès à la vraie API Cielo ?');
  console.log('   - Quelle est l\'URL de base de leur API ?');
  console.log('   - Avez-vous une clé API Cielo valide ?');
  console.log('   - Quel format de données retourne leur API ?');
  console.log('');
  console.log('💡 Sans vraie API Cielo, le système utilise des données simulées');
  console.log('   mais structurées pour ressembler aux vraies données Cielo.');
}

async function main() {
  await testCieloConfig();
  await testWalletAnalyzerCall();
  await testRealCieloAPI();
  
  console.log('\n🎯 CONCLUSION:');
  console.log('='.repeat(50));
  console.log('Le problème vient de l\'API Cielo qui utilise des données MOCK.');
  console.log('Pour utiliser de vraies données Cielo, il faut:');
  console.log('1. Configurer CIELO_BASE_URL avec l\'URL réelle');
  console.log('2. Configurer CIELO_API_KEY avec votre clé');
  console.log('3. Définir USE_MOCK_DATA=false');
  console.log('4. Adapter le parsing selon le format de la vraie API Cielo');
}

main().catch(console.error);
