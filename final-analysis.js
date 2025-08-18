#!/usr/bin/env node

// 🎯 ANALYSE FINALE ET RECOMMANDATIONS
// Synthèse complète des colonnes non utilisées dans wallet_registry

import fs from 'fs';

function generateFinalRecommendations() {
  console.log('🎯 ANALYSE FINALE - COLONNES NON UTILISÉES WALLET_REGISTRY');
  console.log('=========================================================\n');
  
  // Catégories de colonnes identifiées
  const analysis = {
    // Colonnes SÛRES à supprimer (11 colonnes)
    safeToRemove: [
      {
        category: 'Volume Metrics (PnL)',
        columns: [
          'pnl_total_volume_24h_usd',
          'pnl_avg_volume_24h_usd', 
          'pnl_tokens_with_volume_data'
        ],
        reason: 'Métriques de volume calculées non maintenues, uniquement en lecture'
      },
      {
        category: 'Volume Metrics (Portfolio)',
        columns: [
          'portfolio_total_volume_24h_usd',
          'portfolio_avg_volume_24h_usd',
          'portfolio_tokens_with_volume_data'
        ],
        reason: 'Métriques de volume portfolio calculées non maintenues, uniquement en lecture'
      },
      {
        category: 'ROI Distribution',
        columns: [
          'roi_50_to_200',
          'roi_0_to_50', 
          'roi_total_trades',
          'roi_winning_trades',
          'roi_losing_trades'
        ],
        reason: 'Distribution ROI calculées obsolètes, jamais mises à jour'
      }
    ],
    
    // Colonnes À REVIEW (4 colonnes)
    reviewNeeded: [
      {
        category: 'Dune Legacy',
        columns: ['dune_mroi', 'dune_invalids'],
        reason: 'Anciennes métriques Dune, potentiellement obsolètes mais à vérifier'
      },
      {
        category: 'Advanced Analytics',
        columns: ['streak_wins_max_90d', 'streak_losses_max_90d'],
        reason: 'Métriques avancées qui pourraient être utilisées dans des analyses futures'
      }
    ],
    
    // Colonnes POTENTIELLEMENT obsolètes (nécessitent investigation)
    potentiallyObsolete: [
      {
        category: 'Dune API Legacy',
        columns: [
          'dune_wallet_pnl', 'dune_total_bought_usd', 'dune_total_pnl_usd', 
          'dune_roi', 'dune_tokens', 'dune_nosells', 'dune_losses', 'dune_nulls', 
          'dune_wins', 'dune_winrate', 'dune_w2x', 'dune_w10x', 'dune_w100x', 
          'dune_scalps', 'dune_scalp_ratio', 'dune_bal', 'dune_bal_ratio', 
          'dune_last_trade', 'dune_trade_days'
        ],
        reason: 'API Dune potentiellement obsolète - vérifier si encore utilisée'
      },
      {
        category: 'External URLs',
        columns: ['solscan_url', 'gmgn_url', 'cielo_url', 'wallet_pnl_link'],
        reason: 'URLs externes souvent non maintenues, peuvent être reconstruites dynamiquement'
      }
    ]
  };
  
  // Affichage des résultats
  displayAnalysis(analysis);
  
  // Génération des scripts SQL
  generateFinalSQL(analysis);
  
  return analysis;
}

function displayAnalysis(analysis) {
  console.log('✅ COLONNES SÛRES À SUPPRIMER (11 colonnes):');
  console.log('============================================');
  analysis.safeToRemove.forEach(group => {
    console.log(`\n📦 ${group.category}:`);
    group.columns.forEach(col => {
      console.log(`   🗑️  ${col}`);
    });
    console.log(`   → ${group.reason}`);
  });
  
  const totalSafe = analysis.safeToRemove.reduce((sum, group) => sum + group.columns.length, 0);
  console.log(`\n📊 Total colonnes sûres: ${totalSafe} colonnes`);
  
  console.log('\n⚠️  COLONNES À EXAMINER (4 colonnes):');
  console.log('====================================');
  analysis.reviewNeeded.forEach(group => {
    console.log(`\n📋 ${group.category}:`);
    group.columns.forEach(col => {
      console.log(`   🔍 ${col}`);
    });
    console.log(`   → ${group.reason}`);
  });
  
  console.log('\n🤔 COLONNES POTENTIELLEMENT OBSOLÈTES:');
  console.log('======================================');
  analysis.potentiallyObsolete.forEach(group => {
    console.log(`\n📂 ${group.category} (${group.columns.length} colonnes):`);
    console.log(`   ${group.columns.slice(0, 5).join(', ')}${group.columns.length > 5 ? '...' : ''}`);
    console.log(`   → ${group.reason}`);
  });
}

function generateFinalSQL(analysis) {
  console.log('\n📝 GÉNÉRATION DES SCRIPTS SQL FINAUX:');
  console.log('====================================\n');
  
  // 1. Script pour colonnes sûres
  const safeColumns = analysis.safeToRemove.flatMap(group => group.columns);
  const safeSQL = generateSafeRemovalSQL(safeColumns);
  fs.writeFileSync('FINAL-drop-safe-columns.sql', safeSQL);
  console.log(`✅ Script sûr généré: FINAL-drop-safe-columns.sql (${safeColumns.length} colonnes)`);
  
  // 2. Script pour examiner les données
  const examineSQL = generateExaminationSQL(analysis);
  fs.writeFileSync('FINAL-examine-data.sql', examineSQL);
  console.log(`🔍 Script d'examen: FINAL-examine-data.sql`);
  
  // 3. Script pour colonnes nécessitant review
  const reviewColumns = analysis.reviewNeeded.flatMap(group => group.columns);
  const reviewSQL = generateReviewRemovalSQL(reviewColumns);
  fs.writeFileSync('FINAL-drop-review-columns.sql', reviewSQL);
  console.log(`⚠️  Script review: FINAL-drop-review-columns.sql (${reviewColumns.length} colonnes)`);
  
  // 4. Script pour investigation Dune/URLs
  const investigateSQL = generateInvestigationSQL(analysis.potentiallyObsolete);
  fs.writeFileSync('FINAL-investigate-columns.sql', investigateSQL);
  console.log(`🕵️  Script investigation: FINAL-investigate-columns.sql`);
  
  console.log('\n📋 PLAN D\'EXÉCUTION RECOMMANDÉ:');
  console.log('===============================');
  console.log('1. Exécuter FINAL-examine-data.sql pour voir les données');
  console.log('2. Si les données semblent vides/obsolètes, exécuter FINAL-drop-safe-columns.sql');
  console.log('3. Examiner FINAL-investigate-columns.sql pour les colonnes Dune/URLs');
  console.log('4. Après review manuelle, utiliser FINAL-drop-review-columns.sql si nécessaire');
  console.log('5. Tester l\'application après chaque suppression');
}

function generateSafeRemovalSQL(columns) {
  let sql = '-- 🗑️  SUPPRESSION SÛRE - Colonnes non utilisées identifiées\n';
  sql += '-- ===================================================\n';
  sql += `-- Date: ${new Date().toISOString()}\n`;
  sql += `-- Colonnes à supprimer: ${columns.length}\n`;
  sql += '-- ⚠️  SAUVEGARDE OBLIGATOIRE avant exécution !\n\n';
  
  sql += '-- ÉTAPE 1: Sauvegarde de sécurité\n';
  sql += 'CREATE TABLE wallet_registry_backup_' + new Date().toISOString().slice(0,10).replace(/-/g, '') + ' AS \n';
  sql += 'SELECT * FROM wallet_registry;\n\n';
  
  sql += '-- ÉTAPE 2: Vérification des colonnes avant suppression\n';
  sql += 'SELECT \n';
  sql += '  COUNT(*) as total_rows,\n';
  sql += '  COUNT(*) FILTER (WHERE ' + columns.map(col => `${col} IS NOT NULL`).join(' OR ') + ') as rows_with_data\n';
  sql += 'FROM wallet_registry;\n\n';
  
  sql += '-- ÉTAPE 3: Suppression des colonnes sûres\n';
  sql += '-- (Colonnes uniquement en lecture, jamais mises à jour)\n\n';
  
  // Grouper par catégorie
  const volumePnl = columns.filter(col => col.startsWith('pnl_') && col.includes('volume'));
  const volumePortfolio = columns.filter(col => col.startsWith('portfolio_') && col.includes('volume'));
  const roiDistrib = columns.filter(col => col.startsWith('roi_') && !col.includes('percentage') && !col.includes('pct'));
  
  if (volumePnl.length > 0) {
    sql += '-- Volume metrics PnL (non maintenues)\n';
    volumePnl.forEach(col => {
      sql += `ALTER TABLE wallet_registry DROP COLUMN IF EXISTS ${col};\n`;
    });
    sql += '\n';
  }
  
  if (volumePortfolio.length > 0) {
    sql += '-- Volume metrics Portfolio (non maintenues)\n';
    volumePortfolio.forEach(col => {
      sql += `ALTER TABLE wallet_registry DROP COLUMN IF EXISTS ${col};\n`;
    });
    sql += '\n';
  }
  
  if (roiDistrib.length > 0) {
    sql += '-- ROI Distribution (obsolètes)\n';
    roiDistrib.forEach(col => {
      sql += `ALTER TABLE wallet_registry DROP COLUMN IF EXISTS ${col};\n`;
    });
    sql += '\n';
  }
  
  sql += '-- ÉTAPE 4: Vérification post-suppression\n';
  sql += 'SELECT \n';
  sql += '  table_name,\n';
  sql += '  COUNT(*) as colonnes_restantes\n';
  sql += 'FROM information_schema.columns \n';
  sql += 'WHERE table_name = \'wallet_registry\' \n';
  sql += 'GROUP BY table_name;\n\n';
  
  sql += 'SELECT \'✅ Suppression des colonnes sûres terminée!\' as status;\n';
  
  return sql;
}

function generateExaminationSQL(analysis) {
  const allColumns = [
    ...analysis.safeToRemove.flatMap(group => group.columns),
    ...analysis.reviewNeeded.flatMap(group => group.columns)
  ];
  
  let sql = '-- 🔍 EXAMEN DES DONNÉES - Colonnes candidates à la suppression\n';
  sql += '-- ========================================================\n';
  sql += `-- Date: ${new Date().toISOString()}\n\n`;
  
  sql += '-- Vue d\'ensemble générale\n';
  sql += 'SELECT \n';
  sql += '  COUNT(*) as total_wallets,\n';
  sql += '  MAX(updated_at) as derniere_mise_a_jour,\n';
  sql += '  MIN(created_at) as premiere_creation\n';
  sql += 'FROM wallet_registry;\n\n';
  
  sql += '-- Analyse détaillée par colonne\n';
  allColumns.forEach(column => {
    sql += `-- ${column}\n`;
    sql += `SELECT \n`;
    sql += `  '${column}' as colonne,\n`;
    sql += `  COUNT(*) as total_rows,\n`;
    sql += `  COUNT(${column}) as non_null,\n`;
    sql += `  COUNT(DISTINCT ${column}) as valeurs_distinctes,\n`;
    sql += `  ROUND(COUNT(${column})::numeric / COUNT(*) * 100, 1) as pourcentage_rempli\n`;
    sql += `FROM wallet_registry;\n\n`;
  });
  
  sql += '-- Résumé global des colonnes candidates\n';
  sql += 'SELECT \n';
  sql += '  \'Colonnes candidates\' as type,\n';
  sql += '  COUNT(*) as wallets_avec_donnees\n';
  sql += 'FROM wallet_registry \n';
  sql += 'WHERE (\n';
  sql += allColumns.map(col => `  ${col} IS NOT NULL`).join(' OR\n');
  sql += '\n);\n';
  
  return sql;
}

function generateReviewRemovalSQL(columns) {
  let sql = '-- ⚠️  SUPPRESSION APRÈS REVIEW - Colonnes à examiner manuellement\n';
  sql += '-- =============================================================\n';
  sql += '-- ⚠️⚠️⚠️ ATTENTION: REVIEW MANUELLE OBLIGATOIRE !\n';
  sql += `-- Date: ${new Date().toISOString()}\n\n`;
  
  sql += '-- ÉTAPE 1: Examiner les données de ces colonnes\n';
  columns.forEach(col => {
    sql += `SELECT '${col}' as colonne, COUNT(*) as total, COUNT(${col}) as rempli, `;
    sql += `COUNT(DISTINCT ${col}) as distincts FROM wallet_registry;\n`;
  });
  
  sql += '\n-- ÉTAPE 2: Si les données sont obsolètes, décommentez ci-dessous\n\n';
  
  sql += '-- Sauvegarder avant suppression\n';
  sql += '-- CREATE TABLE wallet_registry_review_backup AS SELECT * FROM wallet_registry;\n\n';
  
  sql += '-- Supprimer les colonnes (décommentez si nécessaire)\n';
  columns.forEach(col => {
    sql += `-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS ${col};\n`;
  });
  
  return sql;
}

function generateInvestigationSQL(potentiallyObsolete) {
  let sql = '-- 🕵️  INVESTIGATION - Colonnes potentiellement obsolètes\n';
  sql += '-- =====================================================\n';
  sql += `-- Date: ${new Date().toISOString()}\n\n`;
  
  potentiallyObsolete.forEach(group => {
    sql += `-- ${group.category}\n`;
    sql += '-- ' + '='.repeat(group.category.length) + '\n\n';
    
    if (group.category.includes('Dune')) {
      sql += '-- Vérifier si les données Dune sont encore mises à jour\n';
      sql += 'SELECT \n';
      sql += '  COUNT(*) as total_wallets,\n';
      sql += '  COUNT(*) FILTER (WHERE ' + group.columns.slice(0,5).map(col => `${col} IS NOT NULL`).join(' OR ') + ') as with_dune_data,\n';
      sql += '  MAX(updated_at) as last_update\n';
      sql += 'FROM wallet_registry;\n\n';
      
      sql += '-- Échantillon de données Dune\n';
      sql += 'SELECT \n';
      sql += '  wallet_address,\n';
      sql += '  ' + group.columns.slice(0,5).join(',\n  ') + '\n';
      sql += 'FROM wallet_registry \n';
      sql += 'WHERE ' + group.columns.slice(0,5).map(col => `${col} IS NOT NULL`).join(' OR ') + '\n';
      sql += 'LIMIT 5;\n\n';
      
    } else if (group.category.includes('URL')) {
      sql += '-- Vérifier les URLs externes\n';
      sql += 'SELECT \n';
      sql += '  COUNT(*) as total_wallets,\n';
      sql += group.columns.map(col => `  COUNT(${col}) as ${col}_count`).join(',\n') + '\n';
      sql += 'FROM wallet_registry;\n\n';
      
      sql += '-- Note: Les URLs peuvent souvent être reconstruites dynamiquement\n';
      sql += '-- Exemple: https://solscan.io/account/{wallet_address}\n\n';
    }
  });
  
  sql += '-- RECOMMANDATIONS:\n';
  sql += '-- 1. Si les données Dune ne sont plus mises à jour → Supprimer\n';
  sql += '-- 2. Si les URLs peuvent être reconstruites → Supprimer\n';
  sql += '-- 3. Tester l\'application après chaque changement\n';
  
  return sql;
}

// Exécution principale
const finalAnalysis = generateFinalRecommendations();

// Sauvegarder le rapport final
const finalReport = {
  timestamp: new Date().toISOString(),
  summary: {
    safeToRemove: finalAnalysis.safeToRemove.reduce((sum, group) => sum + group.columns.length, 0),
    reviewNeeded: finalAnalysis.reviewNeeded.reduce((sum, group) => sum + group.columns.length, 0),
    potentiallyObsolete: finalAnalysis.potentiallyObsolete.reduce((sum, group) => sum + group.columns.length, 0),
    totalCandidates: finalAnalysis.safeToRemove.reduce((sum, group) => sum + group.columns.length, 0) +
                    finalAnalysis.reviewNeeded.reduce((sum, group) => sum + group.columns.length, 0)
  },
  analysis: finalAnalysis,
  recommendations: [
    'Commencer par les 11 colonnes sûres à supprimer',
    'Examiner les 4 colonnes nécessitant une review',
    'Investiguer les colonnes Dune si l\'API n\'est plus utilisée',
    'Considérer la suppression des URLs externes si elles peuvent être reconstruites',
    'Tester après chaque suppression',
    'Garder une sauvegarde complète'
  ]
};

fs.writeFileSync('FINAL-column-analysis-report.json', JSON.stringify(finalReport, null, 2));
console.log('\n💾 Rapport final sauvegardé: FINAL-column-analysis-report.json');

console.log('\n🎯 RÉSUMÉ EXÉCUTIF:');
console.log('==================');
console.log(`📊 ${finalReport.summary.totalCandidates} colonnes peuvent être supprimées au total`);
console.log(`✅ ${finalReport.summary.safeToRemove} colonnes sont sûres à supprimer immédiatement`);
console.log(`⚠️  ${finalReport.summary.reviewNeeded} colonnes nécessitent une review manuelle`);
console.log(`🔍 ${finalReport.summary.potentiallyObsolete} colonnes supplémentaires à investiguer`);

export default finalAnalysis;