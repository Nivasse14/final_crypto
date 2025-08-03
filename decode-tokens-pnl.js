// Script pour décoder la requête TRPC pour les tokens PnL
const url = "https://app.cielo.finance/api/trpc/profile.fetchTokenPnlSlow?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22wallet%22%3A%22ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB%22%2C%22chains%22%3A%22%22%2C%22timeframe%22%3A%22%22%2C%22sortBy%22%3A%22%22%2C%22page%22%3A%221%22%2C%22tokenFilter%22%3A%22%22%7D%7D%7D";

console.log("🔍 ANALYSE DE LA REQUÊTE TRPC - TOKEN PNL DÉTAILLÉ");
console.log("=" .repeat(60));

// Parser l'URL
const urlObj = new URL(url);
console.log("\n📍 URL de base:", urlObj.origin + urlObj.pathname);

// Extraire la méthode appelée
const pathMethod = urlObj.pathname.split('/').pop().split('?')[0];
console.log("\n🎯 Méthode appelée:");
console.log(`  ${pathMethod}`);

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
  console.log("=" .repeat(40));
  
  const request = inputJson["0"];
  console.log(`\n📝 Requête Token PnL:`);
  console.log(`   Méthode: ${pathMethod}`);
  console.log(`   Wallet: ${request.json.wallet}`);
  console.log(`   Chains: "${request.json.chains}" (vide = toutes)`);
  console.log(`   Timeframe: "${request.json.timeframe}" (vide = all time)`);
  console.log(`   Sort By: "${request.json.sortBy}" (vide = défaut)`);
  console.log(`   Page: ${request.json.page}`);
  console.log(`   Token Filter: "${request.json.tokenFilter}" (vide = tous)`);
  
  console.log("\n🔄 ÉQUIVALENT REST API:");
  console.log("=" .repeat(30));
  
  const wallet = request.json.wallet;
  const page = request.json.page;
  const chains = request.json.chains;
  const timeframe = request.json.timeframe;
  const sortBy = request.json.sortBy;
  const tokenFilter = request.json.tokenFilter;
  
  console.log(`📍 Endpoint recommandé:`);
  console.log(`   🎯 REST: GET /tokens-pnl/${wallet}`);
  console.log(`   📄 Description: Liste détaillée de tous les tokens tradés avec PnL`);
  console.log(`   ⚙️ Paramètres optionnels:`);
  console.log(`      - page=${page} (pagination)`);
  console.log(`      - chains=${chains || 'all'} (chaînes blockchain)`);
  console.log(`      - timeframe=${timeframe || 'all'} (période)`);
  console.log(`      - sortBy=${sortBy || 'default'} (tri)`);
  console.log(`      - tokenFilter=${tokenFilter || 'all'} (filtre token)`);
  
  console.log("\n✅ URL COMPLÈTE RECOMMANDÉE:");
  console.log(`GET /tokens-pnl/${wallet}?page=${page}&chains=${chains || 'all'}&timeframe=${timeframe || 'all'}&sortBy=${sortBy || 'default'}&tokenFilter=${tokenFilter || 'all'}`);
  
  console.log("\n🚀 RECOMMANDATIONS POUR NOTRE API:");
  console.log("=" .repeat(40));
  console.log("1. ⭐ AJOUTER l'endpoint /tokens-pnl/{wallet}");
  console.log("2. 📊 Supporter la pagination (page)");
  console.log("3. 🔍 Supporter les filtres (chains, timeframe, sortBy, tokenFilter)");
  console.log("4. 🔄 METTRE À JOUR l'endpoint /complete pour inclure tokens-pnl");
  console.log("5. 📋 Cet endpoint est crucial pour le détail des trades !");
  
} catch (error) {
  console.error("❌ Erreur lors du parsing JSON:", error.message);
}
