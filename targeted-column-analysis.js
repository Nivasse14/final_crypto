#!/usr/bin/env node

// 🔍 Analyse manuelle des colonnes avec patterns spécifiques
// Focus sur les vraies utilisations dans SELECT, UPDATE, INSERT

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste complète des colonnes
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
  'id', 'wallet_address', 'created_at', 'updated_at', 'status', 'last_processed_at'
];

function findActualUsage() {
  console.log('🔍 RECHERCHE D\'UTILISATION RÉELLE DES COLONNES');
  console.log('==============================================\n');
  
  const usedInSelects = new Set();
  const usedInUpdates = new Set();
  const usedInJsRead = new Set();
  const usedInJsWrite = new Set();
  const onlyInMigrations = new Set();
  
  // Scanner tous les fichiers
  const files = getAllFiles('./');
  
  console.log(`📊 Scanning ${files.length} fichiers...\n`);
  
  files.forEach(filePath => {
    if (shouldAnalyzeFile(filePath)) {
      analyzeFileForUsage(filePath, {usedInSelects, usedInUpdates, usedInJsRead, usedInJsWrite, onlyInMigrations});
    }
  });
  
  // Analyser les résultats
  const allUsedColumns = new Set([
    ...usedInSelects,
    ...usedInUpdates, 
    ...usedInJsRead,
    ...usedInJsWrite
  ]);
  
  const totallyUnused = ALL_COLUMNS.filter(col => !allUsedColumns.has(col) && !ESSENTIAL_COLUMNS.includes(col));
  const readOnlyColumns = ALL_COLUMNS.filter(col => 
    usedInSelects.has(col) && !usedInUpdates.has(col) && !usedInJsWrite.has(col)
  );
  
  // Affichage des résultats
  console.log('📈 RÉSULTATS:');
  console.log(`- Colonnes utilisées en SELECT: ${usedInSelects.size}`);
  console.log(`- Colonnes utilisées en UPDATE: ${usedInUpdates.size}`);
  console.log(`- Colonnes lues en JS: ${usedInJsRead.size}`);
  console.log(`- Colonnes écrites en JS: ${usedInJsWrite.size}`);
  console.log(`- Total colonnes utilisées: ${allUsedColumns.size}`);
  console.log(`- Colonnes totalement non utilisées: ${totallyUnused.length}\n`);
  
  // Colonnes complètement non utilisées
  if (totallyUnused.length > 0) {
    console.log('❌ COLONNES TOTALEMENT NON UTILISÉES:');
    console.log('====================================');
    totallyUnused.forEach(col => {
      console.log(`   🗑️  ${col}`);
    });
    console.log('');
  }
  
  // Colonnes en lecture seule (potentiellement supprimables)
  if (readOnlyColumns.length > 0) {
    console.log('📖 COLONNES EN LECTURE SEULE (review nécessaire):');
    console.log('=================================================');
    readOnlyColumns.forEach(col => {
      console.log(`   👁️  ${col}`);
    });
    console.log('');
  }
  
  // Générer le SQL de suppression
  const columnsToRemove = totallyUnused;
  
  if (columnsToRemove.length > 0) {
    const dropSQL = generateTargetedDropSQL(columnsToRemove);
    fs.writeFileSync('drop-targeted-columns.sql', dropSQL);
    console.log(`✅ Script SQL généré: drop-targeted-columns.sql`);
    console.log(`📋 Colonnes ciblées pour suppression: ${columnsToRemove.length}\n`);
  } else {
    console.log('✅ Aucune colonne complètement non utilisée trouvée.\n');
  }
  
  // Analyse détaillée par catégorie
  analyzeByCategory(totallyUnused, readOnlyColumns, allUsedColumns);
  
  return {
    totallyUnused,
    readOnlyColumns,
    usedInSelects: Array.from(usedInSelects),
    usedInUpdates: Array.from(usedInUpdates),
    usedInJsRead: Array.from(usedInJsRead),
    usedInJsWrite: Array.from(usedInJsWrite),
    allUsed: Array.from(allUsedColumns)
  };
}

function getAllFiles(dir, files = []) {
  try {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          getAllFiles(fullPath, files);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      } catch (err) {
        // Ignorer les erreurs de fichiers individuels
      }
    }
  } catch (err) {
    console.warn(`Erreur lecture répertoire ${dir}:`, err.message);
  }
  
  return files;
}

function shouldAnalyzeFile(filePath) {
  const ext = path.extname(filePath);
  const basename = path.basename(filePath);
  
  // Inclure les fichiers JS, SQL, etc.
  if (!['.js', '.sql', '.cjs', '.ts', '.jsx', '.tsx'].includes(ext)) {
    return false;
  }
  
  // Exclure certains fichiers
  if (basename.includes('node_modules') || 
      basename.includes('package-lock') ||
      basename.startsWith('.')) {
    return false;
  }
  
  return true;
}

function analyzeFileForUsage(filePath, collections) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const isJsFile = filePath.match(/\.(js|cjs|ts|jsx|tsx)$/);
    const isSqlFile = filePath.endsWith('.sql');
    const isMigrationFile = path.basename(filePath).includes('migration') || 
                           path.basename(filePath).includes('create') || 
                           content.includes('ADD COLUMN');
    
    ALL_COLUMNS.forEach(column => {
      // SELECT queries
      if (findInSelects(content, column)) {
        collections.usedInSelects.add(column);
      }
      
      // UPDATE queries  
      if (findInUpdates(content, column)) {
        collections.usedInUpdates.add(column);
      }
      
      // JavaScript property access (read)
      if (isJsFile && !isMigrationFile && findInJsRead(content, column)) {
        collections.usedInJsRead.add(column);
      }
      
      // JavaScript assignment (write)
      if (isJsFile && !isMigrationFile && findInJsWrite(content, column)) {
        collections.usedInJsWrite.add(column);
      }
      
      // Only in migrations
      if (isMigrationFile && content.includes(column)) {
        collections.onlyInMigrations.add(column);
      }
    });
    
  } catch (error) {
    // Ignorer les erreurs de lecture
  }
}

function findInSelects(content, column) {
  const patterns = [
    new RegExp(`SELECT[^;]*\\b${column}\\b[^;]*FROM\\s+wallet_registry`, 'gi'),
    new RegExp(`SELECT\\s+\\*\\s+FROM\\s+wallet_registry`, 'gi'), // SELECT * compte comme utilisation
    new RegExp(`\\b${column}\\b[^;]*FROM\\s+wallet_registry`, 'gi')
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

function findInUpdates(content, column) {
  const patterns = [
    new RegExp(`UPDATE\\s+wallet_registry\\s+SET[^;]*\\b${column}\\s*=`, 'gi'),
    new RegExp(`\\b${column}\\s*=`, 'gi') // Assignation en UPDATE
  ];
  
  return patterns.some(pattern => pattern.test(content)) && content.includes('wallet_registry');
}

function findInJsRead(content, column) {
  const patterns = [
    new RegExp(`record\\.${column}\\b`, 'g'),
    new RegExp(`data\\.${column}\\b`, 'g'), 
    new RegExp(`row\\.${column}\\b`, 'g'),
    new RegExp(`wallet\\.${column}\\b`, 'g'),
    new RegExp(`\\[\\s*['\"\`]${column}['\"\`]\\s*\\]`, 'g')
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

function findInJsWrite(content, column) {
  const patterns = [
    new RegExp(`${column}\\s*[:=]`, 'g'),
    new RegExp(`['\"\`]${column}['\"\`]\\s*:`, 'g'),
    new RegExp(`\\[\\s*['\"\`]${column}['\"\`]\\s*\\]\\s*=`, 'g')
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

function analyzeByCategory(totallyUnused, readOnly, allUsed) {
  console.log('📂 ANALYSE PAR CATÉGORIE:');
  console.log('=========================\n');
  
  const categories = {
    dune: {name: 'DUNE', prefix: 'dune_'},
    enriched: {name: 'ENRICHED', prefix: 'enriched_'},
    dexscreener: {name: 'DEXSCREENER', prefix: 'dexscreener_'},
    roi: {name: 'ROI', filter: col => col.startsWith('roi_') || col.includes('roi')},
    pnl: {name: 'PNL', filter: col => col.includes('pnl') && !col.startsWith('dune_')},
    timestamps: {name: 'TIMESTAMPS', filter: col => col.includes('timestamp') || col.includes('_at') || col.includes('_date')},
    buy_sell: {name: 'BUY/SELL', filter: col => col.includes('_buy_') || col.includes('_sell_')},
    volume: {name: 'VOLUME', filter: col => col.includes('volume')},
    cap: {name: 'MARKET CAP', filter: col => col.includes('cap_') && !col.includes('scalp')},
    other: {name: 'AUTRES', filter: col => true}
  };
  
  Object.entries(categories).forEach(([key, category]) => {
    const getColumns = category.prefix ? 
      (cols) => cols.filter(col => col.startsWith(category.prefix)) :
      (cols) => cols.filter(category.filter);
    
    // Skip "autres" for now, we'll handle it separately
    if (key === 'other') return;
    
    const unused = getColumns(totallyUnused);
    const readonly = getColumns(readOnly);
    const used = getColumns(Array.from(allUsed));
    const total = unused.length + readonly.length + used.length;
    
    if (total > 0) {
      console.log(`🏷️  ${category.name}:`);
      console.log(`   Total: ${total}`);
      console.log(`   Utilisées: ${used.length}`);
      console.log(`   Lecture seule: ${readonly.length}`);
      console.log(`   Non utilisées: ${unused.length}`);
      
      if (unused.length > 0) {
        console.log(`   ❌ À supprimer: ${unused.slice(0, 5).join(', ')}${unused.length > 5 ? '...' : ''}`);
      }
      console.log('');
    }
  });
}

function generateTargetedDropSQL(columnsToRemove) {
  let sql = '-- Script ciblé pour supprimer les colonnes vraiment non utilisées\n';
  sql += `-- Généré le: ${new Date().toISOString()}\n`;
  sql += `-- Colonnes à supprimer: ${columnsToRemove.length}\n`;
  sql += '-- ⚠️  SAUVEGARDE OBLIGATOIRE avant exécution !\n\n';
  
  sql += '-- ÉTAPE 1: Sauvegarde de sécurité\n';
  sql += 'CREATE TABLE wallet_registry_backup AS SELECT * FROM wallet_registry;\n\n';
  
  sql += '-- ÉTAPE 2: Vérification avant suppression\n';
  sql += 'SELECT \n';
  sql += '  column_name,\n';
  sql += '  data_type,\n';
  sql += '  is_nullable,\n';
  sql += '  column_default\n';
  sql += 'FROM information_schema.columns\n';
  sql += 'WHERE table_name = \'wallet_registry\'\n';
  sql += 'AND column_name IN (\n';
  sql += columnsToRemove.map(col => `  '${col}'`).join(',\n');
  sql += '\n);\n\n';
  
  sql += '-- ÉTAPE 3: Suppression des colonnes\n';
  columnsToRemove.forEach(column => {
    sql += `-- Supprimer ${column}\n`;
    sql += `ALTER TABLE wallet_registry DROP COLUMN IF EXISTS ${column};\n`;
  });
  
  sql += '\n-- ÉTAPE 4: Vérification finale\n';
  sql += 'SELECT COUNT(*) as colonnes_restantes\n';
  sql += 'FROM information_schema.columns\n';
  sql += 'WHERE table_name = \'wallet_registry\';\n\n';
  
  sql += 'SELECT \'Suppression terminée avec succès!\' as statut;\n';
  
  return sql;
}

// Exécution
const results = findActualUsage();

// Sauvegarder les résultats
fs.writeFileSync('targeted-column-analysis.json', JSON.stringify(results, null, 2));
console.log('💾 Analyse sauvegardée: targeted-column-analysis.json\n');

console.log('🎯 RECOMMANDATIONS FINALES:');
console.log('===========================');
console.log('1. Commencez par supprimer les colonnes totalement non utilisées');
console.log('2. Examinez manuellement les colonnes en lecture seule');
console.log('3. Testez après chaque suppression');
console.log('4. Gardez une sauvegarde complète');