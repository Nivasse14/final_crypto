#!/usr/bin/env node

/**
 * Script de test pour vérifier les nouvelles métriques API Cielo
 * Teste la migration, l'insertion et la lecture des nouvelles colonnes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://xkndddxqqlxqknbqtefv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNewCieloMetrics() {
  console.log('🧪 TEST DES NOUVELLES MÉTRIQUES API CIELO\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Vérifier que les nouvelles colonnes existent
    console.log('\n📋 1. VÉRIFICATION DES COLONNES AJOUTÉES:');
    
    const newColumns = [
      'average_holding_time',
      'total_pnl', 
      'winrate',
      'total_roi_percentage',
      'swap_count',
      'first_swap_timestamp',
      'last_swap_timestamp',
      'unique_trading_days',
      'consecutive_trading_days',
      'average_trades_per_token'
    ];
    
    for (const column of newColumns) {
      try {
        const { data, error } = await supabase
          .from('wallet_registry')
          .select(column)
          .limit(1);
          
        if (error) {
          console.log(`   ❌ ${column}: MANQUANTE (${error.message})`);
        } else {
          console.log(`   ✅ ${column}: PRÉSENTE`);
        }
      } catch (err) {
        console.log(`   ❌ ${column}: ERREUR (${err.message})`);
      }
    }
    
    // 2. Tester l'insertion de données avec les nouvelles métriques
    console.log('\n📝 2. TEST D\'INSERTION AVEC NOUVELLES MÉTRIQUES:');
    
    const testWalletAddress = 'TEST_CIELO_METRICS_' + Date.now();
    const testData = {
      wallet_address: testWalletAddress,
      // Métriques existantes
      enriched_total_pnl_usd: 5000.50,
      enriched_winrate: 0.75,
      enriched_total_trades: 150,
      // Nouvelles métriques API Cielo
      average_holding_time: 72.5, // 72.5 heures
      total_pnl: 5000.50,
      winrate: 0.75,
      total_roi_percentage: 45.8,
      swap_count: 150,
      first_swap_timestamp: '2024-01-15T10:30:00Z',
      last_swap_timestamp: '2024-08-17T15:45:00Z',
      unique_trading_days: 45,
      consecutive_trading_days: 12,
      average_trades_per_token: 3.33,
      // Métadonnées
      status: 'enriched',
      processing_version: 'v4_cielo_metrics',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('wallet_registry')
      .insert(testData)
      .select()
      .single();
      
    if (insertError) {
      console.log(`   ❌ Erreur insertion: ${insertError.message}`);
    } else {
      console.log(`   ✅ Insertion réussie pour: ${testWalletAddress}`);
      console.log(`   📊 Données insérées avec ${Object.keys(testData).length} champs`);
    }
    
    // 3. Tester la lecture des nouvelles métriques
    console.log('\n📖 3. TEST DE LECTURE DES NOUVELLES MÉTRIQUES:');
    
    if (insertData) {
      const { data: readData, error: readError } = await supabase
        .from('wallet_registry')
        .select(`
          wallet_address,
          average_holding_time,
          total_pnl,
          winrate,
          total_roi_percentage,
          swap_count,
          first_swap_timestamp,
          last_swap_timestamp,
          unique_trading_days,
          consecutive_trading_days,
          average_trades_per_token
        `)
        .eq('wallet_address', testWalletAddress)
        .single();
        
      if (readError) {
        console.log(`   ❌ Erreur lecture: ${readError.message}`);
      } else {
        console.log(`   ✅ Lecture réussie !`);
        console.log('\n   📋 Données lues:');
        Object.entries(readData).forEach(([key, value]) => {
          if (key !== 'wallet_address') {
            console.log(`      • ${key}: ${value}`);
          }
        });
      }
    }
    
    // 4. Tester une requête combinée (anciennes + nouvelles métriques)
    console.log('\n🔄 4. TEST REQUÊTE COMBINÉE (ANCIENNES + NOUVELLES):');
    
    const { data: combinedData, error: combinedError } = await supabase
      .from('wallet_registry')
      .select(`
        wallet_address,
        enriched_total_pnl_usd,
        enriched_winrate,
        enriched_total_trades,
        average_holding_time,
        total_pnl,
        winrate,
        total_roi_percentage,
        swap_count,
        unique_trading_days,
        copy_trading_score,
        dexscreener_micro_cap_count,
        dexscreener_total_analyzed_count
      `)
      .eq('wallet_address', testWalletAddress)
      .single();
      
    if (combinedError) {
      console.log(`   ❌ Erreur requête combinée: ${combinedError.message}`);
    } else {
      console.log(`   ✅ Requête combinée réussie !`);
      console.log(`   📊 Nombre de champs récupérés: ${Object.keys(combinedData).length}`);
      
      // Vérifier la cohérence des données
      const pnlMatch = Math.abs((combinedData.enriched_total_pnl_usd || 0) - (combinedData.total_pnl || 0)) < 0.01;
      const winrateMatch = Math.abs((combinedData.enriched_winrate || 0) - (combinedData.winrate || 0)) < 0.01;
      
      console.log(`   🔍 Cohérence PnL: ${pnlMatch ? '✅' : '❌'} (${combinedData.enriched_total_pnl_usd} vs ${combinedData.total_pnl})`);
      console.log(`   🔍 Cohérence Winrate: ${winrateMatch ? '✅' : '❌'} (${combinedData.enriched_winrate} vs ${combinedData.winrate})`);
    }
    
    // 5. Nettoyage - supprimer le wallet de test
    console.log('\n🧹 5. NETTOYAGE:');
    
    const { error: deleteError } = await supabase
      .from('wallet_registry')
      .delete()
      .eq('wallet_address', testWalletAddress);
      
    if (deleteError) {
      console.log(`   ⚠️  Erreur suppression: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Wallet de test supprimé: ${testWalletAddress}`);
    }
    
    // 6. Statistiques finales
    console.log('\n📊 6. STATISTIQUES FINALES:');
    
    const { count, error: countError } = await supabase
      .from('wallet_registry')
      .select('*', { count: 'exact', head: true })
      .not('average_holding_time', 'is', null);
      
    if (!countError) {
      console.log(`   📈 Wallets avec nouvelles métriques: ${count || 0}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST TERMINÉ AVEC SUCCÈS !');
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('1. Exécuter la migration: migration-add-cielo-metrics.sql');
    console.log('2. Mettre à jour l\'API Cielo pour sauvegarder ces métriques');
    console.log('3. Tester l\'enrichissement complet d\'un wallet');
    
  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error);
    console.log('\n📋 ACTIONS REQUISES:');
    console.log('1. Vérifier la connexion à Supabase');
    console.log('2. Exécuter migration-add-cielo-metrics.sql');
    console.log('3. Vérifier les permissions de la base de données');
  }
}

// Exécuter le test
testNewCieloMetrics();
