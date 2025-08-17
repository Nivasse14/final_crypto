#!/usr/bin/env node

// 🔧 Exécution automatique de la migration pour les métriques d'achat/vente
// Ce script exécute la migration SQL via l'API Supabase

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 MIGRATION MÉTRIQUES ACHAT/VENTE');
console.log('==================================');

async function runMigration() {
  try {
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'migration-add-buy-sell-metrics.sql');
    console.log(`📄 Lecture du fichier: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Fichier de migration non trouvé: ${migrationPath}`);
    }
    
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Fichier lu (${sqlContent.length} caractères)`);
    
    // Extraire les commandes ALTER TABLE (ignorer les commentaires et SELECT)
    const lines = sqlContent.split('\n');
    const alterCommands = [];
    
    let currentCommand = '';
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Ignorer les commentaires, lignes vides et SELECT
      if (trimmedLine.startsWith('--') || 
          trimmedLine === '' || 
          trimmedLine.startsWith('COMMENT') ||
          trimmedLine.startsWith('SELECT')) {
        continue;
      }
      
      currentCommand += line + '\n';
      
      // Si la ligne se termine par ;, c'est la fin d'une commande
      if (trimmedLine.endsWith(';')) {
        alterCommands.push(currentCommand.trim());
        currentCommand = '';
      }
    }
    
    console.log(`📝 ${alterCommands.length} commandes ALTER TABLE trouvées`);
    
    // Exécuter chaque commande ALTER TABLE
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < alterCommands.length; i++) {
      const command = alterCommands[i];
      console.log(`\n🔄 Exécution commande ${i + 1}/${alterCommands.length}:`);
      console.log(`   ${command.substring(0, 80)}...`);
      
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sql: command })
        });
        
        if (response.ok) {
          console.log(`   ✅ Succès`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.log(`   ⚠️ Erreur HTTP ${response.status}: ${errorText}`);
          
          // Les erreurs "column already exists" sont normales
          if (errorText.includes('already exists') || errorText.includes('duplicate column')) {
            console.log(`   ℹ️ Colonne déjà existante (normal)`);
            successCount++;
          } else {
            errorCount++;
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        errorCount++;
      }
      
      // Délai entre les commandes
      if (i < alterCommands.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Rapport final
    console.log(`\n📊 RAPPORT MIGRATION:`);
    console.log(`├── Commandes exécutées: ${alterCommands.length}`);
    console.log(`├── Succès: ${successCount}`);
    console.log(`├── Erreurs: ${errorCount}`);
    console.log(`└── Statut: ${errorCount === 0 ? '✅ MIGRATION RÉUSSIE' : '⚠️ MIGRATION PARTIELLE'}`);
    
    return { success: errorCount === 0, successCount, errorCount };
    
  } catch (error) {
    console.log(`❌ Erreur migration: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Vérifier les colonnes après migration
async function verifyColumns() {
  try {
    console.log(`\n🔍 VÉRIFICATION DES COLONNES:`);
    
    const columnsToCheck = [
      'average_buy_amount_usd', 'minimum_buy_amount_usd', 'maximum_buy_amount_usd',
      'total_buy_amount_usd', 'total_buy_count',
      'average_sell_amount_usd', 'minimum_sell_amount_usd', 'maximum_sell_amount_usd',
      'total_sell_amount_usd', 'total_sell_count'
    ];
    
    const columnsList = columnsToCheck.map(col => `'${col}'`).join(',');
    const query = `select=column_name,data_type&table_name=eq.wallet_registry&column_name=in.(${columnsList})`;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/information_schema.columns?${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur vérification: ${response.status}`);
    }
    
    const columns = await response.json();
    console.log(`📋 Colonnes trouvées: ${columns.length}/${columnsToCheck.length}`);
    
    const foundColumns = columns.map(col => col.column_name);
    const missingColumns = columnsToCheck.filter(col => !foundColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log(`✅ Toutes les colonnes sont présentes !`);
    } else {
      console.log(`⚠️ Colonnes manquantes: ${missingColumns.join(', ')}`);
    }
    
    // Afficher les colonnes présentes
    columns.forEach(col => {
      console.log(`   ✓ ${col.column_name} (${col.data_type})`);
    });
    
    return { success: missingColumns.length === 0, found: foundColumns.length, missing: missingColumns };
    
  } catch (error) {
    console.log(`❌ Erreur vérification: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Fonction principale
async function main() {
  console.log(`Démarrage de la migration...\n`);
  
  // 1. Exécuter la migration
  const migrationResult = await runMigration();
  
  // 2. Vérifier les colonnes
  const verifyResult = await verifyColumns();
  
  // 3. Rapport final
  console.log(`\n🎯 RÉSULTAT FINAL:`);
  if (migrationResult.success && verifyResult.success) {
    console.log(`✅ MIGRATION COMPLÈTE ET VÉRIFIÉE`);
    console.log(`📊 ${verifyResult.found} nouvelles colonnes disponibles`);
    console.log(`\n🚀 Vous pouvez maintenant lancer:`);
    console.log(`   node enrich-cielo-metrics.js test ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB`);
  } else {
    console.log(`⚠️ MIGRATION INCOMPLÈTE`);
    if (!migrationResult.success) {
      console.log(`   Erreur migration: ${migrationResult.error || 'Commandes en échec'}`);
    }
    if (!verifyResult.success) {
      console.log(`   Erreur vérification: ${verifyResult.error || 'Colonnes manquantes'}`);
    }
  }
}

// Exécution
main().catch(console.error);
