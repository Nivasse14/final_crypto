#!/usr/bin/env node

// Test des endpoints qui fonctionnent déjà pour comprendre la structure
const wallet = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB";

const CIELO_CONFIG = {
  baseUrl: 'https://feed-api.cielo.finance/v1',
  headers: {
    'Api-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aW1lc3RhbXAiOjE3NTM1NTAxNjV9.auH6IR4uqg8NlkhyT82sEpav6mvvvRnMMf6hjOnSd0w',
    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZGRyZXNzIjoiNkhQRVQ3UkxZZHZ6Z0hTVHVhRWNWbTRoTTV3VkxYa3Z2OTVOWm4yYW0xNGkiLCJpc3MiOiJodHRwczovL2FwaS51bml3aGFsZXMuaW8vIiwic3ViIjoidXNlciIsInBsYW4iOiJiYXNpYyIsImJhbGFuY2UiOjAsImlhdCI6MTc1MzU1MDAxNywiZXhwIjoxNzUzNTYwODE3fQ.t99299sp1pEKJnr8B61GLdj4e6f3bs29uM4xCLUpqVE',
    'Content-Type': 'application/json'
  }
};

console.log("🔍 ANALYSE DES ENDPOINTS FONCTIONNELS CIELO");
console.log("=" .repeat(60));

// Endpoints qui fonctionnent déjà dans notre API
const workingEndpoints = [
  `/wallet/${wallet}`,
  `/wallet/${wallet}/portfolio`,
  `/wallet/${wallet}/stats`,
  `/wallet/${wallet}/pnl`,
  `/enhanced-stats/aggregated/${wallet}?days=7`,
  `/enhanced-stats/aggregated/${wallet}?days=max`,
  `/enhanced-stats/profitability/${wallet}`
];

async function testEndpoint(endpoint) {
  const fullUrl = `${CIELO_CONFIG.baseUrl}${endpoint}`;
  
  try {
    console.log(`\n🔍 Test: ${endpoint}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: CIELO_CONFIG.headers
    });
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Type:`, typeof data);
      console.log(`   🗂️ Keys:`, Object.keys(data || {}));
      
      // Chercher des indices sur les tokens
      const dataStr = JSON.stringify(data).toLowerCase();
      const hasTokens = dataStr.includes('token') || dataStr.includes('symbol') || dataStr.includes('mint');
      console.log(`   🪙 Contient des tokens: ${hasTokens ? '✅' : '❌'}`);
      
      if (hasTokens) {
        const preview = JSON.stringify(data, null, 2).substring(0, 500);
        console.log(`   📋 Aperçu avec tokens:`, preview + "...");
      }
      
      return { endpoint, success: true, data, hasTokens };
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      return { endpoint, success: false, status: response.status };
    }
    
  } catch (error) {
    console.log(`   💥 Erreur: ${error.message}`);
    return { endpoint, success: false, error: error.message };
  }
}

async function discoverEndpoints() {
  console.log(`\n🚀 Test des endpoints fonctionnels pour découvrir la structure...\n`);
  
  const results = [];
  
  for (const endpoint of workingEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log("📊 ANALYSE DES DONNÉES");
  console.log("=" .repeat(60));
  
  const withTokens = results.filter(r => r.success && r.hasTokens);
  const successful = results.filter(r => r.success);
  
  console.log(`\n✅ Endpoints fonctionnels: ${successful.length}/${results.length}`);
  console.log(`🪙 Endpoints avec données de tokens: ${withTokens.length}`);
  
  if (withTokens.length > 0) {
    console.log(`\n🎯 ENDPOINTS AVEC TOKENS:`);
    withTokens.forEach(r => {
      console.log(`   📍 ${r.endpoint}`);
    });
    
    console.log(`\n💡 RECOMMANDATION:`);
    console.log(`   Les données de tokens semblent être disponibles dans:`);
    console.log(`   ${withTokens[0].endpoint}`);
    console.log(`   Analyser la structure de ces données pour les tokens-pnl`);
  }
  
  // Test d'endpoints alternatifs basés sur la découverte
  console.log(`\n🔍 TEST D'ENDPOINTS ALTERNATIFS...`);
  
  const alternativeEndpoints = [
    `/wallet/${wallet}/trades`,
    `/wallet/${wallet}/transactions`,
    `/wallet/${wallet}/positions`,
    `/wallet/${wallet}/holdings`,
    `/wallet/${wallet}/activity`,
    `/trades/${wallet}`,
    `/transactions/${wallet}`,
    `/positions/${wallet}`
  ];
  
  console.log(`\n🧪 Test de ${alternativeEndpoints.length} endpoints alternatifs...`);
  
  for (const endpoint of alternativeEndpoints) {
    const result = await testEndpoint(endpoint);
    if (result.success) {
      console.log(`\n🎉 NOUVEL ENDPOINT DÉCOUVERT: ${endpoint}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

discoverEndpoints().catch(console.error);
