#!/usr/bin/env node

// 🔍 Script pour analyser les colonnes non utilisées dans wallet_registry
// Scanne tout le code pour identifier les colonnes utilisées vs non utilisées

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
  'id', 'wallet_address', 'created_at', 'updated_at'
];

function scanDirectory(dir, usedColumns = new Set()) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath, usedColumns);
    } else if (file.match(/\.(js|sql|cjs|ts|jsx|tsx)$/)) {
      scanFile(filePath, usedColumns);
    }
  }
  
  return usedColumns;
}

function scanFile(filePath, usedColumns) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Rechercher les références de colonnes
    ALL_COLUMNS.forEach(column => {
      // Patterns de recherche pour différents contextes
      const patterns = [
        new RegExp(`\\b${column}\\b`, 'g'),           // Référence directe
        new RegExp(`['"\`]${column}['"\`]`, 'g'),     // Dans des chaînes
        new RegExp(`${column}\\s*[=:]`, 'g'),         // Assignation
        new RegExp(`\\.${column}\\b`, 'g'),           // Accès propriété
        new RegExp(`${column}\\s*,`, 'g'),            // Dans une liste
      ];
      
      const found = patterns.some(pattern => pattern.test(content));
      if (found) {
        usedColumns.add(column);
      }
    });
    
  } catch (error) {
    console.warn(`Erreur lecture du fichier ${filePath}:`, error.message);
  }
}

function generateDropSQL(unusedColumns) {
  const columns = unusedColumns.filter(col => !ESSENTIAL_COLUMNS.includes(col));
  
  if (columns.length === 0) {
    return '-- Aucune colonne à supprimer (toutes sont utilisées ou essentielles)';
  }
  
  let sql = '-- Script pour supprimer les colonnes non utilisées de wallet_registry\n';
  sql += '-- ⚠️  ATTENTION: Faites une sauvegarde avant d\'exécuter !\n';
  sql += '-- ⚠️  Vérifiez manuellement que ces colonnes ne sont vraiment pas utilisées\n\n';
  
  sql += '-- Vérification préliminaire: voir les colonnes à supprimer\n';
  sql += 'SELECT column_name, data_type, is_nullable, column_default\n';
  sql += 'FROM information_schema.columns\n';
  sql += 'WHERE table_name = \'wallet_registry\'\n';
  sql += 'AND column_name IN (\n';
  sql += columns.map(col => `  '${col}'`).join(',\n');
  sql += '\n);\n\n';
  
  sql += '-- Sauvegarder les données si nécessaire\n';
  sql += '-- CREATE TABLE wallet_registry_backup AS SELECT * FROM wallet_registry;\n\n';
  
  sql += '-- Supprimer les colonnes une par une\n';
  columns.forEach(column => {
    sql += `ALTER TABLE wallet_registry DROP COLUMN IF EXISTS ${column};\n`;
  });
  
  sql += '\n-- Vérification finale\n';
  sql += 'SELECT COUNT(*) as remaining_columns\n';
  sql += 'FROM information_schema.columns\n';
  sql += 'WHERE table_name = \'wallet_registry\';\n';
  
  return sql;
}

function categorizeColumns(usedColumns, unusedColumns) {
  const categories = {
    dune: { used: [], unused: [] },
    enriched: { used: [], unused: [] },
    dexscreener: { used: [], unused: [] },
    cielo: { used: [], unused: [] },
    roi: { used: [], unused: [] },
    pnl: { used: [], unused: [] },
    buy_sell: { used: [], unused: [] },
    timestamps: { used: [], unused: [] },
    core: { used: [], unused: [] },
    other: { used: [], unused: [] }
  };
  
  function categorize(column, isUsed) {
    const target = isUsed ? 'used' : 'unused';
    
    if (column.startsWith('dune_')) {
      categories.dune[target].push(column);
    } else if (column.startsWith('enriched_')) {
      categories.enriched[target].push(column);
    } else if (column.startsWith('dexscreener_')) {
      categories.dexscreener[target].push(column);
    } else if (column.includes('_buy_') || column.includes('_sell_')) {
      categories.buy_sell[target].push(column);
    } else if (column.startsWith('roi_') || column.includes('roi')) {
      categories.roi[target].push(column);
    } else if (column.includes('pnl')) {
      categories.pnl[target].push(column);
    } else if (column.includes('timestamp') || column.includes('_at') || column.includes('_date')) {
      categories.timestamps[target].push(column);
    } else if (['id', 'wallet_address', 'created_at', 'updated_at', 'status'].includes(column)) {
      categories.core[target].push(column);
    } else {
      categories.other[target].push(column);
    }
  }
  
  usedColumns.forEach(col => categorize(col, true));
  unusedColumns.forEach(col => categorize(col, false));
  
  return categories;
}

function analyzeUnusedColumns() {
  console.log('🔍 ANALYSE DES COLONNES NON UTILISÉES - WALLET_REGISTRY');
  console.log('======================================================\n');
  
  console.log('📊 Scanning du code...');
  const usedColumns = scanDirectory('./');
  
  console.log(`✅ Scan terminé: ${usedColumns.size} colonnes utilisées trouvées\n`);
  
  const unusedColumns = ALL_COLUMNS.filter(col => !usedColumns.has(col));
  
  console.log('📈 RÉSULTATS:');
  console.log(`- Total colonnes: ${ALL_COLUMNS.length}`);
  console.log(`- Colonnes utilisées: ${usedColumns.size}`);
  console.log(`- Colonnes non utilisées: ${unusedColumns.length}\n`);
  
  // Catégorisation
  const categories = categorizeColumns(Array.from(usedColumns), unusedColumns);
  
  console.log('📂 ANALYSE PAR CATÉGORIE:');
  console.log('=========================\n');
  
  Object.entries(categories).forEach(([category, data]) => {
    const total = data.used.length + data.unused.length;
    if (total > 0) {
      console.log(`🏷️  ${category.toUpperCase()}:`);
      console.log(`   Utilisées: ${data.used.length}/${total}`);
      console.log(`   Non utilisées: ${data.unused.length}/${total}`);
      
      if (data.unused.length > 0) {
        console.log(`   🗑️  À supprimer: ${data.unused.join(', ')}`);
      }
      console.log('');
    }
  });
  
  console.log('🗑️  COLONNES NON UTILISÉES (détail):');
  console.log('====================================');
  
  if (unusedColumns.length === 0) {
    console.log('✅ Toutes les colonnes sont utilisées !');
  } else {
    unusedColumns.forEach(col => {
      console.log(`   ❌ ${col}`);
    });
    
    console.log(`\n📝 Génération du script SQL de suppression...`);
    const dropSQL = generateDropSQL(unusedColumns);
    
    // Sauvegarder le script
    fs.writeFileSync('drop-unused-columns.sql', dropSQL);
    console.log('✅ Script sauvegardé dans: drop-unused-columns.sql');
    
    console.log('\n⚠️  AVERTISSEMENTS:');
    console.log('==================');
    console.log('1. Faites une sauvegarde complète avant d\'exécuter le script');
    console.log('2. Vérifiez manuellement que ces colonnes ne sont pas utilisées ailleurs');
    console.log('3. Testez d\'abord sur un environnement de développement');
    console.log('4. Certaines colonnes peuvent être utilisées dans des vues ou fonctions non détectées');
  }
  
  return {
    totalColumns: ALL_COLUMNS.length,
    usedColumns: Array.from(usedColumns).sort(),
    unusedColumns: unusedColumns.sort(),
    categories,
    dropSQL: unusedColumns.length > 0 ? generateDropSQL(unusedColumns) : null
  };
}

// Exécution
const results = analyzeUnusedColumns();

// Sauvegarder les résultats complets
fs.writeFileSync('column-analysis-results.json', JSON.stringify(results, null, 2));
console.log('\n💾 Résultats complets sauvegardés dans: column-analysis-results.json');

export { analyzeUnusedColumns, ALL_COLUMNS, ESSENTIAL_COLUMNS };