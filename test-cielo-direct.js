const https = require('https');

// Test direct de l'appel Cielo depuis l'extérieur
const CIELO_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/complete/HN7cABqLq2oxHxGxQdx5FgAqjygzuWiE3E9LTJMw7LBk';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🔍 Testing Cielo API call exactly like wallet-analyzer does...');
console.log('URL:', CIELO_URL);

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 45000
};

const req = https.get(CIELO_URL, options, (res) => {
  console.log(`✅ Response Status: ${res.statusCode}`);
  console.log(`📊 Response Headers:`, res.headers);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`📄 Response Size: ${data.length} chars`);
      console.log(`🎯 Success:`, !!parsed.success);
      console.log(`🪙 Tokens count:`, parsed.tokens?.length || 0);
      console.log(`📊 Wallet stats:`, !!parsed.wallet_stats);
      
      if (parsed.tokens && parsed.tokens.length > 0) {
        console.log(`🎲 Sample token:`, {
          symbol: parsed.tokens[0].token_symbol,
          pnl: parsed.tokens[0].total_pnl_usd,
          volume: parsed.tokens[0].total_volume_usd
        });
      }
      
      console.log('\n✅ Cielo API Response is valid and contains data');
    } catch (e) {
      console.log(`❌ JSON Parse Error: ${e.message}`);
      console.log(`📄 Raw response (first 500 chars): ${data.slice(0, 500)}`);
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
