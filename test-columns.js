#!/usr/bin/env node

// 🧪 Test direct des colonnes en essayant une mise à jour
// Ce script teste quelles colonnes sont disponibles en essayant de les mettre à jour

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🧪 TEST DIRECT DES COLONNES');
console.log('===========================');

async function testColumns(walletAddress) {
  try {
    console.log(`🎯 Test avec wallet: ${walletAddress}`);
    
    // Colonnes à tester
    const testColumns = {
      average_buy_amount_usd: 21.28,
      minimum_buy_amount_usd: 0,
      maximum_buy_amount_usd: 275.58,
      total_buy_amount_usd: 15537.57,
      total_buy_count: 730,
      average_sell_amount_usd: 23.15,
      minimum_sell_amount_usd: 0,
      maximum_sell_amount_usd: 319.34,
      total_sell_amount_usd: 18053.10,
      total_sell_count: 780
    };
    
    const results = {
      existing: [],
      missing: [],
      errors: []
    };
    
    console.log(`\n📝 Test d'écriture pour ${Object.keys(testColumns).length} colonnes:`);
    
    // Tester chaque colonne individuellement
    for (const [columnName, testValue] of Object.entries(testColumns)) {
      console.log(`\n🔄 Test: ${columnName}`);
      
      try {
        const updateData = { [columnName]: testValue };
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.${walletAddress}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
          console.log(`   ✅ ${columnName} - Colonne existante`);
          results.existing.push(columnName);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ ${columnName} - Erreur: ${response.status}`);
          
          if (errorText.includes('column') && errorText.includes('does not exist')) {
            console.log(`      💡 Colonne manquante`);
            results.missing.push(columnName);
          } else {
            console.log(`      ⚠️ Autre erreur: ${errorText.substring(0, 100)}...`);
            results.errors.push({ column: columnName, error: errorText });
          }
        }
        
      } catch (error) {
        console.log(`   💥 ${columnName} - Exception: ${error.message}`);
        results.errors.push({ column: columnName, error: error.message });
      }
      
      // Délai entre les tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Rapport final
    console.log(`\n📊 RÉSULTATS DU TEST:`);
    console.log(`====================`);
    console.log(`✅ Colonnes existantes: ${results.existing.length}/${Object.keys(testColumns).length}`);
    console.log(`❌ Colonnes manquantes: ${results.missing.length}/${Object.keys(testColumns).length}`);
    console.log(`⚠️ Erreurs autres: ${results.errors.length}/${Object.keys(testColumns).length}`);
    
    if (results.existing.length > 0) {
      console.log(`\n✅ COLONNES DISPONIBLES:`);
      results.existing.forEach(col => console.log(`   ${col}`));
    }
    
    if (results.missing.length > 0) {
      console.log(`\n❌ COLONNES À AJOUTER:`);
      results.missing.forEach(col => console.log(`   ${col}`));
      
      console.log(`\n🔧 MIGRATION REQUISE:`);
      console.log(`   1. Ouvrir Supabase SQL Editor`);
      console.log(`   2. Exécuter migration-add-buy-sell-metrics.sql`);
      console.log(`   3. Relancer ce test`);
    }
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️ ERREURS DÉTECTÉES:`);
      results.errors.forEach(err => {
        console.log(`   ${err.column}: ${err.error.substring(0, 80)}...`);
      });
    }
    
    if (results.missing.length === 0 && results.errors.length === 0) {
      console.log(`\n🎉 PARFAIT ! Toutes les colonnes sont disponibles`);
      console.log(`🚀 Vous pouvez maintenant lancer l'enrichissement complet:`);
      console.log(`   node enrich-cielo-metrics.js test ${walletAddress}`);
    }
    
    return results;
    
  } catch (error) {
    console.log(`❌ Erreur générale: ${error.message}`);
    return { error: error.message };
  }
}

// Fonction principale
async function main() {
  const walletAddress = process.argv[2] || 'ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB';
  await testColumns(walletAddress);
}

// Exécution
main().catch(console.error);
