const https = require('https');

// Test détaillé de l'appel wallet-analyzer complet
const WALLET_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-analyzer/complete/HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🔍 Testing wallet-analyzer complete analysis...');
console.log('URL:', WALLET_URL);

const req = https.get(WALLET_URL, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 60000
}, (res) => {
  console.log(`✅ Response Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`📄 Response Size: ${data.length} chars`);
      console.log(`🔗 Data source: ${parsed.data_source}`);
      console.log(`🎯 Analysis type: ${parsed.analysis_type}`);
      console.log(`🎯 Alpha score: ${parsed.data?.alpha_analysis?.alpha_score}`);
      console.log(`📈 Total PnL: ${parsed.data?.trade_analysis?.total_pnl_usd}`);
      console.log(`🏆 Win rate: ${parsed.data?.trade_analysis?.win_rate}%`);
      console.log(`💰 Total volume: ${parsed.data?.trade_analysis?.total_volume_usd}`);
      console.log(`🪙 Unique tokens: ${parsed.data?.trade_analysis?.unique_tokens}`);
      console.log(`🎲 Recommendation: ${parsed.data?.copy_trading_recommendations?.recommendation}`);
      console.log(`💼 Allocation: ${parsed.data?.copy_trading_recommendations?.suggested_allocation_percentage}%`);
      
      if (parsed.data?.token_analysis?.tokens?.length > 0) {
        console.log('\n🎲 Sample token:', parsed.data.token_analysis.tokens[0]);
      }
      
      // Vérifier si les données varient (pas toutes identiques)
      if (parsed.data?.alpha_analysis?.alpha_score === 8.5 && 
          parsed.data?.trade_analysis?.total_pnl_usd === 65000) {
        console.log('\n❌ PROBLÈME: Les données semblent être identiques/mockées!');
      } else {
        console.log('\n✅ Les données semblent variées et réalistes');
      }
      
    } catch (e) {
      console.log(`❌ JSON Parse Error: ${e.message}`);
      console.log(`📄 Raw response (first 1000 chars): ${data.slice(0, 1000)}`);
    }
  });
});

req.on('error', (err) => {
  console.log(`❌ Request Error: ${err.message}`);
});

req.on('timeout', () => {
  console.log('⏰ Request Timeout');
  req.destroy();
});

req.end();
