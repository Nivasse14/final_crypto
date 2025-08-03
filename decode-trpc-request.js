// Script pour décoder la requête TRPC Cielo
const url = "https://app.cielo.finance/api/trpc/profile.getEnhancedStatsAggregated,profile.getEnhancedStatsProfitability?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22wallet%22%3A%22ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB%22%2C%22days%22%3A%22max%22%7D%7D%2C%221%22%3A%7B%22json%22%3A%7B%22wallet%22%3A%22ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB%22%2C%22days%22%3A%22max%22%7D%7D%7D";

console.log("🔍 ANALYSE DE LA REQUÊTE TRPC CIELO");
console.log("=" .repeat(50));

// Parser l'URL
const urlObj = new URL(url);
console.log("\n📍 URL de base:", urlObj.origin + urlObj.pathname);

// Extraire les méthodes appelées
const pathMethods = urlObj.pathname.split('/').pop();
console.log("\n🎯 Méthodes appelées (batch):");
const methods = pathMethods.split(',');
methods.forEach((method, index) => {
  console.log(`  ${index}: ${method}`);
});

// Décoder les paramètres
const params = new URLSearchParams(urlObj.search);
console.log("\n📋 Paramètres:");
console.log("  batch:", params.get('batch'));

const inputParam = params.get('input');
console.log("  input (encodé):", inputParam);

// Décoder l'input JSON
const decodedInput = decodeURIComponent(inputParam);
console.log("\n📦 Input décodé (JSON):");
console.log(decodedInput);

// Parser le JSON
try {
  const inputJson = JSON.parse(decodedInput);
  console.log("\n🔍 Structure de l'input:");
  console.log(JSON.stringify(inputJson, null, 2));
  
  console.log("\n📊 ANALYSE DÉTAILLÉE:");
  console.log("=" .repeat(30));
  
  Object.keys(inputJson).forEach(key => {
    const request = inputJson[key];
    console.log(`\n📝 Requête ${key}:`);
    console.log(`   Méthode: ${methods[parseInt(key)]}`);
    console.log(`   Wallet: ${request.json.wallet}`);
    console.log(`   Période: ${request.json.days}`);
  });
  
  console.log("\n🔄 ÉQUIVALENTS REST API:");
  console.log("=" .repeat(30));
  
  Object.keys(inputJson).forEach(key => {
    const request = inputJson[key];
    const method = methods[parseInt(key)];
    const wallet = request.json.wallet;
    const days = request.json.days;
    
    if (method === 'profile.getEnhancedStatsAggregated') {
      console.log(`\n📊 Stats Aggregated (${key}):`);
      console.log(`   REST: GET /enhanced-stats/aggregated/${wallet}?days=${days}`);
      console.log(`   Description: Statistiques agrégées du wallet`);
    }
    
    if (method === 'profile.getEnhancedStatsProfitability') {
      console.log(`\n💰 Stats Profitability (${key}):`);
      console.log(`   REST: GET /enhanced-stats/profitability/${wallet}?days=${days}`);
      console.log(`   Description: Données de profitabilité du wallet`);
    }
  });
  
  console.log("\n✅ RECOMMANDATIONS POUR NOTRE API:");
  console.log("=" .repeat(40));
  console.log("1. Utiliser /enhanced-stats/aggregated/{wallet}?days=max pour les stats générales");
  console.log("2. Utiliser /enhanced-stats/profitability/{wallet}?days=max pour la profitabilité");
  console.log("3. Supporter days=7 et days=max comme paramètres");
  console.log("4. Combiner les deux endpoints dans notre endpoint /complete");
  
} catch (error) {
  console.error("❌ Erreur lors du parsing JSON:", error.message);
}
