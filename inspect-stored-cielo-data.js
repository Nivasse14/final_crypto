#!/usr/bin/env node

// 🔍 Inspection des données Cielo stockées pour comprendre la structure

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🔍 INSPECTION DONNÉES STOCKÉES');
console.log('==============================');

async function inspectStoredData(walletAddress) {
  try {
    console.log(`📋 Récupération des données stockées pour ${walletAddress}...`);
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/wallet_registry?select=wallet_address,cielo_complete_data&wallet_address=eq.${walletAddress}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const wallets = await response.json();
    
    if (wallets.length === 0) {
      console.log(`❌ Wallet ${walletAddress} non trouvé`);
      return;
    }

    const wallet = wallets[0];
    const data = wallet.cielo_complete_data;
    
    console.log(`✅ Données trouvées pour ${walletAddress}`);
    console.log(`📊 Type: ${typeof data}`);
    
    if (data) {
      console.log(`\n📋 STRUCTURE DES DONNÉES STOCKÉES:`);
      console.log(`================================`);
      
      // Afficher les clés du premier niveau
      const keys = Object.keys(data);
      console.log(`🔑 Clés principales (${keys.length}): ${keys.join(', ')}`);
      
      // Explorer chaque clé
      keys.forEach(key => {
        const value = data[key];
        console.log(`\n📂 ${key}:`);
        console.log(`   Type: ${typeof value}`);
        
        if (Array.isArray(value)) {
          console.log(`   Array de ${value.length} éléments`);
          if (value.length > 0) {
            console.log(`   Premier élément type: ${typeof value[0]}`);
            if (typeof value[0] === 'object') {
              console.log(`   Premier élément clés: ${Object.keys(value[0]).join(', ')}`);
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          const subKeys = Object.keys(value);
          console.log(`   Objet avec ${subKeys.length} propriétés: ${subKeys.slice(0, 5).join(', ')}${subKeys.length > 5 ? '...' : ''}`);
        } else {
          console.log(`   Valeur: ${value}`);
        }
      });
      
      // Chercher spécifiquement les métriques d'achat/vente
      console.log(`\n🎯 RECHERCHE MÉTRIQUES SPÉCIFIQUES:`);
      console.log(`==================================`);
      
      const metricsToFind = [
        'average_buy_amount_usd', 'total_buy_count', 'total_tokens_traded',
        'total_pnl_usd', 'winrate', 'tokens'
      ];
      
      function searchInObject(obj, path = '') {
        const results = [];
        
        if (typeof obj === 'object' && obj !== null) {
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              results.push(...searchInObject(item, `${path}[${index}]`));
            });
          } else {
            Object.keys(obj).forEach(key => {
              const newPath = path ? `${path}.${key}` : key;
              
              if (metricsToFind.includes(key)) {
                results.push({ path: newPath, key, value: obj[key] });
              }
              
              results.push(...searchInObject(obj[key], newPath));
            });
          }
        }
        
        return results;
      }
      
      const foundMetrics = searchInObject(data);
      
      if (foundMetrics.length > 0) {
        console.log(`✅ Métriques trouvées:`);
        foundMetrics.forEach(metric => {
          console.log(`   ${metric.key}: ${metric.value} (à: ${metric.path})`);
        });
      } else {
        console.log(`❌ Aucune métrique trouvée`);
      }
      
      // Afficher un extrait des données pour debug
      console.log(`\n📄 EXTRAIT DES DONNÉES (premiers 2000 caractères):`);
      console.log('=================================================');
      console.log(JSON.stringify(data, null, 2).substring(0, 2000) + '...');
      
    } else {
      console.log(`❌ Pas de données cielo_complete_data`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

// Fonction principale
async function main() {
  const walletAddress = process.argv[2] || '7FWe2NBekGSALpnHWj1yka8sHdpnFtrGHdA8feRGpYoQ';
  await inspectStoredData(walletAddress);
}

main().catch(console.error);
