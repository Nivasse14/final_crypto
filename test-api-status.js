const https = require('https');

// Configuration
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function testAPI(url, name) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing ${name}...`);
    
    const startTime = Date.now();
    const timeout = setTimeout(() => {
      console.log(`⏰ ${name} - TIMEOUT (30s)`);
      resolve({ name, status: 'timeout', responseTime: 30000 });
    }, 30000);
    
    const req = https.get(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`✅ ${name} - Status: ${res.statusCode}, Time: ${responseTime}ms`);
          console.log(`📊 Response size: ${data.length} chars`);
          
          if (parsed.data_source) {
            console.log(`🔗 Data source: ${parsed.data_source}`);
          }
          if (parsed.data?.alpha_analysis?.alpha_score) {
            console.log(`🎯 Alpha score: ${parsed.data.alpha_analysis.alpha_score}`);
          }
          if (parsed.status) {
            console.log(`💡 Status: ${parsed.status}`);
          }
          
          resolve({ 
            name, 
            status: res.statusCode, 
            responseTime, 
            dataSize: data.length,
            parsed 
          });
        } catch (e) {
          console.log(`❌ ${name} - JSON Parse Error: ${e.message}`);
          console.log(`📄 Raw response (first 200 chars): ${data.slice(0, 200)}`);
          resolve({ name, status: 'parse_error', responseTime, data: data.slice(0, 200) });
        }
      });
    });
    
    req.on('error', (err) => {
      clearTimeout(timeout);
      console.log(`❌ ${name} - Request Error: ${err.message}`);
      resolve({ name, status: 'error', error: err.message });
    });
    
    req.end();
  });
}

async function main() {
  console.log('🚀 Testing Supabase APIs Status...\n');
  
  const tests = [
    {
      url: `${SUPABASE_URL}/functions/v1/wallet-analyzer/health`,
      name: 'Wallet Analyzer Health'
    },
    {
      url: `${SUPABASE_URL}/functions/v1/cielo-api/health`,
      name: 'Cielo API Health'
    },
    {
      url: `${SUPABASE_URL}/functions/v1/wallet-analyzer/quick/7C8zYC`,
      name: 'Wallet Analyzer Quick'
    },
    {
      url: `${SUPABASE_URL}/functions/v1/cielo-api/complete/7C8zYC`,
      name: 'Cielo API Complete'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testAPI(test.url, test.name);
    results.push(result);
    console.log(''); // Ligne vide entre les tests
  }
  
  console.log('📋 RÉSUMÉ DES TESTS:');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const status = result.status === 200 ? '✅' : 
                   result.status === 'timeout' ? '⏰' : 
                   result.status === 'error' ? '❌' : '⚠️';
    console.log(`${status} ${result.name}: ${result.status} (${result.responseTime || 'N/A'}ms)`);
  });
  
  // Vérifier si l'API wallet-analyzer appelle vraiment Cielo
  const walletResult = results.find(r => r.name === 'Wallet Analyzer Quick');
  if (walletResult && walletResult.parsed && walletResult.parsed.data_source) {
    console.log('\n🔍 ANALYSE DES DONNÉES:');
    console.log(`📊 Source des données wallet-analyzer: ${walletResult.parsed.data_source}`);
    
    if (walletResult.parsed.data_source === 'REAL_CIELO_API') {
      console.log('✅ L\'API wallet-analyzer utilise bien les données Cielo réelles');
    } else if (walletResult.parsed.data_source === 'FALLBACK_NO_CIELO') {
      console.log('⚠️ L\'API wallet-analyzer utilise les données de fallback (Cielo ne répond pas)');
    } else {
      console.log('❓ Source de données inconnue ou problème de détection');
    }
  }
}

main().catch(console.error);
