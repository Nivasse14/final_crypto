#!/usr/bin/env node

// 🔍 Script pour vérifier les colonnes existantes et ajouter les manquantes
// Analyse la structure actuelle de wallet_registry

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🔍 AUDIT DES COLONNES WALLET_REGISTRY');
console.log('=====================================');

async function checkExistingColumns() {
  try {
    console.log('📊 Récupération des colonnes existantes...');
    
    // Récupérer toutes les colonnes de la table wallet_registry
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_table_columns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        table_name: 'wallet_registry'
      })
    });

    if (!response.ok) {
      // Fallback: utiliser information_schema directement
      console.log('⚠️ RPC non disponible, utilisation de information_schema...');
      
      const fallbackResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: `
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'wallet_registry' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        })
      });
      
      if (!fallbackResponse.ok) {
        throw new Error('Impossible de récupérer les colonnes');
      }
    }

    // Alternative: utiliser une requête simple pour découvrir les colonnes
    console.log('🔄 Utilisation d\'une méthode alternative...');
    
    const sampleResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!sampleResponse.ok) {
      throw new Error(`Erreur lors de la récupération d'un échantillon: ${sampleResponse.status}`);
    }
    
    const sampleData = await sampleResponse.json();
    
    if (sampleData.length === 0) {
      console.log('⚠️ Aucune donnée dans wallet_registry, impossible de déterminer la structure');
      return analyzeRequiredColumns();
    }
    
    const existingColumns = Object.keys(sampleData[0]);
    console.log(`✅ ${existingColumns.length} colonnes trouvées dans wallet_registry\n`);
    
    return analyzeRequiredColumns(existingColumns);
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return analyzeRequiredColumns();
  }
}

function analyzeRequiredColumns(existingColumns = []) {
  // Nouvelles métriques identifiées à partir des données pnl_data
  const newMetricsFromPnlData = [
    { 
      name: 'total_tokens_traded', 
      type: 'INTEGER', 
      comment: 'Nombre total de tokens tradés (API Cielo)',
      source: 'pnl_data.result.data.json.data.total_tokens_traded'
    },
    { 
      name: 'total_unrealized_pnl_usd', 
      type: 'NUMERIC(20,2)', 
      comment: 'PnL non réalisé en USD (API Cielo)',
      source: 'pnl_data.result.data.json.data.total_unrealized_pnl_usd'
    },
    { 
      name: 'total_unrealized_roi_percentage', 
      type: 'NUMERIC(10,4)', 
      comment: 'ROI non réalisé en pourcentage (API Cielo)',
      source: 'pnl_data.result.data.json.data.total_unrealized_roi_percentage'
    },
    { 
      name: 'combined_pnl_usd', 
      type: 'NUMERIC(20,2)', 
      comment: 'PnL combiné (réalisé + non réalisé) en USD (API Cielo)',
      source: 'pnl_data.result.data.json.data.combined_pnl_usd'
    },
    { 
      name: 'combined_roi_percentage', 
      type: 'NUMERIC(10,4)', 
      comment: 'ROI combiné en pourcentage (API Cielo)',
      source: 'pnl_data.result.data.json.data.combined_roi_percentage'
    },
    { 
      name: 'combined_average_hold_time', 
      type: 'NUMERIC(12,2)', 
      comment: 'Temps de détention moyen combiné en heures (API Cielo)',
      source: 'pnl_data.result.data.json.data.combined_average_hold_time'
    },
    { 
      name: 'combined_median_hold_time', 
      type: 'NUMERIC(12,2)', 
      comment: 'Temps de détention médian combiné en heures (API Cielo)',
      source: 'pnl_data.result.data.json.data.combined_median_hold_time'
    }
  ];

  // Colonnes déjà prévues dans la migration existante
  const existingMigrationColumns = [
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

  console.log('📋 ANALYSE DES COLONNES:');
  console.log('========================');
  
  if (existingColumns.length > 0) {
    console.log('✅ COLONNES EXISTANTES:');
    existingColumns.forEach(col => {
      const isFromMigration = existingMigrationColumns.includes(col);
      const icon = isFromMigration ? '🆕' : '📊';
      console.log(`   ${icon} ${col}`);
    });
    console.log('');
  }

  console.log('🆕 NOUVELLES COLONNES À AJOUTER (depuis pnl_data):');
  newMetricsFromPnlData.forEach(metric => {
    const exists = existingColumns.includes(metric.name);
    const status = exists ? '✅ Existe déjà' : '➕ À ajouter';
    console.log(`   ${status} ${metric.name} (${metric.type})`);
  });

  // Générer la migration SQL pour les nouvelles colonnes
  const missingColumns = newMetricsFromPnlData.filter(metric => 
    !existingColumns.includes(metric.name)
  );

  if (missingColumns.length > 0) {
    console.log('\n📝 MIGRATION SQL GÉNÉRÉE:');
    console.log('=========================');
    
    const migrationSQL = generateMigrationSQL(missingColumns);
    console.log(migrationSQL);
    
    return {
      existingColumns,
      missingColumns,
      migrationSQL
    };
  } else {
    console.log('\n✅ Toutes les colonnes sont déjà présentes !');
    return {
      existingColumns,
      missingColumns: [],
      migrationSQL: null
    };
  }
}

function generateMigrationSQL(missingColumns) {
  let sql = `-- Migration pour ajouter les nouvelles métriques pnl_data\n`;
  sql += `-- À exécuter dans le SQL Editor de Supabase\n\n`;
  
  // Ajouter les colonnes
  missingColumns.forEach(column => {
    sql += `ALTER TABLE wallet_registry ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} DEFAULT NULL;\n`;
  });
  
  sql += '\n-- Ajouter des commentaires pour documentation\n';
  
  // Ajouter les commentaires
  missingColumns.forEach(column => {
    sql += `COMMENT ON COLUMN wallet_registry.${column.name} IS '${column.comment}';\n`;
  });
  
  sql += '\n-- Vérification\n';
  sql += 'SELECT column_name, data_type, is_nullable, column_default\n';
  sql += 'FROM information_schema.columns \n';
  sql += 'WHERE table_name = \'wallet_registry\' \n';
  sql += 'AND column_name IN (\n';
  
  const columnNames = missingColumns.map(col => `  '${col.name}'`).join(',\n');
  sql += columnNames + '\n';
  sql += ')\n';
  sql += 'ORDER BY column_name;';
  
  return sql;
}

async function main() {
  const result = await checkExistingColumns();
  
  if (result && result.migrationSQL) {
    console.log('\n💾 SAUVEGARDE DE LA MIGRATION:');
    console.log('==============================');
    
    // Sauvegarder la migration dans un fichier
    const fs = require('fs');
    const migrationFile = 'migration-add-pnl-metrics.sql';
    
    try {
      fs.writeFileSync(migrationFile, result.migrationSQL);
      console.log(`✅ Migration sauvegardée dans: ${migrationFile}`);
      console.log('\n🚀 PROCHAINES ÉTAPES:');
      console.log('1. Examinez le fichier migration-add-pnl-metrics.sql');
      console.log('2. Exécutez-le dans le SQL Editor de Supabase');
      console.log('3. Mettez à jour le script d\'enrichissement pour inclure ces nouvelles métriques');
    } catch (error) {
      console.log(`❌ Erreur sauvegarde: ${error.message}`);
    }
  }
}

main().catch(console.error);
