const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

async function quickDbTest() {
  console.log('⚡ Test rapide de la base de données...\n');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Configuration Supabase manquante');
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test simple d'insertion avec valeur décimale
    const testData = {
      wallet_address: 'QUICK_TEST_' + Date.now(),
      // On teste juste avec une colonne qui devrait exister
      source: 'test',
      status: 'pending'
    };
    
    console.log('🔍 Test d\'insertion basique...');
    const { data, error } = await supabase
      .from('wallet_registry')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return false;
    }
    
    console.log('✅ Insertion basique réussie !');
    
    // Nettoyer
    await supabase
      .from('wallet_registry')
      .delete()
      .eq('wallet_address', testData.wallet_address);
    
    console.log('🎉 Base de données accessible !');
    console.log('💡 Vous pouvez maintenant appliquer le script fix-column-types-safe.sql');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return false;
  }
}

if (require.main === module) {
  quickDbTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { quickDbTest };
