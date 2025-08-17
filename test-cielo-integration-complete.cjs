// Script pour tester l'intégration complète des nouvelles métriques Cielo
// Teste l'API Cielo + sauvegarde wallet-registry + lecture API

async function testCieloMetricsIntegration() {
  const fetch = await import('node-fetch').then(module => module.default);
  
  const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
  const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';

  console.log('🔗 TEST INTÉGRATION COMPLÈTE MÉTRIQUES CIELO\n');
  console.log('='.repeat(70));
  
  // Wallet de test réel
  const testWallet = 'ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB';
  
  try {
    // 1. Appeler l'API Cielo pour récupérer les données complètes
    console.log('\n🚀 1. APPEL API CIELO COMPLÈTE:');
    
    const cieloResponse = await fetch(`${SUPABASE_URL}/functions/v1/cielo-api/complete/${testWallet}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!cieloResponse.ok) {
      throw new Error(`Erreur API Cielo: ${cieloResponse.status}`);
    }
    
    const cieloData = await cieloResponse.json();
    console.log(`   ✅ Données récupérées pour: ${testWallet}`);
    console.log(`   📊 Métriques disponibles: ${Object.keys(cieloData).length} sections`);
    
    // Extraire les nouvelles métriques depuis les données Cielo
    const extractedMetrics = {
      wallet_address: testWallet,
      // Métriques existantes (pour compatibilité)
      enriched_total_pnl_usd: cieloData.consolidated_metrics?.total_pnl_usd || 0,
      enriched_winrate: cieloData.consolidated_metrics?.winrate || 0,
      enriched_total_trades: cieloData.consolidated_metrics?.total_trades || 0,
      
      // Nouvelles métriques API Cielo
      average_holding_time: cieloData.consolidated_metrics?.average_holding_time || null,
      total_pnl: cieloData.consolidated_metrics?.total_pnl || cieloData.consolidated_metrics?.total_pnl_usd || null,
      winrate: cieloData.consolidated_metrics?.winrate || null,
      total_roi_percentage: cieloData.consolidated_metrics?.total_roi_percentage || cieloData.consolidated_metrics?.roi_percentage || null,
      swap_count: cieloData.consolidated_metrics?.swap_count || cieloData.consolidated_metrics?.total_trades || null,
      first_swap_timestamp: cieloData.consolidated_metrics?.first_swap_timestamp || null,
      last_swap_timestamp: cieloData.consolidated_metrics?.last_swap_timestamp || null,
      unique_trading_days: cieloData.consolidated_metrics?.unique_trading_days || null,
      consecutive_trading_days: cieloData.consolidated_metrics?.consecutive_trading_days || null,
      average_trades_per_token: cieloData.consolidated_metrics?.average_trades_per_token || null,
      
      // Métriques DexScreener (existantes)
      dexscreener_micro_cap_count: cieloData.dexscreener_market_cap_metrics?.micro_cap_count || 0,
      dexscreener_low_cap_count: cieloData.dexscreener_market_cap_metrics?.low_cap_count || 0,
      dexscreener_middle_cap_count: cieloData.dexscreener_market_cap_metrics?.middle_cap_count || 0,
      dexscreener_large_cap_count: cieloData.dexscreener_market_cap_metrics?.large_cap_count || 0,
      dexscreener_mega_cap_count: cieloData.dexscreener_market_cap_metrics?.mega_cap_count || 0,
      dexscreener_unknown_cap_count: cieloData.dexscreener_market_cap_metrics?.unknown_cap_count || 0,
      dexscreener_total_analyzed_count: cieloData.dexscreener_market_cap_metrics?.total_analyzed_count || 0,
      
      // Métadonnées
      status: 'enriched',
      processing_version: 'v4_trpc_complete_with_dexscreener_caps_and_cielo_metrics',
      cielo_complete_data: JSON.stringify(cieloData),
      last_processed_at: new Date().toISOString()
    };
    
    console.log(`   📋 Métriques extraites:`);
    console.log(`      • PnL total: $${extractedMetrics.total_pnl?.toLocaleString() || 'N/A'}`);
    console.log(`      • Winrate: ${(extractedMetrics.winrate * 100)?.toFixed(1) || 'N/A'}%`);
    console.log(`      • Swaps: ${extractedMetrics.swap_count?.toLocaleString() || 'N/A'}`);
    console.log(`      • Temps détention moyen: ${extractedMetrics.average_holding_time?.toFixed(1) || 'N/A'}h`);
    console.log(`      • Jours de trading uniques: ${extractedMetrics.unique_trading_days || 'N/A'}`);
    
    // 2. Sauvegarder via API wallet-registry
    console.log('\n💾 2. SAUVEGARDE VIA WALLET-REGISTRY:');
    
    const registryResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-registry/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wallet_address: testWallet,
        updates: {
          // Métriques existantes (pour compatibilité)
          enriched_total_pnl_usd: extractedMetrics.enriched_total_pnl_usd,
          enriched_winrate: extractedMetrics.enriched_winrate,
          enriched_total_trades: extractedMetrics.enriched_total_trades,
          
          // Nouvelles métriques API Cielo
          average_holding_time: extractedMetrics.average_holding_time,
          total_pnl: extractedMetrics.total_pnl,
          winrate: extractedMetrics.winrate,
          total_roi_percentage: extractedMetrics.total_roi_percentage,
          swap_count: extractedMetrics.swap_count,
          first_swap_timestamp: extractedMetrics.first_swap_timestamp,
          last_swap_timestamp: extractedMetrics.last_swap_timestamp,
          unique_trading_days: extractedMetrics.unique_trading_days,
          consecutive_trading_days: extractedMetrics.consecutive_trading_days,
          average_trades_per_token: extractedMetrics.average_trades_per_token,
          
          // Métriques DexScreener (existantes)
          dexscreener_micro_cap_count: extractedMetrics.dexscreener_micro_cap_count,
          dexscreener_low_cap_count: extractedMetrics.dexscreener_low_cap_count,
          dexscreener_middle_cap_count: extractedMetrics.dexscreener_middle_cap_count,
          dexscreener_large_cap_count: extractedMetrics.dexscreener_large_cap_count,
          dexscreener_mega_cap_count: extractedMetrics.dexscreener_mega_cap_count,
          dexscreener_unknown_cap_count: extractedMetrics.dexscreener_unknown_cap_count,
          dexscreener_total_analyzed_count: extractedMetrics.dexscreener_total_analyzed_count,
          
          // Métadonnées
          status: extractedMetrics.status,
          processing_version: 'v4_cielo_metrics', // Version courte pour éviter l'erreur
          cielo_complete_data: extractedMetrics.cielo_complete_data,
          last_processed_at: extractedMetrics.last_processed_at
        }
      })
    });
    
    if (!registryResponse.ok) {
      throw new Error(`Erreur sauvegarde: ${registryResponse.status}`);
    }
    
    const registryData = await registryResponse.json();
    console.log(`   ✅ Sauvegarde réussie: ${registryData.message}`);
    
    // 3. Vérifier via API de lecture
    console.log('\n📖 3. VÉRIFICATION VIA API DE LECTURE:');
    
    const readResponse = await fetch(`${SUPABASE_URL}/functions/v1/wallet-registry/get/${testWallet}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!readResponse.ok) {
      throw new Error(`Erreur lecture: ${readResponse.status}`);
    }
    
    const readData = await readResponse.json();
    console.log(`   ✅ Lecture réussie pour: ${readData.wallet_address}`);
    
    // Vérifier que les nouvelles métriques sont présentes
    const newMetricsPresent = [
      'average_holding_time',
      'total_pnl',
      'winrate',
      'total_roi_percentage',
      'swap_count',
      'unique_trading_days',
      'consecutive_trading_days',
      'average_trades_per_token'
    ];
    
    console.log(`   📊 Vérification des nouvelles métriques:`);
    let presentCount = 0;
    
    for (const metric of newMetricsPresent) {
      const isPresent = readData[metric] !== undefined && readData[metric] !== null;
      console.log(`      • ${metric}: ${isPresent ? '✅' : '❌'} (${readData[metric] || 'null'})`);
      if (isPresent) presentCount++;
    }
    
    console.log(`   📈 Score de présence: ${presentCount}/${newMetricsPresent.length} (${((presentCount/newMetricsPresent.length)*100).toFixed(1)}%)`);
    
    // 4. Test de cohérence des données
    console.log('\n🔍 4. TEST DE COHÉRENCE:');
    
    const coherenceTests = [
      {
        name: 'PnL total',
        original: extractedMetrics.total_pnl,
        saved: readData.total_pnl,
        tolerance: 0.01
      },
      {
        name: 'Winrate',
        original: extractedMetrics.winrate,
        saved: readData.winrate,
        tolerance: 0.001
      },
      {
        name: 'Swap count',
        original: extractedMetrics.swap_count,
        saved: readData.swap_count,
        tolerance: 0
      }
    ];
    
    let coherentCount = 0;
    
    for (const test of coherenceTests) {
      if (test.original !== null && test.saved !== null) {
        const diff = Math.abs(test.original - test.saved);
        const isCoherent = diff <= test.tolerance;
        console.log(`   • ${test.name}: ${isCoherent ? '✅' : '❌'} (${test.original} → ${test.saved})`);
        if (isCoherent) coherentCount++;
      } else {
        console.log(`   • ${test.name}: ⚠️  Données manquantes (${test.original} → ${test.saved})`);
      }
    }
    
    console.log(`   📊 Score de cohérence: ${coherentCount}/${coherenceTests.length}`);
    
    // 5. Résumé final
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RÉSUMÉ DE L\'INTÉGRATION:');
    console.log(`✅ API Cielo: Données récupérées`);
    console.log(`✅ Extraction: ${presentCount}/${newMetricsPresent.length} métriques extraites`);
    console.log(`✅ Sauvegarde: Réussie via wallet-registry`);
    console.log(`✅ Lecture: Données accessibles`);
    console.log(`✅ Cohérence: ${coherentCount}/${coherenceTests.length} tests passés`);
    
    if (presentCount === newMetricsPresent.length && coherentCount === coherenceTests.length) {
      console.log('\n🎉 INTÉGRATION COMPLÈTE RÉUSSIE !');
      console.log('Les nouvelles métriques Cielo sont fonctionnelles.');
    } else {
      console.log('\n⚠️  INTÉGRATION PARTIELLE');
      console.log('Certaines métriques nécessitent des ajustements.');
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR INTÉGRATION:', error.message);
    console.log('\n📋 ACTIONS REQUISES:');
    console.log('1. Vérifier que migration-add-cielo-metrics.sql a été exécutée');
    console.log('2. Vérifier que l\'API Cielo fonctionne');
    console.log('3. Vérifier que wallet-registry supporte les nouvelles colonnes');
  }
}

// Exécuter le test
testCieloMetricsIntegration();
