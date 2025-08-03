#!/usr/bin/env node

// Script de test pas à pas pour l'API Cielo sur Supabase
// Test chaque endpoint un par un avec logging détaillé

const TEST_WALLET = 'ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB';
const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co/functions/v1';

/**
 * Fonction utilitaire pour faire des requêtes avec retry
 */
async function testEndpoint(name, url, retries = 3) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST: ${name}`);
  console.log(`🔗 URL: ${url}`);
  console.log(`${'='.repeat(60)}`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n📡 [TENTATIVE ${attempt}/${retries}] Appel en cours...`);
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ [RESPONSE] ${response.status} ${response.statusText} (${duration}ms)`);
      
      if (!response.ok) {
        console.error(`❌ [ERROR] HTTP ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.error(`📄 [ERROR BODY]:`, errorText);
        
        if (attempt === retries) {
          return { success: false, error: `HTTP ${response.status}`, body: errorText };
        }
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ [SUCCESS] Données récupérées avec succès`);
      
      // Analyser la structure de la réponse
      console.log(`\n🔍 [ANALYSE STRUCTURE]:`);
      console.log(`- Type de réponse: ${typeof data}`);
      console.log(`- Clés principales: ${Object.keys(data).join(', ')}`);
      console.log(`- Taille JSON: ${JSON.stringify(data).length} caractères`);
      
      if (data.success !== undefined) {
        console.log(`- Success: ${data.success}`);
      }
      
      if (data.source) {
        console.log(`- Source des données: ${data.source}`);
      }
      
      if (data.endpoint_used) {
        console.log(`- Endpoint Cielo utilisé: ${data.endpoint_used}`);
      }
      
      if (data.data) {
        console.log(`- Structure data: ${Object.keys(data.data).join(', ')}`);
        
        // Analyser le contenu spécifique selon le type
        if (data.data.portfolio && Array.isArray(data.data.portfolio)) {
          console.log(`- Portfolio: ${data.data.portfolio.length} tokens`);
        }
        
        if (data.data.tokens && Array.isArray(data.data.tokens)) {
          console.log(`- Tokens: ${data.data.tokens.length} entrées`);
        }
        
        if (data.data.stats) {
          console.log(`- Stats structure: ${Object.keys(data.data.stats).join(', ')}`);
        }
      }
      
      // Log d'un échantillon des données pour le debug
      console.log(`\n📊 [ÉCHANTILLON DONNÉES]:`);
      console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
      
      return { 
        success: true, 
        data: data, 
        duration: duration,
        attempt: attempt 
      };
      
    } catch (error) {
      console.error(`💥 [ERREUR FETCH] Tentative ${attempt}:`, error.message);
      
      if (attempt === retries) {
        return { success: false, error: error.message };
      }
      
      // Attendre avant retry
      console.log(`⏳ Attente de 2s avant retry...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

/**
 * Fonction principale de test
 */
async function runStepByStepTests() {
  console.log(`🚀 TESTS PAS À PAS - API CIELO SUPABASE`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🏠 Base URL: ${SUPABASE_URL}`);
  console.log(`👛 Wallet de test: ${TEST_WALLET}`);
  
  const results = {};
  
  // 1. Test Health Check
  results.health = await testEndpoint(
    'HEALTH CHECK',
    `${SUPABASE_URL}/cielo-api/health`
  );
  
  // 2. Test Portfolio
  results.portfolio = await testEndpoint(
    'PORTFOLIO',
    `${SUPABASE_URL}/cielo-api/portfolio/${TEST_WALLET}`
  );
  
  // 3. Test Stats (All Time)
  results.stats = await testEndpoint(
    'STATS ALL TIME',
    `${SUPABASE_URL}/cielo-api/stats/${TEST_WALLET}`
  );
  
  // 4. Test Stats 7 jours
  results.stats7d = await testEndpoint(
    'STATS 7 DAYS',
    `${SUPABASE_URL}/cielo-api/stats-7d/${TEST_WALLET}`
  );
  
  // 5. Test Profitability
  results.profitability = await testEndpoint(
    'PROFITABILITY',
    `${SUPABASE_URL}/cielo-api/profitability/${TEST_WALLET}`
  );
  
  // 6. Test Profitability 7 jours
  results.profitability7d = await testEndpoint(
    'PROFITABILITY 7 DAYS',
    `${SUPABASE_URL}/cielo-api/profitability-7d/${TEST_WALLET}`
  );
  
  // 7. Test Complete (endpoint combiné)
  results.complete = await testEndpoint(
    'COMPLETE DATA',
    `${SUPABASE_URL}/cielo-api/complete/${TEST_WALLET}`
  );
  
  // Résumé final
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 RÉSUMÉ DES TESTS`);
  console.log(`${'='.repeat(80)}`);
  
  let successCount = 0;
  let totalTests = 0;
  
  for (const [testName, result] of Object.entries(results)) {
    totalTests++;
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    const duration = result.duration ? `(${result.duration}ms)` : '';
    const attempt = result.attempt ? `[tentative ${result.attempt}]` : '';
    
    console.log(`${status} ${testName.toUpperCase()} ${duration} ${attempt}`);
    
    if (result.success) {
      successCount++;
      
      // Informations détaillées pour les succès
      if (result.data.source) {
        console.log(`   📍 Source: ${result.data.source}`);
      }
      
      if (result.data.endpoint_used) {
        console.log(`   🔗 Endpoint: ${result.data.endpoint_used}`);
      }
    } else {
      console.log(`   ❌ Erreur: ${result.error}`);
    }
  }
  
  console.log(`\n📊 SCORE: ${successCount}/${totalTests} tests réussis`);
  
  if (successCount === totalTests) {
    console.log(`🎉 TOUS LES TESTS SONT PASSÉS !`);
    console.log(`✅ L'API fonctionne correctement avec Cielo`);
  } else {
    console.log(`⚠️ Certains tests ont échoué`);
    console.log(`🔧 Vérifiez les logs ci-dessus pour diagnostiquer`);
  }
  
  // Sauvegarder les résultats
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `test-results-${timestamp}.json`;
  
  console.log(`\n💾 Sauvegarde des résultats dans: ${resultsFile}`);
  
  const fs = require('fs');
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    wallet_tested: TEST_WALLET,
    base_url: SUPABASE_URL,
    results: results,
    summary: {
      total_tests: totalTests,
      successful_tests: successCount,
      success_rate: (successCount / totalTests * 100).toFixed(1) + '%'
    }
  }, null, 2));
  
  console.log(`✅ Résultats sauvegardés !`);
}

// Exécuter les tests
if (require.main === module) {
  runStepByStepTests().catch(error => {
    console.error('💥 ERREUR FATALE:', error);
    process.exit(1);
  });
}

module.exports = { runStepByStepTests, testEndpoint };
