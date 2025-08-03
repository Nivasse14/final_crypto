#!/usr/bin/env node

// Analyse détaillée de l'endpoint enhanced-stats/aggregated pour les tokens
const wallet = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB";

const CIELO_CONFIG = {
  baseUrl: 'https://feed-api.cielo.finance/v1',
  headers: {
    'Api-Key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aW1lc3RhbXAiOjE3NTM1NTAxNjV9.auH6IR4uqg8NlkhyT82sEpav6mjjOnSd0w',
    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhZGRyZXNzIjoiNkhQRVQ3UkxZZHZ6Z0hTVHVhRWNWbTRoTTV3VkxYa3Z2OTVOWm4yYW0xNGkiLCJpc3MiOiJodHRwczovL2FwaS51bml3aGFsZXMuaW8vIiwic3ViIjoidXNlciIsInBsYW4iOiJiYXNpYyIsImJhbGFuY2UiOjAsImlhdCI6MTc1MzU1MDAxNywiZXhwIjoxNzUzNTYwODE3fQ.t99299sp1pEKJnr8B61GLdj4e6f3bs29uM4xCLUpqVE',
    'Content-Type': 'application/json'
  }
};

console.log("🪙 ANALYSE DÉTAILLÉE - DONNÉES DE TOKENS DANS ENHANCED-STATS");
console.log("=" .repeat(70));

async function analyzeTokenData(endpoint) {
  const fullUrl = `${CIELO_CONFIG.baseUrl}${endpoint}`;
  
  try {
    console.log(`\n🔍 Analyse: ${endpoint}`);
    console.log(`🌐 URL: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: CIELO_CONFIG.headers
    });
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`\n✅ Données récupérées avec succès!`);
      
      // Afficher la structure complète
      console.log(`\n📊 STRUCTURE COMPLÈTE:`);
      console.log(JSON.stringify(data, null, 2));
      
      // Analyser spécifiquement les tokens
      const searchForTokens = (obj, path = '') => {
        const results = [];
        
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            // Chercher des clés liées aux tokens
            if (key.toLowerCase().includes('token') || 
                key.toLowerCase().includes('symbol') || 
                key.toLowerCase().includes('mint') ||
                key.toLowerCase().includes('pnl') ||
                key.toLowerCase().includes('trade')) {
              results.push({ path: currentPath, key, value });
            }
            
            // Recurser dans les objets/arrays
            if (typeof value === 'object') {
              results.push(...searchForTokens(value, currentPath));
            }
          }
        }
        
        return results;
      };
      
      const tokenData = searchForTokens(data);
      
      console.log(`\n🪙 DONNÉES LIÉES AUX TOKENS TROUVÉES:`);
      console.log(`📍 Nombre d'éléments: ${tokenData.length}`);
      
      tokenData.forEach((item, i) => {
        console.log(`\n${i + 1}. 📍 ${item.path}`);
        console.log(`   🔑 Clé: ${item.key}`);
        console.log(`   📊 Type: ${typeof item.value}`);
        console.log(`   📋 Valeur: ${JSON.stringify(item.value).substring(0, 200)}...`);
      });
      
      return { success: true, data, tokenData };
      
    } else {
      console.log(`❌ Erreur: ${response.status} ${response.statusText}`);
      return { success: false, status: response.status };
    }
    
  } catch (error) {
    console.log(`💥 Erreur: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(`🎯 Wallet analysé: ${wallet}`);
  
  // Analyser les deux endpoints qui fonctionnent
  const endpoints = [
    `/enhanced-stats/aggregated/${wallet}?days=7`,
    `/enhanced-stats/aggregated/${wallet}?days=max`
  ];
  
  for (const endpoint of endpoints) {
    const result = await analyzeTokenData(endpoint);
    
    if (result.success && result.tokenData.length > 0) {
      console.log(`\n🎉 TOKENS TROUVÉS DANS: ${endpoint}`);
      console.log(`📊 Peut servir pour l'endpoint tokens-pnl !`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n💡 CONCLUSION:`);
  console.log(`Si les données détaillées par token sont dans enhanced-stats,`);
  console.log(`nous pouvons utiliser ces endpoints pour implémenter tokens-pnl !`);
}

main().catch(console.error);
