#!/usr/bin/env node

/**
 * Test simple pour debug l'API Cielo
 */

const https = require('https');

async function simpleTest() {
  return new Promise((resolve, reject) => {
    const url = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/health';
    
    console.log(`🔍 Testing URL: ${url}`);
    
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTI5NDcsImV4cCI6MjA2OTA4ODk0N30.w1TJf8D7dqU9LlhIZTIZ4sIX5xp5mO4Zx-zOPJQwSF0',
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        console.log(`📄 Response Data:`);
        try {
          const jsonData = JSON.parse(data);
          console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log(data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.error('❌ Request timeout');
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

simpleTest().catch(console.error);
