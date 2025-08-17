#!/usr/bin/env node

// 🔄 Script d'enrichissement des métriques Cielo dans wallet_registry
// Ce script met à jour les nouvelles colonnes avec les données de l'API Cielo

const SUPABASE_URL = 'https://xkndddxqqlxqknbqtefv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbmRkZHhxcWx4cWtuYnF0ZWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTY3MTEsImV4cCI6MjA2ODU5MjcxMX0.1JfLmuXhKZLhSpIVkoubfaaE9M1jAANoPjKcXZTgPgU';

console.log('🔄 ENRICHISSEMENT MÉTRIQUES CIELO');
console.log('================================');

class CieloMetricsEnricher {
  constructor() {
    this.baseHeaders = {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    };
  }

  // Récupérer les wallets à enrichir (sans métriques Cielo)
  async getWalletsToEnrich(limit = 10) {
    try {
      console.log(`📋 Récupération de ${limit} wallets à enrichir...`);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/wallet_registry?select=wallet_address,total_pnl_usd,roi&total_pnl.is.null&limit=${limit}`, {
        method: 'GET',
        headers: this.baseHeaders
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }

      const wallets = await response.json();
      console.log(`✅ ${wallets.length} wallets trouvés à enrichir`);
      
      return wallets;
    } catch (error) {
      console.log(`❌ Erreur récupération wallets: ${error.message}`);
      return [];
    }
  }

  // Récupérer les données Cielo pour un wallet
  async getCieloData(walletAddress) {
    try {
      console.log(`  🌐 Appel API Cielo pour ${walletAddress}...`);
      
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

      console.log(`  ✅ Données récupérées pour ${walletAddress}`);
      return data;
      
    } catch (error) {
      console.log(`  ❌ Erreur API Cielo pour ${walletAddress}: ${error.message}`);
      return null;
    }
  }

  // Extraire les métriques des données Cielo
  extractMetrics(cieloData) {
    try {
      const extracted = cieloData.data?.extracted_data || {};
      const pnlFast = extracted.pnl_fast?.summary || {};
      const pnlTokens = cieloData.pnl_tokens || [];
      
      // Données pnl_data pour les nouvelles métriques
      const pnlDataResult = cieloData.data?.pnl_data?.[0]?.result?.data?.json?.data || {};
      
      // Données directes depuis result.data.json.data pour les métriques d'achat/vente
      // Les métriques se trouvent dans main_data[4] (index peut varier)
      let directData = {};
      if (cieloData.data?.main_data) {
        for (const item of cieloData.data.main_data) {
          if (item?.result?.data?.json?.data) {
            const itemData = item.result.data.json.data;
            // Vérifier si cet item contient les métriques d'achat/vente
            if (itemData.average_buy_amount_usd !== undefined || itemData.total_buy_count !== undefined) {
              directData = itemData;
              break;
            }
          }
        }
      }
      
      // Calculer les métriques agrégées depuis les tokens
      let totalSwaps = 0;
      let totalHoldTime = 0;
      let firstSwapTime = null;
      let lastSwapTime = null;
      let tradingDays = new Set();
      let tokensTraded = pnlTokens.length;
      
      pnlTokens.forEach(token => {
        if (token.num_swaps) totalSwaps += token.num_swaps;
        if (token.hold_time) totalHoldTime += token.hold_time;
        
        // Timestamps (convertir depuis Unix)
        if (token.first_trade) {
          const firstTrade = new Date(token.first_trade * 1000);
          if (!firstSwapTime || firstTrade < firstSwapTime) {
            firstSwapTime = firstTrade;
          }
          tradingDays.add(firstTrade.toDateString());
        }
        
        if (token.last_trade) {
          const lastTrade = new Date(token.last_trade * 1000);
          if (!lastSwapTime || lastTrade > lastSwapTime) {
            lastSwapTime = lastTrade;
          }
          tradingDays.add(lastTrade.toDateString());
        }
      });
      
      // Mapping des métriques selon les nouvelles colonnes
      const metrics = {
        // === MÉTRIQUES ORIGINALES ===
        // Temps de détention moyen (en heures)
        average_holding_time: tokensTraded > 0 ? (totalHoldTime / tokensTraded) : null,
        
        // PnL total depuis pnl_fast.summary
        total_pnl: pnlFast.total_pnl_usd || pnlFast.combined_pnl_usd || null,
        
        // Taux de réussite (0-1) - convertir de pourcentage
        winrate: pnlFast.winrate ? (pnlFast.winrate / 100) : null,
        
        // ROI total en pourcentage
        total_roi_percentage: pnlFast.total_roi_percentage || pnlFast.combined_roi_percentage || null,
        
        // Nombre total de swaps
        swap_count: totalSwaps || null,
        
        // Timestamps des swaps
        first_swap_timestamp: firstSwapTime ? firstSwapTime.toISOString() : null,
        last_swap_timestamp: lastSwapTime ? lastSwapTime.toISOString() : null,
        
        // Jours de trading
        unique_trading_days: tradingDays.size || null,
        consecutive_trading_days: null, // Complexe à calculer, sera implémenté plus tard
        
        // Moyenne trades par token
        average_trades_per_token: tokensTraded > 0 ? (totalSwaps / tokensTraded) : null,
        
        // === NOUVELLES MÉTRIQUES DEPUIS PNL_DATA ===
        total_tokens_traded: pnlDataResult.total_tokens_traded !== undefined ? pnlDataResult.total_tokens_traded : null,
        total_unrealized_pnl_usd: pnlDataResult.total_unrealized_pnl_usd !== undefined ? pnlDataResult.total_unrealized_pnl_usd : null,
        total_unrealized_roi_percentage: pnlDataResult.total_unrealized_roi_percentage !== undefined ? pnlDataResult.total_unrealized_roi_percentage : null,
        combined_pnl_usd: pnlDataResult.combined_pnl_usd !== undefined ? pnlDataResult.combined_pnl_usd : null,
        combined_roi_percentage: pnlDataResult.combined_roi_percentage !== undefined ? pnlDataResult.combined_roi_percentage : null,
        combined_average_hold_time: pnlDataResult.combined_average_hold_time !== undefined ? pnlDataResult.combined_average_hold_time : null,
        combined_median_hold_time: pnlDataResult.combined_median_hold_time !== undefined ? pnlDataResult.combined_median_hold_time : null,
        
        // === MÉTRIQUES D'ACHAT ET DE VENTE ===
        average_buy_amount_usd: directData.average_buy_amount_usd !== undefined ? directData.average_buy_amount_usd : null,
        minimum_buy_amount_usd: directData.minimum_buy_amount_usd !== undefined ? directData.minimum_buy_amount_usd : null,
        maximum_buy_amount_usd: directData.maximum_buy_amount_usd !== undefined ? directData.maximum_buy_amount_usd : null,
        total_buy_amount_usd: directData.total_buy_amount_usd !== undefined ? directData.total_buy_amount_usd : null,
        total_buy_count: directData.total_buy_count !== undefined ? directData.total_buy_count : null,
        average_sell_amount_usd: directData.average_sell_amount_usd !== undefined ? directData.average_sell_amount_usd : null,
        minimum_sell_amount_usd: directData.minimum_sell_amount_usd !== undefined ? directData.minimum_sell_amount_usd : null,
        maximum_sell_amount_usd: directData.maximum_sell_amount_usd !== undefined ? directData.maximum_sell_amount_usd : null,
        total_sell_amount_usd: directData.total_sell_amount_usd !== undefined ? directData.total_sell_amount_usd : null,
        total_sell_count: directData.total_sell_count !== undefined ? directData.total_sell_count : null
      };

      // Debug: afficher les valeurs extraites avec plus de détails
      console.log(`  📊 Métriques extraites:`);
      console.log(`     PnL total: $${metrics.total_pnl}`);
      console.log(`     PnL combiné: $${metrics.combined_pnl_usd}`);
      console.log(`     Winrate: ${metrics.winrate ? (metrics.winrate * 100).toFixed(1) + '%' : 'N/A'}`);
      console.log(`     ROI: ${metrics.total_roi_percentage ? metrics.total_roi_percentage.toFixed(1) + '%' : 'N/A'}`);
      console.log(`     Tokens tradés: ${metrics.total_tokens_traded}`);
      console.log(`     Swaps: ${metrics.swap_count}`);
      console.log(`     Jours de trading: ${metrics.unique_trading_days}`);
      console.log(`     Achats moyens: $${metrics.average_buy_amount_usd !== null ? metrics.average_buy_amount_usd : 'N/A'}`);
      console.log(`     Ventes moyennes: $${metrics.average_sell_amount_usd !== null ? metrics.average_sell_amount_usd : 'N/A'}`);
      console.log(`     Total achats: ${metrics.total_buy_count !== null ? metrics.total_buy_count : 'N/A'} ($${metrics.total_buy_amount_usd !== null ? metrics.total_buy_amount_usd : 'N/A'})`);
      console.log(`     Total ventes: ${metrics.total_sell_count !== null ? metrics.total_sell_count : 'N/A'} ($${metrics.total_sell_amount_usd !== null ? metrics.total_sell_amount_usd : 'N/A'})`);
      console.log(`     Min/Max achats: $${metrics.minimum_buy_amount_usd !== null ? metrics.minimum_buy_amount_usd : 'N/A'} / $${metrics.maximum_buy_amount_usd !== null ? metrics.maximum_buy_amount_usd : 'N/A'}`);
      console.log(`     Min/Max ventes: $${metrics.minimum_sell_amount_usd !== null ? metrics.minimum_sell_amount_usd : 'N/A'} / $${metrics.maximum_sell_amount_usd !== null ? metrics.maximum_sell_amount_usd : 'N/A'}`);
      
      // Debug: compter les métriques non-null
      const validMetrics = Object.entries(metrics).filter(([key, value]) => value !== null && value !== undefined);
      const invalidMetrics = Object.entries(metrics).filter(([key, value]) => value === null || value === undefined);
      
      console.log(`  📈 Métriques valides (${validMetrics.length}): ${validMetrics.map(([k, v]) => k).join(', ')}`);
      if (invalidMetrics.length > 0) {
        console.log(`  ⚠️ Métriques nulles (${invalidMetrics.length}): ${invalidMetrics.map(([k, v]) => k).join(', ')}`);
      }

      return metrics;
      
    } catch (error) {
      console.log(`  ⚠️ Erreur extraction métriques: ${error.message}`);
      return {};
    }
  }

  // Mettre à jour un wallet avec les nouvelles métriques
  async updateWalletMetrics(walletAddress, metrics) {
    try {
      console.log(`  💾 Mise à jour des métriques pour ${walletAddress}...`);
      
      // Filtrer les valeurs nulles pour ne pas écraser les données existantes
      const updateData = {};
      Object.keys(metrics).forEach(key => {
        if (metrics[key] !== null && metrics[key] !== undefined) {
          updateData[key] = metrics[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        console.log(`  ⚠️ Aucune métrique valide à mettre à jour pour ${walletAddress}`);
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

      const updatedCount = Object.keys(updateData).length;
      console.log(`  ✅ ${updatedCount} métriques mises à jour pour ${walletAddress}`);
      console.log(`     ${Object.keys(updateData).join(', ')}`);
      
      return true;
      
    } catch (error) {
      console.log(`  ❌ Erreur mise à jour ${walletAddress}: ${error.message}`);
      return false;
    }
  }

  // Enrichir un wallet complet
  async enrichWallet(walletAddress) {
    console.log(`\n🎯 Enrichissement de ${walletAddress}`);
    
    // 1. Récupérer les données Cielo
    const cieloData = await this.getCieloData(walletAddress);
    if (!cieloData) {
      return { success: false, error: 'Échec récupération données Cielo' };
    }

    // 2. Extraire les métriques
    const metrics = this.extractMetrics(cieloData);
    console.log(`  📊 ${Object.keys(metrics).filter(k => metrics[k] !== null).length} métriques extraites`);

    // 3. Mettre à jour en base
    const updateSuccess = await this.updateWalletMetrics(walletAddress, metrics);
    
    return { 
      success: updateSuccess, 
      metrics: metrics,
      validMetrics: Object.keys(metrics).filter(k => metrics[k] !== null).length
    };
  }

  // Processus d'enrichissement en lot
  async enrichBatch(limit = 5, delayMs = 2000) {
    console.log(`\n🚀 DÉMARRAGE ENRICHISSEMENT EN LOT`);
    console.log(`   Limite: ${limit} wallets`);
    console.log(`   Délai entre appels: ${delayMs}ms`);

    // 1. Récupérer les wallets à enrichir
    const wallets = await this.getWalletsToEnrich(limit);
    if (wallets.length === 0) {
      console.log('ℹ️ Aucun wallet à enrichir trouvé');
      return;
    }

    // 2. Enrichir chaque wallet
    const results = [];
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      
      console.log(`\n📍 Progression: ${i + 1}/${wallets.length}`);
      const result = await this.enrichWallet(wallet.wallet_address);
      results.push({ wallet: wallet.wallet_address, ...result });
      
      // Délai entre les appels pour éviter le rate limiting
      if (i < wallets.length - 1) {
        console.log(`  ⏳ Attente ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // 3. Rapport final
    console.log(`\n📈 RAPPORT FINAL`);
    console.log(`===============`);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Succès: ${successful.length}/${results.length} wallets`);
    console.log(`❌ Échecs: ${failed.length}/${results.length} wallets`);
    
    if (successful.length > 0) {
      const totalMetrics = successful.reduce((sum, r) => sum + (r.validMetrics || 0), 0);
      console.log(`📊 Total métriques ajoutées: ${totalMetrics}`);
      console.log(`📈 Moyenne par wallet: ${(totalMetrics / successful.length).toFixed(1)} métriques`);
    }

    if (failed.length > 0) {
      console.log(`\n❌ Wallets en échec:`);
      failed.forEach(f => {
        console.log(`   ${f.wallet}: ${f.error || 'Erreur inconnue'}`);
      });
    }

    return { successful: successful.length, failed: failed.length, total: results.length };
  }

  // Test sur un wallet spécifique
  async testSingleWallet(walletAddress) {
    console.log(`\n🧪 TEST SUR WALLET SPÉCIFIQUE: ${walletAddress}`);
    console.log('===============================================');
    
    const result = await this.enrichWallet(walletAddress);
    
    if (result.success) {
      console.log(`\n✅ ENRICHISSEMENT RÉUSSI !`);
      console.log(`📊 Métriques ajoutées: ${result.validMetrics}`);
      console.log(`📋 Détail des métriques:`);
      
      Object.keys(result.metrics).forEach(key => {
        const value = result.metrics[key];
        if (value !== null) {
          console.log(`   ${key}: ${value}`);
        }
      });
    } else {
      console.log(`\n❌ ÉCHEC DE L'ENRICHISSEMENT`);
      console.log(`Erreur: ${result.error}`);
    }
    
    return result;
  }
}

// Fonction principale
async function main() {
  const enricher = new CieloMetricsEnricher();
  
  // Récupérer les arguments de ligne de commande
  const args = process.argv.slice(2);
  const mode = args[0] || 'batch';
  
  if (mode === 'test' && args[1]) {
    // Mode test sur un wallet spécifique
    await enricher.testSingleWallet(args[1]);
  } else if (mode === 'batch') {
    // Mode batch
    const limit = parseInt(args[1]) || 5;
    const delay = parseInt(args[2]) || 2000;
    await enricher.enrichBatch(limit, delay);
  } else {
    console.log(`\n📖 UTILISATION:`);
    console.log(`node enrich-cielo-metrics.js batch [limit] [delay]`);
    console.log(`node enrich-cielo-metrics.js test [wallet_address]`);
    console.log(`\nExemples:`);
    console.log(`node enrich-cielo-metrics.js batch 3 3000    # 3 wallets, 3s de délai`);
    console.log(`node enrich-cielo-metrics.js test ABdAsGjQv1bLLvzgcqEWJmAuwNbUJyfNUausyTVe7STB`);
  }
}

// Exécution
main().catch(console.error);
