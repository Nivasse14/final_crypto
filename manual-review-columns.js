#!/usr/bin/env node

// 🔍 Examen manuel des colonnes en lecture seule
// Détermine lesquelles peuvent être supprimées en toute sécurité

import fs from 'fs';
import path from 'path';

// Colonnes identifiées comme étant en lecture seule
const READ_ONLY_COLUMNS = [
  'dune_mroi',
  'dune_invalids', 
  'pnl_total_volume_24h_usd',
  'pnl_avg_volume_24h_usd',
  'pnl_tokens_with_volume_data',
  'portfolio_total_volume_24h_usd',
  'portfolio_avg_volume_24h_usd',
  'portfolio_tokens_with_volume_data',
  'streak_wins_max_90d',
  'streak_losses_max_90d',
  'roi_50_to_200',
  'roi_0_to_50',
  'roi_total_trades',
  'roi_winning_trades',
  'roi_losing_trades',
  'roi_distribution_last_updated',
  'pnl_data_last_updated'
];

function manualReview() {
  console.log('🔍 EXAMEN MANUEL DES COLONNES EN LECTURE SEULE');
  console.log('==============================================\n');
  
  const recommendations = {
    safeToRemove: [],
    reviewNeeded: [],
    keepForNow: []
  };
  
  // Analyser chaque colonne
  READ_ONLY_COLUMNS.forEach(column => {
    const analysis = analyzeColumn(column);
    
    if (analysis.recommendation === 'REMOVE') {
      recommendations.safeToRemove.push({column, reason: analysis.reason});
    } else if (analysis.recommendation === 'REVIEW') {
      recommendations.reviewNeeded.push({column, reason: analysis.reason});
    } else {
      recommendations.keepForNow.push({column, reason: analysis.reason});
    }
  });
  
  // Affichage des résultats
  console.log('✅ COLONNES SÛRES À SUPPRIMER:');
  console.log('==============================');
  if (recommendations.safeToRemove.length === 0) {
    console.log('   Aucune colonne identifiée comme sûre à supprimer sans review.');
  } else {
    recommendations.safeToRemove.forEach(({column, reason}) => {
      console.log(`   🗑️  ${column}`);
      console.log(`       → ${reason}`);
    });
  }
  console.log('');
  
  console.log('⚠️  COLONNES NÉCESSITANT UNE REVIEW:');
  console.log('====================================');
  recommendations.reviewNeeded.forEach(({column, reason}) => {
    console.log(`   🔍 ${column}`);
    console.log(`      → ${reason}`);
  });
  console.log('');
  
  console.log('📌 COLONNES À CONSERVER POUR L\'INSTANT:');
  console.log('=======================================');
  recommendations.keepForNow.forEach(({column, reason}) => {
    console.log(`   📦 ${column}`);
    console.log(`      → ${reason}`);
  });
  console.log('');
  
  // Recherche de patterns supplémentaires
  const additionalAnalysis = findAdditionalUnusedColumns();
  
  // Générer les scripts SQL
  generateManualReviewSQL(recommendations, additionalAnalysis);
  
  return recommendations;
}

function analyzeColumn(column) {
  // Analyser chaque colonne spécifiquement
  switch(column) {
    case 'dune_mroi':
      return {
        recommendation: 'REVIEW',
        reason: 'Métrique Dune potentiellement obsolète, mais pourrait être utilisée dans des rapports'
      };
      
    case 'dune_invalids':
      return {
        recommendation: 'REVIEW', 
        reason: 'Compteur d\'erreurs Dune - utile pour debugging mais peut être obsolète'
      };
      
    case 'pnl_total_volume_24h_usd':
    case 'pnl_avg_volume_24h_usd':
    case 'pnl_tokens_with_volume_data':
      return {
        recommendation: 'REMOVE',
        reason: 'Métriques de volume PnL - semblent être des données calculées non maintenues'
      };
      
    case 'portfolio_total_volume_24h_usd':
    case 'portfolio_avg_volume_24h_usd': 
    case 'portfolio_tokens_with_volume_data':
      return {
        recommendation: 'REMOVE',
        reason: 'Métriques de volume portfolio - semblent être des données calculées non maintenues'
      };
      
    case 'streak_wins_max_90d':
    case 'streak_losses_max_90d':
      return {
        recommendation: 'REVIEW',
        reason: 'Métriques de streaks - pourraient être utilisées dans des analyses avancées'
      };
      
    case 'roi_50_to_200':
    case 'roi_0_to_50':
    case 'roi_total_trades':
    case 'roi_winning_trades':
    case 'roi_losing_trades':
      return {
        recommendation: 'REMOVE',
        reason: 'Distribution ROI - données calculées qui semblent obsolètes, non mises à jour'
      };
      
    case 'roi_distribution_last_updated':
    case 'pnl_data_last_updated':
      return {
        recommendation: 'KEEP',
        reason: 'Timestamps de mise à jour - utiles pour le debugging et la maintenance'
      };
      
    default:
      return {
        recommendation: 'REVIEW',
        reason: 'Nécessite une analyse manuelle spécifique'
      };
  }
}

function findAdditionalUnusedColumns() {
  console.log('🔍 RECHERCHE DE COLONNES SUPPLÉMENTAIRES POTENTIELLEMENT INUTILES:');
  console.log('===================================================================\n');
  
  // Patterns de colonnes potentiellement obsolètes
  const suspiciousPatterns = [
    { pattern: /^dune_/, description: 'Colonnes Dune - API potentiellement obsolète' },
    { pattern: /.*_url$/, description: 'URLs externes - souvent non maintenues' },
    { pattern: /.*_link$/, description: 'Liens externes - souvent non maintenues' }
  ];
  
  const additionalCandidates = [];
  
  // Lire le fichier d'analyse précédent pour récupérer toutes les colonnes
  let allColumns = [];
  try {
    const analysisData = JSON.parse(fs.readFileSync('targeted-column-analysis.json', 'utf8'));
    allColumns = analysisData.usedInSelects || [];
  } catch (err) {
    console.warn('Impossible de lire l\'analyse précédente');
    return [];
  }
  
  suspiciousPatterns.forEach(({pattern, description}) => {
    const matching = allColumns.filter(col => pattern.test(col));
    if (matching.length > 0) {
      console.log(`📋 ${description}:`);
      matching.forEach(col => {
        console.log(`   ⚠️  ${col}`);
        additionalCandidates.push({
          column: col,
          pattern: pattern.source,
          reason: description
        });
      });
      console.log('');
    }
  });
  
  return additionalCandidates;
}

function generateManualReviewSQL(recommendations, additionalAnalysis) {
  console.log('📝 GÉNÉRATION DES SCRIPTS SQL:');
  console.log('==============================\n');
  
  // Script pour les colonnes sûres à supprimer
  if (recommendations.safeToRemove.length > 0) {
    const safeColumns = recommendations.safeToRemove.map(r => r.column);
    const safeSQL = generateSafeDropSQL(safeColumns);
    fs.writeFileSync('drop-safe-columns.sql', safeSQL);
    console.log(`✅ Script pour colonnes sûres: drop-safe-columns.sql (${safeColumns.length} colonnes)`);
  }
  
  // Script pour les colonnes nécessitant une review
  if (recommendations.reviewNeeded.length > 0) {
    const reviewColumns = recommendations.reviewNeeded.map(r => r.column);
    const reviewSQL = generateReviewSQL(reviewColumns, recommendations.reviewNeeded);
    fs.writeFileSync('drop-review-columns.sql', reviewSQL);
    console.log(`⚠️  Script pour review: drop-review-columns.sql (${reviewColumns.length} colonnes)`);
  }
  
  // Script d'analyse des données
  const analysisSQL = generateDataAnalysisSQL(recommendations);
  fs.writeFileSync('analyze-column-data.sql', analysisSQL);
  console.log(`🔍 Script d'analyse des données: analyze-column-data.sql`);
  
  console.log('\n📋 INSTRUCTIONS:');
  console.log('================');
  console.log('1. Exécutez d\'abord analyze-column-data.sql pour voir les données');
  console.log('2. Si les données sont vides/obsolètes, utilisez drop-safe-columns.sql');
  console.log('3. Examinez manuellement drop-review-columns.sql avant exécution');
  console.log('4. Testez après chaque suppression');
}

function generateSafeDropSQL(columns) {
  let sql = '-- Script pour supprimer les colonnes identifiées comme sûres\n';
  sql += `-- Date: ${new Date().toISOString()}\n`;
  sql += `-- Colonnes: ${columns.length}\n`;
  sql += '-- ⚠️  SAUVEGARDE OBLIGATOIRE !\n\n';
  
  sql += '-- ÉTAPE 1: Sauvegarde\n';
  sql += 'CREATE TABLE wallet_registry_safe_backup AS SELECT * FROM wallet_registry;\n\n';
  
  sql += '-- ÉTAPE 2: Suppression des colonnes sûres\n';
  columns.forEach(column => {
    sql += `-- ${column} - Métrique de volume/ROI obsolète\n`;
    sql += `ALTER TABLE wallet_registry DROP COLUMN IF EXISTS ${column};\n`;
  });
  
  sql += '\n-- ÉTAPE 3: Vérification\n';
  sql += 'SELECT COUNT(*) as colonnes_restantes FROM information_schema.columns WHERE table_name = \'wallet_registry\';\n';
  
  return sql;
}

function generateReviewSQL(columns, details) {
  let sql = '-- Script pour supprimer les colonnes nécessitant une review\n';
  sql += '-- ⚠️⚠️⚠️ ATTENTION: REVIEW MANUELLE REQUISE AVANT EXÉCUTION !\n';
  sql += `-- Date: ${new Date().toISOString()}\n\n`;
  
  sql += '-- ÉTAPE 1: Examiner les données existantes\n';
  columns.forEach(column => {
    const detail = details.find(d => d.column === column);
    sql += `-- ${column}: ${detail?.reason || 'Review nécessaire'}\n`;
    sql += `SELECT '${column}' as colonne, COUNT(*) as total_rows, COUNT(${column}) as non_null_rows, `;
    sql += `COUNT(DISTINCT ${column}) as distinct_values FROM wallet_registry;\n`;
  });
  
  sql += '\n-- ÉTAPE 2: Si les données sont obsolètes, décommentez les lignes suivantes\n';
  columns.forEach(column => {
    sql += `-- ALTER TABLE wallet_registry DROP COLUMN IF EXISTS ${column};\n`;
  });
  
  return sql;
}

function generateDataAnalysisSQL(recommendations) {
  const allColumns = [
    ...recommendations.safeToRemove.map(r => r.column),
    ...recommendations.reviewNeeded.map(r => r.column)
  ];
  
  let sql = '-- Script d\'analyse des données pour les colonnes candidates à la suppression\n';
  sql += `-- Date: ${new Date().toISOString()}\n\n`;
  
  sql += '-- Vue d\'ensemble des données\n';
  sql += 'SELECT COUNT(*) as total_wallets FROM wallet_registry;\n\n';
  
  sql += '-- Analyse de chaque colonne candidate\n';
  allColumns.forEach(column => {
    sql += `-- ${column}\n`;
    sql += `SELECT \n`;
    sql += `  '${column}' as colonne,\n`;
    sql += `  COUNT(*) as total_rows,\n`;
    sql += `  COUNT(${column}) as non_null_count,\n`;
    sql += `  COUNT(DISTINCT ${column}) as distinct_values,\n`;
    sql += `  ROUND(COUNT(${column})::numeric / COUNT(*) * 100, 2) as fill_percentage\n`;
    sql += `FROM wallet_registry;\n\n`;
  });
  
  sql += '-- Dernière activité sur ces colonnes\n';
  sql += 'SELECT \n';
  sql += '  MAX(updated_at) as derniere_mise_a_jour,\n';
  sql += '  COUNT(*) as wallets_avec_donnees\n';
  sql += 'FROM wallet_registry \n';
  sql += 'WHERE (\n';
  sql += allColumns.map(col => `  ${col} IS NOT NULL`).join(' OR\n');
  sql += '\n);\n';
  
  return sql;
}

// Exécution
const results = manualReview();

// Sauvegarder les résultats
const output = {
  timestamp: new Date().toISOString(),
  readOnlyColumns: READ_ONLY_COLUMNS,
  recommendations: results,
  summary: {
    safeToRemove: results.safeToRemove.length,
    reviewNeeded: results.reviewNeeded.length,
    keepForNow: results.keepForNow.length
  }
};

fs.writeFileSync('manual-review-results.json', JSON.stringify(output, null, 2));
console.log('\n💾 Résultats de la review sauvegardés: manual-review-results.json');