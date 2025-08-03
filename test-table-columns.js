// Test script pour vérifier les colonnes de la table wallet_tokens_extended
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';

async function checkTable() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Essayer d'insérer un enregistrement minimal
    const { data, error } = await supabase
      .from('wallet_tokens_extended')
      .insert({
        wallet_address: 'test',
        token_address: 'test123',
        token_symbol: 'TEST'
      });
      
    if (error) {
      console.log('❌ Erreur:', error.message);
      console.log('❌ Code:', error.code);
      console.log('❌ Détails:', error.details);
    } else {
      console.log('✅ Test insertion réussie');
      
      // Supprimer le test
      await supabase
        .from('wallet_tokens_extended')
        .delete()
        .eq('wallet_address', 'test');
    }
  } catch (err) {
    console.log('❌ Erreur générale:', err.message);
  }
}

checkTable();
