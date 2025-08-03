#!/usr/bin/env node

// Test simplifié pour tokens-pnl avec la config exacte de notre API Supabase
const wallet = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB";

// Configuration identique à celle de notre API Supabase
const CIELO_CONFIG = {
  baseUrl: 'https://feed-api.cielo.finance/v1',
  headers: {
    'Api-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aW1lc3RhbXAiOjE3NTM1NTAxNjV9.auH6IR4uqg8NlkhyT82sEpav6mvvvRnMMf6hjOnSd0w',
    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZGRyZXNzIjoiNkhQRVQ3UkxZZHZ6Z0hTVHVhRWNWbTRoTTV3VkxYa3Z2OTVOWm4yYW0xNGkiLCJpc3MiOiJodHRwczovL2FwaS51bml3aGFsZXMuaW8vIiwic3ViIjoidXNlciIsInBsYW4iOiJiYXNpYyIsImJhbGFuY2UiOjAsImlhdCI6MTc1MzU1MDAxNywiZXhwIjoxNzUzNTYwODE3fQ.t99299sp1pEKJnr8B61GLdj4e6f3bs29uM4xCLUpqVE',
    'Content-Type': 'application/json'
  }
};

console.log("🪙 TEST TOKENS-PNL - CONFIGURATION EXACTE SUPABASE");
console.log("=" .repeat(60));
console.log(`🎯 Wallet: ${wallet}`);
console.log(`🌐 Base URL: ${CIELO_CONFIG.baseUrl}`);

// Endpoints basés sur l'analyse TRPC et les patterns observés
const endpoints = [
  // Pattern profile.fetchTokenPnlSlow -> profile/tokens
  `/profile/tokens?wallet=${wallet}`,
  `/profile/tokens/${wallet}`,
  
  // Pattern TRPC direct
  `/profile/fetchTokenPnlSlow?wallet=${wallet}&page=1`,
  `/profile/fetch-token-pnl-slow?wallet=${wallet}&page=1`,
  
  // Pattern wallet-based observé dans d'autres endpoints
  `/wallet/${wallet}/tokens`,
  `/wallet/${wallet}/tokens-pnl`,
  `/wallet/${wallet}/token-pnl`,
  
  // Patterns courts
  `/tokens/${wallet}`,
  `/tokens?wallet=${wallet}`,
  
  // Pattern avec paramètres complets TRPC
  `/profile/tokens?wallet=${wallet}&chains=&timeframe=&sortBy=&page=1&tokenFilter=`
];

async function testEndpoint(endpoint) {
  const fullUrl = `${CIELO_CONFIG.baseUrl}${endpoint}`;
  
  try {
    console.log(`\n🔍 Test: ${endpoint}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: CIELO_CONFIG.headers
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`   ✅ SUCCÈS!`);
      console.log(`   📊 Type de données:`, typeof data);
      console.log(`   📝 Structure:`, Object.keys(data || {}));
      
      // Afficher un aperçu limité des données
      const preview = JSON.stringify(data, null, 2).substring(0, 300);
      console.log(`   📋 Aperçu:`, preview + "...");
      
      return { endpoint, success: true, data };
    } else {
      const text = await response.text();
      console.log(`   ❌ Échec: ${text.substring(0, 100)}`);
      return { endpoint, success: false, status: response.status };
    }
    
  } catch (error) {
    console.log(`   💥 Erreur: ${error.message}`);
    return { endpoint, success: false, error: error.message };
  }
}

async function main() {
  console.log(`\n🚀 Test de ${endpoints.length} endpoints possibles...\n`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Pause pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log("📊 RÉSULTATS");
  console.log("=" .repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log(`\n✅ ENDPOINTS FONCTIONNELS (${successful.length}):`);
    successful.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.endpoint}`);
    });
    
    console.log(`\n🎯 RECOMMANDATION:`);
    console.log(`   Utiliser: ${successful[0].endpoint}`);
  } else {
    console.log(`\n❌ AUCUN ENDPOINT FONCTIONNEL (${failed.length} échecs)`);
  }
  
  console.log(`\n📋 TOUS LES RÉSULTATS:`);
  results.forEach((r, i) => {
    const status = r.success ? '✅' : '❌';
    const detail = r.success ? 'OK' : (r.status || r.error || 'Erreur');
    console.log(`   ${i + 1}. ${status} ${r.endpoint} - ${detail}`);
  });
}

main().catch(console.error);
