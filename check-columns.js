#!/usr/bin/env node

// 🔍 Vérification des colonnes existantes dans wallet_registry
// Ce script vérifie quelles colonnes d'achat/vente existent déjà

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🔍 VÉRIFICATION COLONNES WALLET_REGISTRY');
console.log('=======================================');

async function checkExistingColumns() {
  try {
    console.log('📋 Récupération de la structure de la table...');
    
    // Récupérer toutes les colonnes de wallet_registry
    const response = await fetch(`${SUPABASE_URL}/rest/v1/information_schema.columns?select=column_name,data_type,is_nullable&table_name=eq.wallet_registry&order=column_name`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    const allColumns = await response.json();
    console.log(`✅ ${allColumns.length} colonnes trouvées au total\n`);
    
    // Colonnes à vérifier
    const targetColumns = [
      'average_buy_amount_usd', 'minimum_buy_amount_usd', 'maximum_buy_amount_usd',
      'total_buy_amount_usd', 'total_buy_count',
      'average_sell_amount_usd', 'minimum_sell_amount_usd', 'maximum_sell_amount_usd',
      'total_sell_amount_usd', 'total_sell_count'
    ];
    
    console.log('🎯 VÉRIFICATION DES COLONNES CIBLES:');
    console.log('===================================');
    
    const existingColumns = [];
    const missingColumns = [];
    
    targetColumns.forEach(targetCol => {
      const found = allColumns.find(col => col.column_name === targetCol);
      if (found) {
        existingColumns.push(targetCol);
        console.log(`✅ ${targetCol} (${found.data_type})`);
      } else {
        missingColumns.push(targetCol);
        console.log(`❌ ${targetCol} - MANQUANTE`);
      }
    });
    
    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`├── Colonnes existantes: ${existingColumns.length}/${targetColumns.length}`);
    console.log(`├── Colonnes manquantes: ${missingColumns.length}/${targetColumns.length}`);
    console.log(`└── Status: ${missingColumns.length === 0 ? '✅ TOUTES PRÉSENTES' : '⚠️ MIGRATION REQUISE'}`);
    
    if (missingColumns.length > 0) {
      console.log(`\n🔧 COLONNES À AJOUTER:`);
      missingColumns.forEach(col => {
        console.log(`   ${col}`);
      });
      
      console.log(`\n📋 ACTION REQUISE:`);
      console.log(`   1. Ouvrir le SQL Editor de Supabase`);
      console.log(`   2. Exécuter le contenu de migration-add-buy-sell-metrics.sql`);
      console.log(`   3. Relancer ce script pour vérifier`);
    } else {
      console.log(`\n🚀 PRÊT POUR L'ENRICHISSEMENT:`);
      console.log(`   node enrich-cielo-metrics.js test ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB`);
    }
    
    // Affichage de toutes les colonnes pour référence
    console.log(`\n📋 TOUTES LES COLONNES WALLET_REGISTRY:`);
    console.log('=====================================');
    
    const groupedColumns = {
      base: [],
      cielo: [],
      achat_vente: [],
      autres: []
    };
    
    allColumns.forEach(col => {
      const name = col.column_name;
      if (['wallet_address', 'created_at', 'updated_at', 'id'].includes(name)) {
        groupedColumns.base.push(name);
      } else if (name.includes('buy') || name.includes('sell')) {
        groupedColumns.achat_vente.push(name);
      } else if (['total_pnl', 'winrate', 'swap_count', 'average_holding_time'].includes(name)) {
        groupedColumns.cielo.push(name);
      } else {
        groupedColumns.autres.push(name);
      }
    });
    
    console.log(`📂 Base (${groupedColumns.base.length}): ${groupedColumns.base.join(', ')}`);
    console.log(`📂 Cielo (${groupedColumns.cielo.length}): ${groupedColumns.cielo.join(', ')}`);
    console.log(`📂 Achat/Vente (${groupedColumns.achat_vente.length}): ${groupedColumns.achat_vente.join(', ')}`);
    console.log(`📂 Autres (${groupedColumns.autres.length}): ${groupedColumns.autres.slice(0, 10).join(', ')}${groupedColumns.autres.length > 10 ? '...' : ''}`);
    
    return {
      total: allColumns.length,
      existing: existingColumns.length,
      missing: missingColumns.length,
      needsMigration: missingColumns.length > 0
    };
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return { error: error.message };
  }
}

// Fonction principale
async function main() {
  await checkExistingColumns();
}

// Exécution
main().catch(console.error);
