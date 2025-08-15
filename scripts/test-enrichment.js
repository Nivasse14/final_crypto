const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Headers pour les appels API
const headers = {
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json'
};

async function testWorkflow() {
  console.log('🚀 Test du workflow d\'enrichissement...\n');
  
  try {
    // 1. Test de l'API wallet-registry/stats
    console.log('📊 Test des statistiques globales...');
    const statsResponse = await fetch(
      'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/stats',
      { headers }
    );
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Statistiques récupérées:', stats);
    } else {
      console.log('❌ Erreur stats:', statsResponse.status);
    }
    
    // 2. Test de la liste des wallets
    console.log('\n📋 Test de la liste des wallets...');
    const walletsResponse = await fetch(
      'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/wallet-registry/list?limit=5',
      { headers }
    );
    
    if (walletsResponse.ok) {
      const walletsData = await walletsResponse.json();
      console.log('✅ Wallets récupérés:', walletsData.data?.length || 0);
      
      if (walletsData.data && walletsData.data.length > 0) {
        const firstWallet = walletsData.data[0];
        console.log('📝 Premier wallet:', {
          address: firstWallet.wallet_address,
          pnl: firstWallet.total_pnl_usd,
          winrate: firstWallet.winrate,
          status: firstWallet.status
        });
        
        // 3. Test de l'enrichissement sur ce wallet
        console.log('\n🔍 Test d\'enrichissement...');
        const enrichResponse = await fetch(
          `https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1/cielo-api/complete/${firstWallet.wallet_address}`,
          { headers }
        );
        
        if (enrichResponse.ok) {
          const enrichData = await enrichResponse.json();
          console.log('✅ Enrichissement réussi pour:', firstWallet.wallet_address);
          console.log('📈 Données enrichies:', {
            totalValue: enrichData.enriched_total_value_usd,
            category: enrichData.enriched_ai_category,
            riskLevel: enrichData.enriched_ai_risk_level
          });
        } else {
          console.log('❌ Erreur enrichissement:', enrichResponse.status);
        }
      }
    } else {
      console.log('❌ Erreur wallets:', walletsResponse.status);
    }
    
    // 4. Insérer quelques wallets de test si la base est vide
    console.log('\n➕ Ajout de wallets de test...');
    await insertTestWallets();
    
  } catch (error) {
    console.error('❌ Erreur dans le workflow:', error);
  }
}

async function insertTestWallets() {
  const testWallets = [
    {
      wallet_address: 'WALLET_TEST_ALPHA_001',
      total_pnl_usd: 250000,
      winrate: 0.85,
      trade_count: 45,
      roi: 2.5,
      wins: 38,
      losses: 7,
      tokens_traded: 12,
      status: 'pending',
      last_trade_date: new Date().toISOString(),
      metadata: { source: 'test_script', priority: 'high' }
    },
    {
      wallet_address: 'WALLET_TEST_BETA_002',
      total_pnl_usd: 180000,
      winrate: 0.78,
      trade_count: 67,
      roi: 1.8,
      wins: 52,
      losses: 15,
      tokens_traded: 18,
      status: 'pending',
      last_trade_date: new Date().toISOString(),
      metadata: { source: 'test_script', priority: 'medium' }
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('wallet_registry')
      .upsert(testWallets, { 
        onConflict: 'wallet_address',
        ignoreDuplicates: false 
      });
      
    if (error) {
      console.log('⚠️ Erreur insertion (normal si déjà existants):', error.message);
    } else {
      console.log('✅ Wallets de test insérés/mis à jour');
    }
  } catch (error) {
    console.log('⚠️ Erreur insertion wallets test:', error.message);
  }
}

// Lancer le test
testWorkflow();
