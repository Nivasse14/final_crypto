const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables SUPABASE_URL et SUPABASE_KEY requises dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumnTypes() {
  console.log('🔍 Test des types de colonnes après correction...\n');
  
  try {
    // Tester l'insertion d'une valeur décimale
    const testData = {
      wallet_address: 'TEST_' + Date.now(),
      token_address: 'So11111111111111111111111111111111111111112',
      token_symbol: 'SOL',
      balance: 48.055045871559635, // La valeur qui causait l'erreur
      token_price_usd: 123.45,
      total_usd_value: 5896.78,
      portfolio_weight_pct: 15.25,
      price_change_24h: -2.34,
      pnl: 1234.56,
      pnl_percentage: 25.67
    };
    
    console.log('📝 Test d\'insertion avec valeurs décimales...');
    const { data, error } = await supabase
      .from('wallet_tokens')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('❌ Erreur d\'insertion:', error.message);
      console.log('💡 Vous devez appliquer le script fix-column-types.sql sur votre base Supabase');
      return false;
    }
    
    console.log('✅ Insertion réussie !');
    console.log('📊 Données insérées:', data[0]);
    
    // Nettoyer le test
    await supabase
      .from('wallet_tokens')
      .delete()
      .eq('wallet_address', testData.wallet_address);
    
    console.log('🧹 Données de test nettoyées');
    console.log('\n🎉 Types de colonnes OK ! Le problème est résolu.');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
    return false;
  }
}

if (require.main === module) {
  testColumnTypes().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testColumnTypes };
