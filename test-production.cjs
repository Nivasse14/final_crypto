#!/usr/bin/env node

// Test de la fonction Cielo API en production
const https = require('https');

const testWallet = '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5';
const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

async function testCieloAPI() {
  console.log('🧪 Testing Cielo API in production...');
  console.log(`📍 Wallet: ${testWallet}`);
  console.log(`🌐 URL: ${supabaseUrl}/functions/v1/cielo-api`);
  
  const postData = JSON.stringify({
    wallet_address: testWallet
  });

  const options = {
    hostname: 'xkndddxqqlxqknbqtefv.supabase.co',
    port: 443,
    path: '/functions/v1/cielo-api',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 120000 // 2 minutes timeout
  };

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      console.log('📋 Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
        process.stdout.write('.');
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log(`\n⏱️  Response time: ${duration}s`);
        
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ Response received:');
          console.log(JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (e) {
          console.log('📄 Raw response:');
          console.log(data);
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('⏰ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Test principal
async function main() {
  try {
    console.log('🚀 Starting production test...\n');
    const result = await testCieloAPI();
    console.log('\n🎉 Test completed successfully!');
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

main();
