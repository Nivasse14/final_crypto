#!/usr/bin/env node

// 🚀 SOLUTION HYBRIDE : Auto-enrichissement intelligent
// Enrichit automatiquement les wallets qui ont cielo_complete_data mais pas de métriques

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🚀 AUTO-ENRICHISSEMENT CIELO INTELLIGENT');
console.log('========================================');

class AutoCieloEnricher {
  constructor() {
    this.baseHeaders = {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    };
  }

  // Récupérer les wallets avec données Cielo mais sans métriques enrichies
  async getWalletsNeedingEnrichment(limit = 10) {
    try {
      console.log(`📋 Recherche de wallets avec données Cielo non enrichies...`);
      
      // Chercher les wallets qui ont cielo_complete_data mais total_pnl null
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/wallet_registry?select=wallet_address,cielo_complete_data,total_pnl&cielo_complete_data=not.is.null&total_pnl=is.null&limit=${limit}`,
        {
          method: 'GET',
          headers: this.baseHeaders
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const wallets = await response.json();
      console.log(`✅ ${wallets.length} wallets trouvés à enrichir (ont des données Cielo)`);
      
      return wallets;
    } catch (error) {
      console.log(`❌ Erreur récupération wallets: ${error.message}`);
      return [];
    }
  }

  // Enrichir depuis les données stockées (sans appel API)
  async enrichFromStoredData(wallet) {
    try {
      console.log(`\n🎯 Enrichissement depuis données stockées: ${wallet.wallet_address}`);
      
      // Parser les données Cielo stockées
      let cieloData;
      if (typeof wallet.cielo_complete_data === 'string') {
        cieloData = JSON.parse(wallet.cielo_complete_data);
      } else {
        cieloData = wallet.cielo_complete_data; // Déjà un objet
      }
      
      console.log(`  📋 Type de données: ${typeof wallet.cielo_complete_data}`);
      
      // Extraire les métriques (même logique que le script principal)
      const metrics = this.extractMetricsFromStoredData(cieloData);
      
      if (Object.keys(metrics).filter(k => metrics[k] !== null).length === 0) {
        console.log(`  ⚠️ Aucune métrique extractible pour ${wallet.wallet_address}`);
        return { success: false, error: 'Pas de métriques extractibles' };
      }

      // Mettre à jour en base
      const updateSuccess = await this.updateWalletMetrics(wallet.wallet_address, metrics);
      
      return { 
        success: updateSuccess, 
        metrics: metrics,
        validMetrics: Object.keys(metrics).filter(k => metrics[k] !== null).length
      };
      
    } catch (error) {
      console.log(`  ❌ Erreur enrichissement ${wallet.wallet_address}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Extraction depuis données stockées
  extractMetricsFromStoredData(cieloData) {
    try {
      // Adapter la logique du script principal pour les données stockées
      const pnlData = cieloData.pnl_data?.[0]?.result?.data?.json?.data || {};
      
      // Chercher les métriques d'achat/vente dans les données
      let buysellData = {};
      
      // Essayer de trouver dans différents endroits de la structure
      if (pnlData.tokens && Array.isArray(pnlData.tokens)) {
        // Calculer les métriques d'achat/vente depuis les tokens
        buysellData = this.calculateBuySellMetrics(pnlData.tokens);
      }
      
      return {
        // Métriques depuis pnl_data
        total_tokens_traded: pnlData.total_tokens_traded || pnlData.tokens?.length || null,
        total_pnl: pnlData.total_pnl_usd || null,
        winrate: pnlData.winrate ? (pnlData.winrate / 100) : null,
        total_roi_percentage: pnlData.total_roi_percentage || null,
        
        // Métriques calculées d'achat/vente
        ...buysellData
      };
      
    } catch (error) {
      console.log(`  ⚠️ Erreur extraction: ${error.message}`);
      return {};
    }
  }

  // Calculer métriques d'achat/vente depuis les tokens
  calculateBuySellMetrics(tokens) {
    try {
      let totalBuyAmount = 0;
      let totalSellAmount = 0;
      let totalBuyCount = 0;
      let totalSellCount = 0;
      let buyAmounts = [];
      let sellAmounts = [];
      
      tokens.forEach(token => {
        if (token.total_buy_usd) {
          totalBuyAmount += token.total_buy_usd;
          buyAmounts.push(token.total_buy_usd);
          totalBuyCount += token.num_swaps || 0; // Approximation
        }
        
        if (token.total_sell_usd) {
          totalSellAmount += token.total_sell_usd;
          sellAmounts.push(token.total_sell_usd);
          totalSellCount += token.num_swaps || 0; // Approximation
        }
      });
      
      return {
        average_buy_amount_usd: buyAmounts.length > 0 ? (totalBuyAmount / buyAmounts.length) : null,
        minimum_buy_amount_usd: buyAmounts.length > 0 ? Math.min(...buyAmounts) : null,
        maximum_buy_amount_usd: buyAmounts.length > 0 ? Math.max(...buyAmounts) : null,
        total_buy_amount_usd: totalBuyAmount || null,
        total_buy_count: totalBuyCount || null,
        
        average_sell_amount_usd: sellAmounts.length > 0 ? (totalSellAmount / sellAmounts.length) : null,
        minimum_sell_amount_usd: sellAmounts.length > 0 ? Math.min(...sellAmounts) : null,
        maximum_sell_amount_usd: sellAmounts.length > 0 ? Math.max(...sellAmounts) : null,
        total_sell_amount_usd: totalSellAmount || null,
        total_sell_count: totalSellCount || null
      };
      
    } catch (error) {
      console.log(`  ⚠️ Erreur calcul buy/sell: ${error.message}`);
      return {};
    }
  }

  // Mettre à jour les métriques (même fonction que le script principal)
  async updateWalletMetrics(walletAddress, metrics) {
    try {
      console.log(`  💾 Mise à jour des métriques pour ${walletAddress}...`);
      
      const updateData = {};
      Object.keys(metrics).forEach(key => {
        if (metrics[key] !== null && metrics[key] !== undefined) {
          updateData[key] = metrics[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        console.log(`  ⚠️ Aucune métrique valide à mettre à jour`);
        return false;
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?wallet_address=eq.${walletAddress}`, {
        method: 'PATCH',
        headers: this.baseHeaders,
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.status} - ${errorText}`);
      }

      console.log(`  ✅ ${Object.keys(updateData).length} métriques mises à jour`);
      return true;
      
    } catch (error) {
      console.log(`  ❌ Erreur mise à jour: ${error.message}`);
      return false;
    }
  }

  // Process principal
  async runAutoEnrichment(limit = 10) {
    console.log(`\n🚀 DÉMARRAGE AUTO-ENRICHISSEMENT`);
    console.log(`   Limite: ${limit} wallets`);

    // 1. Trouver les wallets à enrichir
    const wallets = await this.getWalletsNeedingEnrichment(limit);
    
    if (wallets.length === 0) {
      console.log('ℹ️ Aucun wallet nécessitant un enrichissement');
      return { processed: 0, successful: 0, failed: 0 };
    }

    // 2. Enrichir chaque wallet
    const results = [];
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      
      console.log(`\n📍 Progression: ${i + 1}/${wallets.length}`);
      const result = await this.enrichFromStoredData(wallet);
      results.push({ wallet: wallet.wallet_address, ...result });
      
      // Délai entre traitements
      if (i < wallets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 3. Rapport
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n📈 RAPPORT AUTO-ENRICHISSEMENT`);
    console.log(`===============================`);
    console.log(`✅ Succès: ${successful.length}/${results.length}`);
    console.log(`❌ Échecs: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
      const totalMetrics = successful.reduce((sum, r) => sum + (r.validMetrics || 0), 0);
      console.log(`📊 Total métriques ajoutées: ${totalMetrics}`);
    }

    return { processed: results.length, successful: successful.length, failed: failed.length };
  }
}

// Fonction principale
async function main() {
  const enricher = new AutoCieloEnricher();
  
  const limit = parseInt(process.argv[2]) || 10;
  const result = await enricher.runAutoEnrichment(limit);
  
  console.log(`\n🎯 RÉSULTAT FINAL:`);
  console.log(`   Traités: ${result.processed}`);
  console.log(`   Succès: ${result.successful}`);
  console.log(`   Échecs: ${result.failed}`);
}

// Exécution
main().catch(console.error);
