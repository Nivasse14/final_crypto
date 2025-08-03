#!/usr/bin/env node

// Analyse de la vraie requête TRPC fetchTokenPnlSlow
const trpcUrl = "https://app.cielo.finance/api/trpc/profile.fetchTokenPnlSlow?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22wallet%22%3A%22ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB%22%2C%22chains%22%3A%22%22%2C%22timeframe%22%3A%22%22%2C%22sortBy%22%3A%22%22%2C%22page%22%3A%221%22%2C%22tokenFilter%22%3A%22%22%7D%7D%7D";

console.log("🔍 ANALYSE VRAIE REQUÊTE TRPC - fetchTokenPnlSlow");
console.log("=" .repeat(60));

// Décoder l'URL
const urlObj = new URL(trpcUrl);
const inputParam = urlObj.searchParams.get('input');
const decodedInput = decodeURIComponent(inputParam);
const inputJson = JSON.parse(decodedInput);

console.log("📋 Paramètres décodés:");
console.log(JSON.stringify(inputJson, null, 2));

const request = inputJson["0"].json;
console.log("\n🎯 Requête analysée:");
console.log(`   Wallet: ${request.wallet}`);
console.log(`   Chains: "${request.chains}" (vide = toutes)`);
console.log(`   Timeframe: "${request.timeframe}" (vide = all time)`);
console.log(`   Sort By: "${request.sortBy}" (vide = défaut)`);
console.log(`   Page: ${request.page}`);
console.log(`   Token Filter: "${request.tokenFilter}" (vide = tous)`);

console.log("\n🌐 Test de la vraie requête TRPC...");

async function testTrpcDirectly() {
  try {
    console.log("📤 Envoi de la requête à Cielo...");
    
    const response = await fetch(trpcUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://app.cielo.finance/',
        'Origin': 'https://app.cielo.finance'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log("\n✅ SUCCÈS! Données reçues:");
      console.log("📋 Structure:", Object.keys(data));
      
      // Chercher les données dans la réponse TRPC
      if (data[0] && data[0].result) {
        const result = data[0].result.data;
        console.log("\n🪙 DONNÉES TOKENS TROUVÉES:");
        console.log(`   Type: ${typeof result}`);
        console.log(`   Keys: ${Object.keys(result || {})}`);
        
        if (result.tokens && Array.isArray(result.tokens)) {
          console.log(`   📊 Nombre de tokens: ${result.tokens.length}`);
          console.log(`   📄 Page actuelle: ${result.currentPage || 'N/A'}`);
          console.log(`   📑 Total pages: ${result.totalPages || 'N/A'}`);
          console.log(`   🔢 Total tokens: ${result.totalItems || 'N/A'}`);
          
          console.log("\n🏆 PREMIERS TOKENS:");
          result.tokens.slice(0, 3).forEach((token, i) => {
            console.log(`   ${i + 1}. ${token.symbol || 'N/A'} (${token.name || 'N/A'})`);
            console.log(`      💰 PnL: ${token.pnl || 'N/A'}`);
            console.log(`      📈 ROI: ${token.roi || 'N/A'}%`);
            console.log(`      🔗 Address: ${token.address || token.mint || 'N/A'}`);
          });
        }
        
        // Afficher la structure complète (limitée)
        const preview = JSON.stringify(result, null, 2).substring(0, 1000);
        console.log(`\n📋 Aperçu de la structure (1000 premiers caractères):`);
        console.log(preview + "...");
        
        return result;
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Erreur HTTP: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`💥 Erreur: ${error.message}`);
  }
  
  return null;
}

testTrpcDirectly().then(result => {
  if (result) {
    console.log("\n🎯 CONCLUSION:");
    console.log("✅ La requête TRPC fonctionne et retourne les vrais tokens");
    console.log("💡 Il faut reproduire EXACTEMENT cette requête dans notre API");
    console.log("🔧 Mettre à jour /tokens-pnl pour appeler cette URL TRPC");
  } else {
    console.log("\n❌ CONCLUSION:");
    console.log("La requête TRPC ne fonctionne pas avec les headers actuels");
    console.log("Il faut peut-être s'authentifier ou ajuster les headers");
  }
});
