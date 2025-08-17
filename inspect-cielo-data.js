#!/usr/bin/env node

// 🔍 Script d'inspection des données Cielo
// Pour comprendre la structure exacte des données retournées

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

const TEST_WALLET = "ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB";

console.log('🔍 INSPECTION DES DONNÉES CIELO');
console.log('==============================');

function inspectObject(obj, prefix = '', maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    console.log(`${prefix}... (max depth reached)`);
    return;
  }
  
  if (obj === null || obj === undefined) {
    console.log(`${prefix}${obj}`);
    return;
  }
  
  if (typeof obj !== 'object') {
    console.log(`${prefix}${obj} (${typeof obj})`);
    return;
  }
  
  if (Array.isArray(obj)) {
    console.log(`${prefix}Array[${obj.length}]`);
    if (obj.length > 0 && currentDepth < maxDepth - 1) {
      inspectObject(obj[0], `${prefix}  [0] `, maxDepth, currentDepth + 1);
      if (obj.length > 1) {
        console.log(`${prefix}  ... and ${obj.length - 1} more items`);
      }
    }
    return;
  }
  
  const keys = Object.keys(obj);
  console.log(`${prefix}Object{${keys.length} keys}`);
  
  keys.forEach(key => {
    const value = obj[key];
    console.log(`${prefix}  ${key}:`);
    inspectObject(value, `${prefix}    `, maxDepth, currentDepth + 1);
  });
}

async function inspectCieloData() {
  try {
    console.log(`📡 Récupération des données pour ${TEST_WALLET}...`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cielo-api/complete/${TEST_WALLET}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Données récupérées avec succès\n');
    console.log('📊 STRUCTURE COMPLÈTE DES DONNÉES:');
    console.log('=====================================');
    
    inspectObject(data, '', 4);
    
    // Inspection spéciale de extracted_data s'il existe
    if (data.data && data.data.extracted_data) {
      console.log('\n🎯 FOCUS SUR EXTRACTED_DATA:');
      console.log('============================');
      const extracted = data.data.extracted_data;
      Object.keys(extracted).forEach(key => {
        const value = extracted[key];
        console.log(`${key}: ${value} (${typeof value})`);
      });
    }
    
    // Inspection de main_data
    if (data.data && data.data.main_data) {
      console.log('\n📋 FOCUS SUR MAIN_DATA:');
      console.log('=======================');
      inspectObject(data.data.main_data, '', 3);
    }
    
    // Inspection de pnl_data
    if (data.data && data.data.pnl_data) {
      console.log('\n💰 FOCUS SUR PNL_DATA:');
      console.log('======================');
      inspectObject(data.data.pnl_data, '', 3);
    }
    
    // Chercher des métriques potentielles dans toute la structure
    console.log('\n🔎 RECHERCHE DE MÉTRIQUES:');
    console.log('==========================');
    
    const metricsToFind = [
      'holding_time', 'holdingTime', 'average_holding',
      'pnl', 'total_pnl', 'totalPnl',
      'winrate', 'win_rate', 'winRate',
      'roi', 'roi_percentage', 'total_roi',
      'swap', 'swaps', 'swap_count',
      'timestamp', 'first_swap', 'last_swap',
      'trading_days', 'unique_trading', 'consecutive',
      'trades_per_token', 'average_trades'
    ];
    
    function searchMetrics(obj, path = '') {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;
        
        // Vérifier si cette clé correspond à une métrique recherchée
        const matchingMetric = metricsToFind.find(metric => 
          lowerKey.includes(metric) || metric.includes(lowerKey)
        );
        
        if (matchingMetric) {
          console.log(`  ✓ ${currentPath}: ${value} (${typeof value}) [match: ${matchingMetric}]`);
        }
        
        // Recherche récursive
        if (typeof value === 'object' && value !== null && path.split('.').length < 4) {
          searchMetrics(value, currentPath);
        }
      });
    }
    
    searchMetrics(data);
    
    console.log('\n📝 RECOMMANDATIONS:');
    console.log('===================');
    console.log('1. Vérifiez les chemins d\'accès exacts aux métriques');
    console.log('2. Adaptez le script d\'enrichissement selon la structure réelle');
    console.log('3. Testez les mappings avec les nouvelles clés trouvées');
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

inspectCieloData();
