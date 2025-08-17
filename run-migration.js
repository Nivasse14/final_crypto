#!/usr/bin/env node

// 🛠️ Script pour exécuter la migration des nouvelles colonnes Cielo
// Ce script applique la migration directement via l'API Supabase

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🛠️ EXÉCUTION DE LA MIGRATION CIELO');
console.log('==================================');

const migrationCommands = [
  // Nouvelles métriques pnl_data
  `ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_tokens_traded INTEGER DEFAULT NULL;`,
  `ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_unrealized_pnl_usd NUMERIC(20,2) DEFAULT NULL;`,
  `ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS total_unrealized_roi_percentage NUMERIC(10,4) DEFAULT NULL;`,
  `ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_pnl_usd NUMERIC(20,2) DEFAULT NULL;`,
  `ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_roi_percentage NUMERIC(10,4) DEFAULT NULL;`,
  `ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_average_hold_time NUMERIC(12,2) DEFAULT NULL;`,
  `ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS combined_median_hold_time NUMERIC(12,2) DEFAULT NULL;`
];

const commentCommands = [
  `COMMENT ON COLUMN wallet_registry.total_tokens_traded IS 'Nombre total de tokens tradés (API Cielo)';`,
  `COMMENT ON COLUMN wallet_registry.total_unrealized_pnl_usd IS 'PnL non réalisé en USD (API Cielo)';`,
  `COMMENT ON COLUMN wallet_registry.total_unrealized_roi_percentage IS 'ROI non réalisé en pourcentage (API Cielo)';`,
  `COMMENT ON COLUMN wallet_registry.combined_pnl_usd IS 'PnL combiné (réalisé + non réalisé) en USD (API Cielo)';`,
  `COMMENT ON COLUMN wallet_registry.combined_roi_percentage IS 'ROI combiné en pourcentage (API Cielo)';`,
  `COMMENT ON COLUMN wallet_registry.combined_average_hold_time IS 'Temps de détention moyen combiné en heures (API Cielo)';`,
  `COMMENT ON COLUMN wallet_registry.combined_median_hold_time IS 'Temps de détention médian combiné en heures (API Cielo)';`
];

async function executeSQLCommand(sql) {
  try {
    console.log(`📤 Exécution: ${sql.substring(0, 80)}...`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SQL Error: ${response.status} - ${errorText}`);
    }

    console.log(`✅ Succès`);
    return true;
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Démarrage de la migration...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Exécuter les commandes ALTER TABLE
  console.log('📊 1. AJOUT DES NOUVELLES COLONNES:');
  console.log('===================================');
  
  for (const command of migrationCommands) {
    const success = await executeSQLCommand(command);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Petit délai entre les commandes
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n💬 2. AJOUT DES COMMENTAIRES:');
  console.log('=============================');
  
  // Exécuter les commandes COMMENT
  for (const command of commentCommands) {
    const success = await executeSQLCommand(command);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🔍 3. VÉRIFICATION FINALE:');
  console.log('==========================');
  
  // Vérifier que les colonnes ont été créées
  const verificationSQL = `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'wallet_registry' 
    AND column_name IN (
      'total_tokens_traded',
      'total_unrealized_pnl_usd',
      'total_unrealized_roi_percentage',
      'combined_pnl_usd',
      'combined_roi_percentage',
      'combined_average_hold_time',
      'combined_median_hold_time'
    )
    ORDER BY column_name;
  `;
  
  const verificationSuccess = await executeSQLCommand(verificationSQL);
  
  console.log('\n📈 RAPPORT FINAL:');
  console.log('=================');
  console.log(`✅ Commandes réussies: ${successCount}`);
  console.log(`❌ Commandes échouées: ${errorCount}`);
  console.log(`📊 Total: ${successCount + errorCount} commandes`);
  
  if (errorCount === 0) {
    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS !');
    console.log('Les nouvelles colonnes sont maintenant disponibles.');
    console.log('\n🚀 Prochaines étapes:');
    console.log('1. Testez l\'enrichissement: node enrich-cielo-metrics.js test [wallet]');
    console.log('2. Vérifiez les données: node verify-cielo-metrics.js');
    console.log('3. Enrichissez en lot: node enrich-cielo-metrics.js batch 10');
  } else {
    console.log('\n⚠️ MIGRATION PARTIELLEMENT RÉUSSIE');
    console.log('Certaines commandes ont échoué. Vérifiez les erreurs ci-dessus.');
    console.log('Vous pouvez aussi exécuter manuellement le fichier migration-add-cielo-metrics.sql');
    console.log('dans le SQL Editor de Supabase.');
  }
}

async function main() {
  try {
    await runMigration();
  } catch (error) {
    console.log(`💥 Erreur critique: ${error.message}`);
    console.log('\n🔧 Solution alternative:');
    console.log('Copiez et exécutez le contenu de migration-add-cielo-metrics.sql');
    console.log('directement dans le SQL Editor de Supabase.');
  }
}

main().catch(console.error);
