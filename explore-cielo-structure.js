#!/usr/bin/env node

// 🔍 Explorateur complet de la structure JSON de l'API Cielo
// Pour trouver où se trouvent les métriques d'achat/vente

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🔍 EXPLORATEUR STRUCTURE CIELO API');
console.log('=================================');

// Fonction récursive pour chercher une clé dans un objet
function findKeyInObject(obj, targetKey, path = '') {
  const results = [];
  
  function search(current, currentPath) {
    if (current === null || current === undefined) return;
    
    if (typeof current === 'object') {
      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          search(item, `${currentPath}[${index}]`);
        });
      } else {
        Object.keys(current).forEach(key => {
          const newPath = currentPath ? `${currentPath}.${key}` : key;
          
          if (key === targetKey) {
            results.push({
              path: newPath,
              value: current[key]
            });
          }
          
          search(current[key], newPath);
        });
      }
    }
  }
  
  search(obj, path);
  return results;
}

async function exploreStructure(walletAddress) {
  try {
    console.log(`🌐 Récupération des données pour ${walletAddress}...`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cielo-api/complete/${walletAddress}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API returned error: ${data.error || 'Unknown error'}`);
    }

    console.log(`✅ Données récupérées avec succès\n`);
    
    // Chercher toutes les métriques d'achat/vente
    const metricsToFind = [
      'average_buy_amount_usd',
      'minimum_buy_amount_usd', 
      'maximum_buy_amount_usd',
      'total_buy_amount_usd',
      'total_buy_count',
      'average_sell_amount_usd',
      'minimum_sell_amount_usd',
      'maximum_sell_amount_usd', 
      'total_sell_amount_usd',
      'total_sell_count'
    ];
    
    console.log(`🎯 RECHERCHE DES MÉTRIQUES CIBLES:`);
    
    metricsToFind.forEach(metric => {
      console.log(`\n📍 Recherche de "${metric}":`);
      const results = findKeyInObject(data, metric);
      
      if (results.length > 0) {
        results.forEach((result, index) => {
          console.log(`   ${index + 1}. Trouvé à: ${result.path}`);
          console.log(`      Valeur: ${result.value}`);
        });
      } else {
        console.log(`   ❌ Non trouvé`);
      }
    });
    
    // Explorer la structure principale
    console.log(`\n📋 STRUCTURE PRINCIPALE:`);
    console.log(`├── success: ${data.success}`);
    console.log(`├── wallet_address: ${data.wallet_address}`);
    console.log(`├── data: ${data.data ? 'Présent' : 'Absent'}`);
    
    if (data.data) {
      console.log(`│   ├── wallet_address: ${data.data.wallet_address}`);
      console.log(`│   ├── timestamp: ${data.data.timestamp}`);
      console.log(`│   ├── data_source: ${data.data.data_source}`);
      console.log(`│   ├── main_data: ${Array.isArray(data.data.main_data) ? `Array[${data.data.main_data.length}]` : 'Non array'}`);
      console.log(`│   ├── extracted_data: ${data.data.extracted_data ? 'Présent' : 'Absent'}`);
      console.log(`│   └── pnl_data: ${Array.isArray(data.data.pnl_data) ? `Array[${data.data.pnl_data.length}]` : 'Non array'}`);
    }
    
    // Explorer main_data plus en détail
    if (data.data?.main_data) {
      console.log(`\n🔍 EXPLORATION DE main_data:`);
      data.data.main_data.forEach((item, index) => {
        if (item !== null) {
          console.log(`├── main_data[${index}]: Type ${typeof item}`);
          if (typeof item === 'object') {
            console.log(`│   └── Clés: ${Object.keys(item).join(', ')}`);
            
            // Vérifier si c'est ici qu'on trouve les métriques
            if (item.result?.data?.json?.data) {
              const dataObj = item.result.data.json.data;
              console.log(`│       └── result.data.json.data présent`);
              
              // Vérifier les métriques dans cette section
              const foundMetrics = metricsToFind.filter(metric => dataObj[metric] !== undefined);
              if (foundMetrics.length > 0) {
                console.log(`│           🎯 MÉTRIQUES TROUVÉES ICI:`);
                foundMetrics.forEach(metric => {
                  console.log(`│           ├── ${metric}: ${dataObj[metric]}`);
                });
              }
            }
          }
        } else {
          console.log(`├── main_data[${index}]: null`);
        }
      });
    }
    
    // Explorer pnl_data
    if (data.data?.pnl_data) {
      console.log(`\n🔍 EXPLORATION DE pnl_data:`);
      data.data.pnl_data.forEach((item, index) => {
        console.log(`├── pnl_data[${index}]:`);
        if (item?.result?.data?.json?.data) {
          const pnlData = item.result.data.json.data;
          console.log(`│   └── result.data.json.data présent`);
          
          // Chercher les métriques dans pnl_data
          const foundMetrics = metricsToFind.filter(metric => pnlData[metric] !== undefined);
          if (foundMetrics.length > 0) {
            console.log(`│       🎯 MÉTRIQUES TROUVÉES ICI:`);
            foundMetrics.forEach(metric => {
              console.log(`│       ├── ${metric}: ${pnlData[metric]}`);
            });
          } else {
            // Afficher quelques clés pour comprendre la structure
            const keys = Object.keys(pnlData).slice(0, 10);
            console.log(`│       └── Quelques clés: ${keys.join(', ')}`);
          }
        }
      });
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

// Fonction principale
async function main() {
  const walletAddress = process.argv[2] || 'ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB';
  
  console.log(`Wallet de test: ${walletAddress}\n`);
  await exploreStructure(walletAddress);
}

// Exécution
main().catch(console.error);
