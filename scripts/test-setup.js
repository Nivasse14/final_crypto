const fs = require('fs');
require('dotenv').config();

console.log('🧪 Test de configuration des scripts Node.js\n');

// Vérifier la configuration
console.log('📋 Configuration :');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Défini' : '❌ Manquant'}`);
console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Défini' : '❌ Manquant'}`);
console.log(`   COINGECKO_API_KEY: ${process.env.COINGECKO_API_KEY ? '✅ Défini' : '⚠️  Optionnel'}`);

// Vérifier les dépendances
console.log('\n📦 Dépendances :');
try {
  require('@supabase/supabase-js');
  console.log('   @supabase/supabase-js: ✅');
} catch (e) {
  console.log('   @supabase/supabase-js: ❌');
}

try {
  require('puppeteer-extra');
  console.log('   puppeteer-extra: ✅');
} catch (e) {
  console.log('   puppeteer-extra: ❌');
}

try {
  require('axios');
  console.log('   axios: ✅');
} catch (e) {
  console.log('   axios: ❌');
}

// Vérifier les scripts disponibles
console.log('\n📝 Scripts disponibles :');
const scripts = [
  'dune-scraper.js',
  'api-gmgn.js', 
  'complete-data-extractor.js',
  'upload-to-supabase.js'
];

scripts.forEach(script => {
  const exists = fs.existsSync(script);
  console.log(`   ${script}: ${exists ? '✅' : '❌'}`);
});

console.log('\n🎯 Pour utiliser les scripts :');
console.log('   npm run dune-scraper     # Scraper dune.com');
console.log('   npm run api-gmgn         # Test API GMGN');
console.log('   npm run complete-data    # Extraction complète');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('\n⚠️  Configurez votre fichier .env avec vos clés Supabase !');
  console.log('   Copiez .env.example vers .env et modifiez les valeurs');
}
