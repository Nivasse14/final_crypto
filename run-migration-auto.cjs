#!/usr/bin/env node

/**
 * Script automatisé pour exécuter la migration des nouvelles métriques Cielo
 * Tente d'exécuter la migration via l'API Supabase et valide les résultats
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://xkndddxqqlxqknbqtefv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAxNjcxMSwiZXhwIjoyMDY4NTkyNzExfQ.k6ckJjZEpaNF2nwttZTg1iJ9i2SfzAXU75SLFYp3yDQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  console.log('🚀 EXÉCUTION AUTOMATISÉE DE LA MIGRATION CIELO\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Lire le fichier de migration
    console.log('\n📖 1. LECTURE DU FICHIER DE MIGRATION:');
    
    const migrationFile = 'migration-add-cielo-metrics.sql';
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Fichier ${migrationFile} non trouvé`);
    }
    
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    console.log(`   ✅ Fichier ${migrationFile} lu (${migrationSQL.length} caractères)`);
    
    // 2. Extraire les commandes ALTER TABLE individuelles
    console.log('\n🔧 2. EXTRACTION DES COMMANDES SQL:');
    
    const alterCommands = migrationSQL
      .split('\n')
      .filter(line => line.trim().startsWith('ALTER TABLE'))
      .map(line => line.trim());
    
    console.log(`   ✅ ${alterCommands.length} commandes ALTER TABLE trouvées`);
    
    // 3. Exécuter chaque commande individuellement
    console.log('\n⚡ 3. EXÉCUTION DES COMMANDES:');
    
    let successCount = 0;
    const results = [];
    
    for (let i = 0; i < alterCommands.length; i++) {
      const command = alterCommands[i];
      const columnName = command.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
      
      try {
        console.log(`   ${i+1}. Ajout de ${columnName}...`);
        
        // Exécuter via l'API Supabase (méthode alternative)
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command 
        });
        
        if (error) {
          console.log(`      ❌ Erreur: ${error.message}`);
          results.push({ column: columnName, success: false, error: error.message });
        } else {
          console.log(`      ✅ ${columnName} ajoutée avec succès`);
          results.push({ column: columnName, success: true });
          successCount++;
        }
      } catch (err) {
        console.log(`      ❌ Exception: ${err.message}`);
        results.push({ column: columnName, success: false, error: err.message });
      }
    }
    
    console.log(`\n   📊 Résultats: ${successCount}/${alterCommands.length} commandes réussies`);
    
    // 4. Vérification des colonnes ajoutées
    console.log('\n🔍 4. VÉRIFICATION DES COLONNES:');
    
    const newColumns = [
      'average_holding_time', 'total_pnl', 'winrate', 'total_roi_percentage',
      'swap_count', 'first_swap_timestamp', 'last_swap_timestamp', 
      'unique_trading_days', 'consecutive_trading_days', 'average_trades_per_token'
    ];
    
    let verifiedCount = 0;
    
    for (const column of newColumns) {
      try {
        const { data, error } = await supabase
          .from('wallet_registry')
          .select(column)
          .limit(1);
          
        if (error) {
          console.log(`   ❌ ${column}: ${error.message}`);
        } else {
          console.log(`   ✅ ${column}: Présente et accessible`);
          verifiedCount++;
        }
      } catch (err) {
        console.log(`   ❌ ${column}: Erreur de vérification`);
      }
    }
    
    console.log(`\n   📈 Vérification: ${verifiedCount}/${newColumns.length} colonnes accessibles`);
    
    // 5. Test d'insertion rapide
    console.log('\n💾 5. TEST D\'INSERTION:');
    
    if (verifiedCount > 5) {
      const testData = {
        wallet_address: `TEST_MIGRATION_${Date.now()}`,
        average_holding_time: 48.5,
        total_pnl: 1234.56,
        winrate: 0.75,
        swap_count: 100,
        unique_trading_days: 30,
        status: 'test',
        created_at: new Date().toISOString()
      };
      
      try {
        const { data, error } = await supabase
          .from('wallet_registry')
          .insert(testData)
          .select()
          .single();
          
        if (error) {
          console.log(`   ❌ Test insertion échoué: ${error.message}`);
        } else {
          console.log(`   ✅ Test insertion réussi: ${data.wallet_address}`);
          
          // Nettoyage
          await supabase
            .from('wallet_registry')
            .delete()
            .eq('wallet_address', testData.wallet_address);
          console.log(`   🧹 Données de test supprimées`);
        }
      } catch (err) {
        console.log(`   ❌ Erreur test insertion: ${err.message}`);
      }
    } else {
      console.log(`   ⚠️  Test ignoré (trop peu de colonnes vérifiées)`);
    }
    
    // 6. Résumé final
    console.log('\n' + '='.repeat(60));
    
    if (verifiedCount === newColumns.length) {
      console.log('🎉 MIGRATION RÉUSSIE À 100% !');
      console.log('Toutes les nouvelles métriques Cielo sont disponibles.');
      
      console.log('\n🚀 PROCHAINES ÉTAPES:');
      console.log('1. Tester: node test-new-cielo-metrics.cjs');
      console.log('2. Intégration: node test-cielo-integration-complete.cjs');
      console.log('3. Déployer les fonctions Supabase mises à jour');
      
    } else if (verifiedCount > 0) {
      console.log('⚠️  MIGRATION PARTIELLE');
      console.log(`${verifiedCount}/${newColumns.length} colonnes sont disponibles.`);
      
      console.log('\n📋 ACTIONS MANUELLES REQUISES:');
      console.log('1. Copier migration-add-cielo-metrics.sql');
      console.log('2. Coller dans Supabase SQL Editor');
      console.log('3. Exécuter manuellement');
      
    } else {
      console.log('❌ MIGRATION ÉCHOUÉE');
      console.log('Aucune nouvelle colonne n\'a pu être ajoutée.');
      
      console.log('\n🔧 SOLUTION:');
      console.log('Exécution manuelle requise dans Supabase SQL Editor.');
    }
    
  } catch (error) {
    console.error('\n💥 ERREUR GLOBALE:', error.message);
    
    console.log('\n📋 SOLUTION DE CONTOURNEMENT:');
    console.log('1. Ouvrir Supabase Dashboard');
    console.log('2. Aller dans SQL Editor'); 
    console.log('3. Copier/coller migration-add-cielo-metrics.sql');
    console.log('4. Exécuter manuellement');
    console.log('5. Relancer: node test-new-cielo-metrics.cjs');
  }
}

// Exécuter la migration
executeMigration();
