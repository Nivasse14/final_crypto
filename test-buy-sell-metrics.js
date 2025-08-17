#!/usr/bin/env node

// 🧪 Test spécifique pour les nouvelles métriques d'achat/vente de l'API Cielo
// Vérifie que les données sont bien présentes dans la structure JSON

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🧪 TEST MÉTRIQUES ACHAT/VENTE CIELO');
console.log('==================================');

async function testBuySellMetrics(walletAddress) {
  try {
    console.log(`🌐 Test API Cielo pour ${walletAddress}...`);
    
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
    
    // Vérifier la structure de la réponse
    console.log(`📋 STRUCTURE DE LA RÉPONSE:`);
    console.log(`├── data: ${data.data ? '✅' : '❌'}`);
    console.log(`├── result: ${data.result ? '✅' : '❌'}`);
    console.log(`├── success: ${data.success ? '✅' : '❌'}\n`);
    
    // Exploration de result.data.json.data (votre chemin indiqué)
    const directData = data.result?.data?.json?.data;
    
    console.log(`🎯 CHEMIN DIRECT: result.data.json.data`);
    console.log(`└── Présent: ${directData ? '✅' : '❌'}\n`);
    
    if (directData) {
      console.log(`💰 MÉTRIQUES D'ACHAT:`);
      console.log(`├── average_buy_amount_usd: ${directData.average_buy_amount_usd || 'Non trouvé'}`);
      console.log(`├── minimum_buy_amount_usd: ${directData.minimum_buy_amount_usd || 'Non trouvé'}`);
      console.log(`├── maximum_buy_amount_usd: ${directData.maximum_buy_amount_usd || 'Non trouvé'}`);
      console.log(`├── total_buy_amount_usd: ${directData.total_buy_amount_usd || 'Non trouvé'}`);
      console.log(`└── total_buy_count: ${directData.total_buy_count || 'Non trouvé'}\n`);
      
      console.log(`💸 MÉTRIQUES DE VENTE:`);
      console.log(`├── average_sell_amount_usd: ${directData.average_sell_amount_usd || 'Non trouvé'}`);
      console.log(`├── minimum_sell_amount_usd: ${directData.minimum_sell_amount_usd || 'Non trouvé'}`);
      console.log(`├── maximum_sell_amount_usd: ${directData.maximum_sell_amount_usd || 'Non trouvé'}`);
      console.log(`├── total_sell_amount_usd: ${directData.total_sell_amount_usd || 'Non trouvé'}`);
      console.log(`└── total_sell_count: ${directData.total_sell_count || 'Non trouvé'}\n`);
      
      // Vérification si toutes les métriques sont présentes
      const buyMetrics = [
        'average_buy_amount_usd', 'minimum_buy_amount_usd', 'maximum_buy_amount_usd',
        'total_buy_amount_usd', 'total_buy_count'
      ];
      
      const sellMetrics = [
        'average_sell_amount_usd', 'minimum_sell_amount_usd', 'maximum_sell_amount_usd',
        'total_sell_amount_usd', 'total_sell_count'
      ];
      
      const presentBuyMetrics = buyMetrics.filter(metric => directData[metric] !== undefined);
      const presentSellMetrics = sellMetrics.filter(metric => directData[metric] !== undefined);
      
      console.log(`📊 RÉSUMÉ:`);
      console.log(`├── Métriques d'achat trouvées: ${presentBuyMetrics.length}/${buyMetrics.length}`);
      console.log(`├── Métriques de vente trouvées: ${presentSellMetrics.length}/${sellMetrics.length}`);
      console.log(`└── Total: ${presentBuyMetrics.length + presentSellMetrics.length}/10 métriques\n`);
      
      if (presentBuyMetrics.length + presentSellMetrics.length === 10) {
        console.log(`🎉 PARFAIT ! Toutes les métriques sont disponibles`);
      } else {
        console.log(`⚠️ Métriques manquantes:`);
        const missingBuy = buyMetrics.filter(m => !presentBuyMetrics.includes(m));
        const missingSell = sellMetrics.filter(m => !presentSellMetrics.includes(m));
        
        if (missingBuy.length > 0) {
          console.log(`   Achat: ${missingBuy.join(', ')}`);
        }
        if (missingSell.length > 0) {
          console.log(`   Vente: ${missingSell.join(', ')}`);
        }
      }
    } else {
      console.log(`❌ Impossible de trouver les données au chemin result.data.json.data`);
      
      // Exploration alternative
      console.log(`\n🔍 EXPLORATION ALTERNATIVE:`);
      
      // Vérifier data.extracted_data
      const extractedData = data.data?.extracted_data;
      console.log(`├── data.extracted_data: ${extractedData ? '✅' : '❌'}`);
      
      // Vérifier data.pnl_data
      const pnlData = data.data?.pnl_data?.[0]?.result?.data?.json?.data;
      console.log(`└── data.pnl_data[0].result.data.json.data: ${pnlData ? '✅' : '❌'}`);
      
      if (pnlData) {
        console.log(`\n🎯 MÉTRIQUES DANS PNL_DATA:`);
        const buyMetrics = [
          'average_buy_amount_usd', 'minimum_buy_amount_usd', 'maximum_buy_amount_usd',
          'total_buy_amount_usd', 'total_buy_count'
        ];
        
        buyMetrics.forEach(metric => {
          console.log(`   ${metric}: ${pnlData[metric] || 'Non trouvé'}`);
        });
      }
    }
    
    // Affichage de la structure JSON pour debug
    console.log(`\n📄 STRUCTURE JSON COMPLÈTE (extrait):`);
    console.log(JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

// Fonction principale
async function main() {
  const walletAddress = process.argv[2] || 'ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB';
  
  console.log(`Wallet de test: ${walletAddress}\n`);
  await testBuySellMetrics(walletAddress);
}

// Exécution
main().catch(console.error);
