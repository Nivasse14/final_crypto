#!/usr/bin/env node

// 🔍 Analyse approfondie des colonnes réellement utilisées
// Distingue entre les références dans les migrations et les usages réels

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste complète des colonnes existantes dans la base
const ALL_COLUMNS = [
  'id', 'wallet_address', 'solscan_url', 'gmgn_url', 'cielo_url', 'wallet_pnl_link',
  'dune_wallet_pnl', 'dune_total_bought_usd', 'dune_total_pnl_usd', 'dune_roi', 'dune_mroi',
  'dune_invalids', 'dune_tokens', 'dune_nosells', 'dune_losses', 'dune_nulls', 'dune_wins',
  'dune_winrate', 'dune_w2x', 'dune_w10x', 'dune_w100x', 'dune_scalps', 'dune_scalp_ratio',
  'dune_bal', 'dune_bal_ratio', 'dune_last_trade', 'dune_trade_days', 'status', 'last_processed_at',
  'processing_attempts', 'last_error', 'enriched_analysis_score', 'enriched_total_value_usd',
  'enriched_total_tokens', 'enriched_winrate', 'enriched_total_pnl_usd', 'enriched_ai_category',
  'enriched_ai_risk_level', 'enriched_data_completeness_score', 'created_at', 'updated_at',
  'data_source', 'metadata', 'roi', 'winrate', 'tokens_traded', 'wins', 'losses', 'trade_count',
  'last_trade_date', 'source', 'total_pnl_usd', 'total_bought_usd', 'enriched_total_trades',
  'enriched_roi_percentage', 'enriched_portfolio_value_usd', 'enriched_portfolio_tokens',
  'dexscreener_enriched_portfolio_tokens', 'dexscreener_enriched_pnl_tokens',
  'dexscreener_tokens_with_market_cap', 'dexscreener_tokens_with_price_data',
  'dexscreener_average_reliability_score', 'cielo_complete_data', 'cielo_last_enriched_at',
  'dexscreener_last_enriched_at', 'processing_version', 'pnl_low_cap_count', 'pnl_middle_cap_count',
  'pnl_large_cap_count', 'pnl_mega_cap_count', 'pnl_unknown_cap_count', 'pnl_total_analyzed_count',
  'pnl_total_volume_24h_usd', 'pnl_avg_volume_24h_usd', 'pnl_tokens_with_volume_data',
  'portfolio_total_volume_24h_usd', 'portfolio_avg_volume_24h_usd', 'portfolio_tokens_with_volume_data',
  'profit_factor_30d', 'expectancy_usd_30d', 'drawdown_max_usd_30d', 'median_hold_min_30d',
  'scalp_ratio_30d', 'cap_exposure_micro_pct_30d', 'cap_exposure_low_pct_30d',
  'cap_exposure_mid_pct_30d', 'cap_exposure_large_pct_30d', 'cap_exposure_mega_pct_30d',
  'liquidity_median_usd_30d', 'recency_score_30d', 'streak_wins_max_90d', 'streak_losses_max_90d',
  'copy_trading_score', 'pnl_30d', 'trade_count_30d', 'winrate_30d', 'roi_pct_30d',
  'dexscreener_micro_cap_count', 'dexscreener_low_cap_count', 'dexscreener_middle_cap_count',
  'dexscreener_large_cap_count', 'dexscreener_mega_cap_count', 'dexscreener_unknown_cap_count',
  'dexscreener_total_analyzed_count', 'average_holding_time', 'total_pnl', 'total_roi_percentage',
  'swap_count', 'first_swap_timestamp', 'last_swap_timestamp', 'unique_trading_days',
  'consecutive_trading_days', 'average_trades_per_token', 'total_tokens_traded',
  'total_unrealized_pnl_usd', 'combined_pnl_usd', 'combined_roi_percentage',
  'combined_average_hold_time', 'combined_median_hold_time', 'average_buy_amount_usd',
  'minimum_buy_amount_usd', 'maximum_buy_amount_usd', 'total_buy_amount_usd', 'total_buy_count',
  'average_sell_amount_usd', 'minimum_sell_amount_usd', 'maximum_sell_amount_usd',
  'total_sell_amount_usd', 'total_sell_count', 'roi_above_500', 'roi_200_to_500',
  'roi_50_to_200', 'roi_0_to_50', 'roi_neg50_to_0', 'roi_below_neg50', 'roi_total_trades',
  'roi_winning_trades', 'roi_losing_trades', 'roi_distribution_last_updated',
  'total_unrealized_roi_percentage', 'pnl_data_last_updated'
];

// Colonnes essentielles qui ne doivent jamais être supprimées
const ESSENTIAL_COLUMNS = [
  'id', 'wallet_address', 'created_at', 'updated_at', 'status'
];

function analyzeRealUsage() {
  console.log('🔍 ANALYSE APPROFONDIE DES COLONNES RÉELLEMENT UTILISÉES');
  console.log('========================================================\n');
  
  const usageResults = {};
  
  // Initialiser les résultats pour chaque colonne
  ALL_COLUMNS.forEach(col => {
    usageResults[col] = {
      inSelects: [],
      inUpdates: [],
      inInserts: [],
      inMigrations: [],
      inJsCode: [],
      inConfigFiles: [],
      totalReferences: 0,
      isReallyUsed: false
    };
  });
  
  // Scanner tous les fichiers
  scanDirectoryDeep('./', usageResults);
  
  // Analyser les résultats
  const reallyUsedColumns = [];
  const probablyUnusedColumns = [];
  const migrationOnlyColumns = [];
  
  ALL_COLUMNS.forEach(col => {
    const usage = usageResults[col];
    
    // Considérer comme vraiment utilisé si:
    // - Présent dans des SELECT/UPDATE/INSERT non-migration
    // - Ou utilisé dans du code JS/application
    const realUsage = usage.inSelects.length > 0 || 
                     usage.inUpdates.length > 0 || 
                     (usage.inJsCode.length > 0 && !isOnlyInMigrationFiles(usage.inJsCode));
    
    if (realUsage || ESSENTIAL_COLUMNS.includes(col)) {
      reallyUsedColumns.push(col);
      usage.isReallyUsed = true;
    } else if (usage.inMigrations.length > 0 && usage.totalReferences === usage.inMigrations.length) {
      migrationOnlyColumns.push(col);
    } else {
      probablyUnusedColumns.push(col);
    }
  });
  
  // Afficher les résultats
  console.log('📊 RÉSULTATS DE L\'ANALYSE APPROFONDIE:');
  console.log(`- Total colonnes: ${ALL_COLUMNS.length}`);
  console.log(`- Colonnes vraiment utilisées: ${reallyUsedColumns.length}`);
  console.log(`- Colonnes seulement dans migrations: ${migrationOnlyColumns.length}`);
  console.log(`- Colonnes probablement non utilisées: ${probablyUnusedColumns.length}\n`);
  
  // Détail des colonnes probablement non utilisées
  if (probablyUnusedColumns.length > 0) {
    console.log('❌ COLONNES PROBABLEMENT NON UTILISÉES:');
    console.log('======================================');
    probablyUnusedColumns.forEach(col => {
      const usage = usageResults[col];
      console.log(`\n🗑️  ${col}:`);
      console.log(`   - Références totales: ${usage.totalReferences}`);
      console.log(`   - Dans migrations: ${usage.inMigrations.length}`);
      console.log(`   - Dans SELECT: ${usage.inSelects.length}`);
      console.log(`   - Dans UPDATE: ${usage.inUpdates.length}`);
      console.log(`   - Dans code JS: ${usage.inJsCode.length}`);
    });
  }
  
  // Détail des colonnes migration-only
  if (migrationOnlyColumns.length > 0) {
    console.log('\n⚠️  COLONNES UNIQUEMENT DANS MIGRATIONS:');
    console.log('=======================================');
    migrationOnlyColumns.forEach(col => {
      console.log(`   📝 ${col} (${usageResults[col].inMigrations.length} références)`);
    });
  }
  
  // Générer le script SQL de suppression
  const columnsToRemove = [...probablyUnusedColumns, ...migrationOnlyColumns].filter(col => 
    !ESSENTIAL_COLUMNS.includes(col)
  );
  
  if (columnsToRemove.length > 0) {
    const dropSQL = generateDetailedDropSQL(columnsToRemove, usageResults);
    fs.writeFileSync('drop-really-unused-columns.sql', dropSQL);
    console.log(`\n✅ Script SQL généré: drop-really-unused-columns.sql`);
    console.log(`📋 Colonnes à supprimer: ${columnsToRemove.length}`);
  }
  
  // Sauvegarder l'analyse complète
  const results = {
    totalColumns: ALL_COLUMNS.length,
    reallyUsedColumns,
    migrationOnlyColumns,
    probablyUnusedColumns,
    usageDetails: usageResults,
    analysis: {
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(reallyUsedColumns, migrationOnlyColumns, probablyUnusedColumns)
    }
  };
  
  fs.writeFileSync('deep-column-analysis.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Analyse complète sauvegardée: deep-column-analysis.json');
  
  return results;
}

function scanDirectoryDeep(dir, usageResults) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectoryDeep(filePath, usageResults);
        } else if (file.match(/\.(js|sql|cjs|ts|jsx|tsx|json)$/)) {
          scanFileDeep(filePath, usageResults);
        }
      } catch (err) {
        // Ignorer les erreurs de fichiers individuels
      }
    }
  } catch (err) {
    console.warn(`Erreur scanning répertoire ${dir}:`, err.message);
  }
}

function scanFileDeep(filePath, usageResults) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const isMigrationFile = fileName.includes('migration') || fileName.includes('create') || fileName.includes('add-');
    const isSqlFile = filePath.endsWith('.sql');
    const isJsFile = filePath.match(/\.(js|cjs|ts|jsx|tsx)$/);
    const isConfigFile = fileName.includes('package') || fileName.includes('config');
    
    ALL_COLUMNS.forEach(column => {
      const usage = usageResults[column];
      
      // Recherche SELECT
      const selectPattern = new RegExp(`SELECT[^;]*\\b${column}\\b[^;]*FROM\\s+wallet_registry`, 'gi');
      if (selectPattern.test(content)) {
        usage.inSelects.push(filePath);
        usage.totalReferences++;
      }
      
      // Recherche UPDATE
      const updatePattern = new RegExp(`UPDATE\\s+wallet_registry\\s+SET[^;]*\\b${column}\\s*=`, 'gi');
      if (updatePattern.test(content)) {
        usage.inUpdates.push(filePath);
        usage.totalReferences++;
      }
      
      // Recherche INSERT avec colonnes explicites
      const insertPattern = new RegExp(`INSERT\\s+INTO\\s+wallet_registry[^;]*\\b${column}\\b`, 'gi');
      if (insertPattern.test(content)) {
        usage.inInserts.push(filePath);
        usage.totalReferences++;
      }
      
      // Recherche dans migrations
      if (isMigrationFile || (isSqlFile && content.includes('ADD COLUMN'))) {
        const migrationPattern = new RegExp(`\\b${column}\\b`, 'gi');
        if (migrationPattern.test(content)) {
          usage.inMigrations.push(filePath);
          usage.totalReferences++;
        }
      }
      
      // Recherche dans code JS/TS (hors migrations)
      if (isJsFile && !isMigrationFile && !isConfigFile) {
        const patterns = [
          new RegExp(`['"\`]${column}['"\`]`, 'g'),     // Dans des chaînes
          new RegExp(`\\.${column}\\b`, 'g'),           // Accès propriété
          new RegExp(`${column}\\s*[:=]`, 'g'),         // Assignation
        ];
        
        const found = patterns.some(pattern => pattern.test(content));
        if (found) {
          usage.inJsCode.push(filePath);
          usage.totalReferences++;
        }
      }
      
      // Recherche dans fichiers config
      if (isConfigFile) {
        const configPattern = new RegExp(`\\b${column}\\b`, 'gi');
        if (configPattern.test(content)) {
          usage.inConfigFiles.push(filePath);
          usage.totalReferences++;
        }
      }
    });
    
  } catch (error) {
    // Ignorer les erreurs de lecture
  }
}

function isOnlyInMigrationFiles(files) {
  return files.every(file => {
    const fileName = path.basename(file);
    return fileName.includes('migration') || fileName.includes('create') || fileName.includes('add-');
  });
}

function generateDetailedDropSQL(columnsToRemove, usageResults) {
  let sql = '-- Script pour supprimer les colonnes non utilisées de wallet_registry\n';
  sql += '-- Généré automatiquement par l\'analyse de code\n';
  sql += `-- Date: ${new Date().toISOString()}\n`;
  sql += '-- ⚠️  ATTENTION: Faites une sauvegarde complète avant d\'exécuter !\n\n';
  
  sql += '-- ÉTAPE 1: Vérification des colonnes à supprimer\n';
  sql += 'SELECT column_name, data_type, is_nullable, column_default\n';
  sql += 'FROM information_schema.columns\n';
  sql += 'WHERE table_name = \'wallet_registry\'\n';
  sql += 'AND column_name IN (\n';
  sql += columnsToRemove.map(col => `  '${col}'`).join(',\n');
  sql += '\n)\nORDER BY column_name;\n\n';
  
  sql += '-- ÉTAPE 2: Sauvegarder les données (optionnel)\n';
  sql += '-- CREATE TABLE wallet_registry_backup AS SELECT * FROM wallet_registry;\n\n';
  
  sql += '-- ÉTAPE 3: Supprimer les colonnes par catégorie\n\n';
  
  // Grouper par catégorie
  const categories = {
    dune: columnsToRemove.filter(col => col.startsWith('dune_')),
    enriched: columnsToRemove.filter(col => col.startsWith('enriched_')),
    dexscreener: columnsToRemove.filter(col => col.startsWith('dexscreener_')),
    roi: columnsToRemove.filter(col => col.startsWith('roi_') || col.includes('roi')),
    pnl: columnsToRemove.filter(col => col.includes('pnl') && !col.includes('dune')),
    other: columnsToRemove.filter(col => 
      !col.startsWith('dune_') && 
      !col.startsWith('enriched_') && 
      !col.startsWith('dexscreener_') && 
      !col.startsWith('roi_') && 
      !col.includes('roi') && 
      !col.includes('pnl')
    )
  };
  
  Object.entries(categories).forEach(([category, columns]) => {
    if (columns.length > 0) {
      sql += `-- ${category.toUpperCase()} columns (${columns.length})\n`;
      columns.forEach(col => {
        const usage = usageResults[col];
        sql += `-- ${col} - Références: ${usage.totalReferences} (migrations: ${usage.inMigrations.length})\n`;
        sql += `ALTER TABLE wallet_registry DROP COLUMN IF EXISTS ${col};\n`;
      });
      sql += '\n';
    }
  });
  
  sql += '-- ÉTAPE 4: Vérification finale\n';
  sql += 'SELECT COUNT(*) as remaining_columns\n';
  sql += 'FROM information_schema.columns\n';
  sql += 'WHERE table_name = \'wallet_registry\';\n\n';
  
  sql += 'SELECT \'Suppression terminée - Vérifiez que tout fonctionne!\' as status;\n';
  
  return sql;
}

function generateRecommendations(used, migrationOnly, unused) {
  const recommendations = [];
  
  if (unused.length > 0) {
    recommendations.push({
      type: 'DELETE_SAFE',
      columns: unused,
      description: 'Ces colonnes peuvent être supprimées en toute sécurité - aucune utilisation détectée'
    });
  }
  
  if (migrationOnly.length > 0) {
    recommendations.push({
      type: 'DELETE_REVIEW',
      columns: migrationOnly,
      description: 'Ces colonnes ne sont référencées que dans les migrations - vérifiez si elles sont utilisées ailleurs'
    });
  }
  
  recommendations.push({
    type: 'KEEP',
    columns: used,
    description: 'Ces colonnes sont activement utilisées et doivent être conservées'
  });
  
  return recommendations;
}

// Exécution
const results = analyzeRealUsage();