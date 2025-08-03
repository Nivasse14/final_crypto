#!/usr/bin/env node

// Test direct de tous les endpoints possibles pour tokens-pnl
// Basé sur l'analyse TRPC profile.fetchTokenPnlSlow

const wallet = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB"; // Wallet de référence

console.log("🪙 TEST DIRECT TOKENS-PNL - API CIELO");
console.log("=" .repeat(60));
console.log(`🎯 Wallet de test: ${wallet}`);
console.log("\n🔍 Analyse de la requête TRPC:");
console.log("   Méthode TRPC: profile.fetchTokenPnlSlow");
console.log("   Description: Récupération lente du PnL détaillé par token");
console.log("   Paramètres: wallet, chains, timeframe, sortBy, page, tokenFilter");

// Liste exhaustive des endpoints possibles basés sur l'analyse TRPC
const possibleEndpoints = [
  // Basés sur le nom TRPC "profile.fetchTokenPnlSlow"
  `/profile/fetchTokenPnlSlow?wallet=${wallet}&page=1`,
  `/profile/fetch-token-pnl-slow?wallet=${wallet}&page=1`,
  `/profile/token-pnl-slow?wallet=${wallet}&page=1`,
  `/profile/tokens-pnl?wallet=${wallet}&page=1`,
  
  // Pattern classique avec wallet dans l'URL
  `/profile/fetchTokenPnlSlow/${wallet}?page=1`,
  `/profile/fetch-token-pnl-slow/${wallet}?page=1`,
  `/profile/token-pnl-slow/${wallet}?page=1`,
  `/profile/tokens-pnl/${wallet}?page=1`,
  
  // Pattern sans profile
  `/fetchTokenPnlSlow/${wallet}?page=1`,
  `/fetch-token-pnl-slow/${wallet}?page=1`,
  `/token-pnl-slow/${wallet}?page=1`,
  `/tokens-pnl/${wallet}?page=1`,
  
  // Pattern wallet-based
  `/wallet/${wallet}/fetchTokenPnlSlow?page=1`,
  `/wallet/${wallet}/fetch-token-pnl-slow?page=1`,
  `/wallet/${wallet}/token-pnl-slow?page=1`,
  `/wallet/${wallet}/tokens-pnl?page=1`,
  `/wallet/${wallet}/tokens?page=1`,
  
  // Patterns courts
  `/tokens/${wallet}?page=1`,
  `/token-pnl/${wallet}?page=1`,
  
  // Avec paramètres complets comme dans TRPC
  `/profile/fetchTokenPnlSlow?wallet=${wallet}&chains=&timeframe=&sortBy=&page=1&tokenFilter=`,
  `/profile/tokens-pnl?wallet=${wallet}&chains=&timeframe=&sortBy=&page=1&tokenFilter=`
];

async function testCieloEndpoint(endpoint) {
  const apiKey = process.env.CIELO_API_KEY;
  const baseUrl = "https://api.cielo.finance";
  
  if (!apiKey) {
    console.error("❌ CIELO_API_KEY manquante dans les variables d'environnement");
    return null;
  }
  
  try {
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`🔍 Test: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    console.log(`   Status: ${status}`);
    
    if (status === 200) {
      const data = await response.json();
      console.log(`   ✅ SUCCÈS! Données reçues:`, JSON.stringify(data, null, 2).substring(0, 500) + "...");
      return { endpoint, data, status };
    } else if (status === 404) {
      console.log(`   ❌ 404 - Endpoint non trouvé`);
    } else if (status === 401) {
      console.log(`   🔐 401 - Problème d'authentification`);
    } else if (status === 403) {
      console.log(`   🚫 403 - Accès interdit`);
    } else {
      const text = await response.text();
      console.log(`   ❌ ${status} - ${text.substring(0, 200)}`);
    }
    
    return { endpoint, status, error: `HTTP ${status}` };
    
  } catch (error) {
    console.log(`   💥 ERREUR: ${error.message}`);
    return { endpoint, error: error.message };
  }
}

async function main() {
  console.log(`\n🚀 DÉBUT DU TEST - ${possibleEndpoints.length} endpoints à tester`);
  console.log("=" .repeat(60));
  
  const results = [];
  
  for (let i = 0; i < possibleEndpoints.length; i++) {
    const endpoint = possibleEndpoints[i];
    console.log(`\n[${i + 1}/${possibleEndpoints.length}] ${endpoint}`);
    
    const result = await testCieloEndpoint(endpoint);
    results.push(result);
    
    // Attendre un peu entre les requêtes pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log("📊 RÉSUMÉ DES TESTS");
  console.log("=" .repeat(60));
  
  const successful = results.filter(r => r && r.status === 200);
  const notFound = results.filter(r => r && r.status === 404);
  const authErrors = results.filter(r => r && (r.status === 401 || r.status === 403));
  const otherErrors = results.filter(r => r && r.error && !r.status);
  
  console.log(`\n✅ SUCCÈS (${successful.length}):`);
  successful.forEach(r => {
    console.log(`   🎯 ${r.endpoint}`);
  });
  
  console.log(`\n❌ NON TROUVÉS - 404 (${notFound.length}):`);
  notFound.forEach(r => {
    console.log(`   📍 ${r.endpoint}`);
  });
  
  console.log(`\n🔐 ERREURS AUTH - 401/403 (${authErrors.length}):`);
  authErrors.forEach(r => {
    console.log(`   🚫 ${r.endpoint} (${r.status})`);
  });
  
  console.log(`\n💥 AUTRES ERREURS (${otherErrors.length}):`);
  otherErrors.forEach(r => {
    console.log(`   ❌ ${r.endpoint} - ${r.error}`);
  });
  
  if (successful.length > 0) {
    console.log("\n🎉 RECOMMANDATION:");
    console.log("=" .repeat(30));
    console.log(`✅ Utiliser: ${successful[0].endpoint}`);
    console.log("💡 Cet endpoint peut être intégré dans notre API Supabase");
  } else {
    console.log("\n😞 AUCUN ENDPOINT FONCTIONNEL TROUVÉ");
    console.log("=" .repeat(40));
    console.log("🔍 Actions à prendre:");
    console.log("1. Vérifier la clé API CIELO");
    console.log("2. Vérifier si l'endpoint existe côté Cielo");
    console.log("3. Analyser plus en détail les requêtes TRPC dans l'app Cielo");
    console.log("4. Contacter l'équipe Cielo pour obtenir la documentation API");
  }
}

// Lancer le test
main().catch(console.error);
